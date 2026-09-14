/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { resolveToolPath, withFusedFileQueue } from "../sol-core/action-fusion/file-queue.ts";
import {
	assertUnchangedBeforeCommand,
	formatThenRunFailure,
	formatThenRunSuccess,
	THEN_RUN_SKIPPED,
	thenRunSkippedError,
	type ThenRunInput,
} from "../sol-core/action-fusion/then-run.ts";
import type { ContentBlock, DshAgent, DshContext, ToolDefinition, ToolExecution, ToolExecutionResult } from "./host.ts";
import { recordValue, textOf } from "./host.ts";
import { sessionCwd } from "./runtime-root.ts";

const THEN_RUN_SCHEMA = {
	type: "object",
	additionalProperties: false,
	description:
		"Command to run next on this file after the mutation succeeds — e.g. run, build, start/restart, install, or check it; optional timeout in seconds. Skipped if the mutation fails; a non-zero exit is reported but keeps the mutation.",
	properties: {
		command: { type: "string", description: "Bash command to run" },
		timeout: { type: "number", description: "Timeout in seconds (optional, no default timeout)" },
	},
	required: ["command"],
} as const;

const FUSED_TOOLS = ["edit", "write"] as const;

function thenRunFromArgs(args: unknown): ThenRunInput | undefined {
	const thenRun = recordValue(args, "then_run");
	const command = recordValue(thenRun, "command");
	if (typeof command !== "string" || command.length === 0) return undefined;
	const timeout = recordValue(thenRun, "timeout");
	return {
		command,
		timeout: typeof timeout === "number" ? timeout : undefined,
	};
}

function mutationPath(args: unknown): string | undefined {
	const path = recordValue(args, "path") ?? recordValue(args, "file_path") ?? recordValue(args, "filePath");
	return typeof path === "string" && path.length > 0 ? path : undefined;
}

function withoutThenRun(args: unknown): unknown {
	if (typeof args !== "object" || args === null || Array.isArray(args)) return args;
	const { then_run: _ignored, ...rest } = args as Record<string, unknown>;
	return rest;
}

function extendParameters(parameters: Record<string, unknown>): Record<string, unknown> {
	const properties =
		parameters.properties && typeof parameters.properties === "object" && !Array.isArray(parameters.properties)
			? (parameters.properties as Record<string, unknown>)
			: parameters;
	const usingJsonSchemaRoot = "type" in parameters || "properties" in parameters;
	if (usingJsonSchemaRoot) {
		return {
			...parameters,
			type: "object",
			properties: { ...properties, then_run: THEN_RUN_SCHEMA },
		};
	}
	return { ...parameters, then_run: THEN_RUN_SCHEMA };
}

async function runBash(
	ctx: DshContext,
	thenRun: ThenRunInput,
	exec: ToolExecution,
): Promise<ToolExecutionResult> {
	const args: Record<string, unknown> = { command: thenRun.command };
	if (thenRun.timeout !== undefined) args.timeout = thenRun.timeout;
	return ctx.tools.execute({
		name: "bash",
		args,
		caller: exec.caller,
		signal: exec.signal,
	});
}

function wrapTool(ctx: DshContext, agent: DshAgent, name: (typeof FUSED_TOOLS)[number], base: ToolDefinition): ToolDefinition {
	const extras = new Map<string | symbol, string>();
	const extraKey = (exec: ToolExecution) => exec.token ?? exec.id ?? `${name}:${JSON.stringify(exec.args)}`;
	return {
		...base,
		name,
		description: `${base.description}\n\nOptional then_run: after a successful mutation, run one bash command and return its output in the same observation.`,
		parameters: extendParameters(base.parameters ?? {}),
		isConcurrencySafe: () => false,
		async execute(args: unknown, exec: ToolExecution) {
			const thenRun = thenRunFromArgs(args);
			const rest = withoutThenRun(args);
			const relativePath = mutationPath(args);
			const absolutePath = relativePath ? resolveToolPath(sessionCwd(agent), relativePath) : undefined;
			const work = async () => {
				try {
					return await base.execute(rest, exec);
				} catch (error) {
					if (thenRun) throw thenRunSkippedError(error);
					throw error;
				}
			};
			const value = absolutePath ? await withFusedFileQueue(absolutePath, work) : await work();
			if (!thenRun) return value;
			if (!absolutePath) {
				extras.set(extraKey(exec), `${THEN_RUN_SKIPPED} mutation path is unavailable; the command was not run.`);
				return value;
			}
			try {
				await assertUnchangedBeforeCommand(absolutePath);
				const bashResult = await runBash(ctx, thenRun, exec);
				const output = textOf(bashResult.content);
				extras.set(
					extraKey(exec),
					bashResult.isError ? formatThenRunFailure(output, new Error(output || "bash failed")) : formatThenRunSuccess(output),
				);
			} catch (error) {
				extras.set(extraKey(exec), formatThenRunFailure("", error));
			}
			return value;
		},
		finalizeContent(exec: ToolExecution, result: ToolExecutionResult) {
			const extra = extras.get(extraKey(exec));
			const baseContent = base.finalizeContent?.(exec, result) ?? (result.content as ContentBlock[] | undefined);
			if (!extra) return baseContent;
			const blocks = baseContent ? [...baseContent] : [];
			blocks.push({ type: "text", text: extra });
			return blocks;
		},
	};
}

export function registerActionFusion(ctx: DshContext, enabled: () => boolean = () => true): void {
	ctx.on("agent/session-start", ((payload: { agent?: DshAgent }) => {
		if (!enabled()) return;
		const agent = payload?.agent;
		if (!agent?.ctx?.tools) return;
		for (const name of FUSED_TOOLS) {
			const base = ctx.tools.get(name);
			if (!base) continue;
			agent.ctx.tools.register(wrapTool(ctx, agent, name, base));
		}
	}) as (...args: never[]) => unknown);

	ctx.systemPrompt?.section({
		id: "sol-dsh-action-fusion",
		description: "SoL action fusion then_run",
		source: () =>
			"edit and write accept optional then_run { command, timeout? }. After a successful file mutation, the command runs in the same observation. Do not split a mutation and its immediate test/build/run into two turns.",
	});
}
