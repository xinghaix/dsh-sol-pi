/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { archiveBody } from "../sol-core/evidence-preserving-reducer/archive.ts";
import {
	DIAGNOSTIC_COMMAND,
	LIKELY_SECRET,
	REDUCER_RECEIPT_PREFIX,
} from "../sol-core/evidence-preserving-reducer/config.ts";
import {
	receiptText,
	reducerInput,
	reducerInstructions,
	validateReceipt,
	type ReducerProviderResult,
} from "../sol-core/evidence-preserving-reducer/receipt.ts";
import {
	THEN_RUN_FAILED,
	THEN_RUN_SUCCEEDED,
} from "../sol-core/action-fusion/then-run.ts";
import type { EvidencePreservingReducerConfig } from "./config.ts";
import type { ContentBlock, DshAgent, DshContext, ToolExecution, ToolExecutionResult } from "./host.ts";
import {
	acceptContent,
	contentFromDecision,
	executionAgent,
	listenPostExecute,
	recordValue,
	textOf,
} from "./host.ts";
import { solDshRuntimeRoot } from "./runtime-root.ts";

export type ReductionSkipReason =
	| "not-candidate"
	| "small"
	| "huge"
	| "secret"
	| "non-diagnostic"
	| "receipt";

export function commandFromExecution(exec: ToolExecution): string | undefined {
	if (exec.name === "bash") {
		const command = recordValue(exec.args, "command");
		return typeof command === "string" && command.length > 0 ? command : undefined;
	}
	if (exec.name !== "write" && exec.name !== "edit") return undefined;
	const thenRun = recordValue(exec.args, "then_run");
	const command = recordValue(thenRun, "command");
	return typeof command === "string" && command.length > 0 ? command : undefined;
}

export function reducibleBody(exec: ToolExecution, result: ToolExecutionResult): string | undefined {
	const inline = textOf(result.content);
	if (exec.name === "bash") return inline || undefined;
	if (exec.name !== "write" && exec.name !== "edit") return undefined;
	const marker = result.isError ? THEN_RUN_FAILED : THEN_RUN_SUCCEEDED;
	const markerIndex = inline.indexOf(marker);
	if (markerIndex < 0) return undefined;
	return inline.slice(markerIndex + marker.length).replace(/^(?:\r?\n)+/u, "");
}

export function reductionEligibility(
	command: string,
	body: string,
	config: EvidencePreservingReducerConfig,
): ReductionSkipReason | "reduce" {
	if (body.split("\n").some((line) => line === REDUCER_RECEIPT_PREFIX)) return "receipt";
	const bytes = Buffer.byteLength(body, "utf8");
	if (bytes < config.minBytes) return "small";
	if (body.length > config.maxChars) return "huge";
	if (LIKELY_SECRET.test(body)) return "secret";
	if (!DIAGNOSTIC_COMMAND.test(command)) return "non-diagnostic";
	return "reduce";
}

async function collectStreamText(
	ctx: DshContext,
	options: Record<string, unknown>,
): Promise<{ text: string; usageTokens: number }> {
	let text = "";
	let usageTokens = 0;
	for await (const chunk of ctx.llm.stream(options)) {
		if (chunk.type === "text-delta" && typeof chunk.text === "string") text += chunk.text;
		else if (chunk.type === "text" && typeof chunk.text === "string") text += chunk.text;
		else if (typeof chunk.delta === "string") text += chunk.delta;
		const usage = chunk.usage as { totalTokens?: number } | undefined;
		if (usage && typeof usage.totalTokens === "number") usageTokens = usage.totalTokens;
	}
	return { text, usageTokens };
}

function agentRoute(agent: DshAgent | undefined): { provider?: string; model?: string } {
	const session = agent?.session as Record<string, unknown> | undefined;
	const model = session?.model as Record<string, unknown> | undefined;
	return {
		provider: typeof model?.provider === "string" ? model.provider : typeof session?.provider === "string" ? session.provider : undefined,
		model: typeof model?.id === "string" ? model.id : typeof session?.modelId === "string" ? session.modelId : undefined,
	};
}

export async function reduceDiagnosticResult(
	ctx: DshContext,
	exec: ToolExecution,
	result: ToolExecutionResult,
	config: EvidencePreservingReducerConfig,
	agent: DshAgent | undefined,
): Promise<ToolExecutionResult | undefined> {
	const command = commandFromExecution(exec);
	if (!command) return undefined;
	const body = reducibleBody(exec, result);
	if (body === undefined) return undefined;
	if (reductionEligibility(command, body, config) !== "reduce") return undefined;

	const provider = config.reducerProvider || agentRoute(agent).provider;
	const model = config.reducerModel || agentRoute(agent).model;
	if (!provider || !model) return undefined;

	const archive = await archiveBody(`${solDshRuntimeRoot(agent)}/evidence-preserving-reducer`, body);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), config.timeoutMs);
	try {
		const { text, usageTokens } = await collectStreamText(ctx, {
			provider,
			model,
			system: reducerInstructions(),
			messages: [{ role: "user", content: [{ type: "text", text: reducerInput(command, Boolean(result.isError), archive, body) }] }],
			maxTokens: config.maxOutputTokens,
			signal: controller.signal,
		});
		const validated = validateReceipt(text, archive, body, Boolean(result.isError));
		if (!validated.ok) return undefined;
		const providerResult: ReducerProviderResult = {
			errorMessage: undefined,
			model,
			ok: true,
			outputText: text,
			provider,
			stopReason: "stop",
			usage: { totalTokens: usageTokens },
		};
		const receipt = receiptText(command, archive, validated.value, providerResult);
		return projectReceipt(exec, result, receipt);
	} catch {
		return undefined;
	} finally {
		clearTimeout(timer);
	}
}

function projectReceipt(exec: ToolExecution, result: ToolExecutionResult, receipt: string): ToolExecutionResult {
	const content = result.content ? [...result.content] : [];
	if (exec.name === "bash") {
		return { ...result, content: [{ type: "text", text: receipt }] };
	}
	const marker = result.isError ? THEN_RUN_FAILED : THEN_RUN_SUCCEEDED;
	let replaced = false;
	const next = content.map((block) => {
		if (replaced || block.type !== "text" || typeof block.text !== "string") return block;
		const markerIndex = block.text.indexOf(marker);
		if (markerIndex < 0) return block;
		replaced = true;
		return { ...block, text: `${block.text.slice(0, markerIndex + marker.length)}\n${receipt}` };
	});
	if (!replaced) next.push({ type: "text", text: receipt });
	return { ...result, content: next as ContentBlock[] };
}

export function registerEvidencePreservingReducer(
	ctx: DshContext,
	configOf: () => EvidencePreservingReducerConfig,
): void {
	listenPostExecute(ctx, async (exec, result, decision) => {
		const config = configOf();
		if (!config.enabled) return decision;
		if (decision.kind !== "accept") return decision;
		const content = contentFromDecision(decision, result);
		const reduced = await reduceDiagnosticResult(
			ctx,
			exec,
			{ ...result, content: content ?? result.content },
			config,
			executionAgent(exec),
		);
		if (!reduced?.content) return decision;
		return acceptContent(decision, [...reduced.content]);
	});
}


