/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import {
	createObservationFromText,
	ensureStored,
	placeholderFor,
	shouldReplaceObservationAtBirth,
} from "../sol-core/observation-pack/observation.ts";
import type { ObservationPackConfig } from "./config.ts";
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

function retrieveHint(path: string, locator: string | undefined): string {
	if (locator) return `read or grep the spill locator ${locator}`;
	return `read ${path} with offset 0; continue from the returned window`;
}

function dumpCommand(exec: ToolExecution): string | undefined {
	if (exec.name === "bash") {
		const command = recordValue(exec.args, "command");
		return typeof command === "string" && command.length > 0 ? command : undefined;
	}
	if (exec.name !== "edit" && exec.name !== "write") return undefined;
	const command = recordValue(recordValue(exec.args, "then_run"), "command");
	return typeof command === "string" && command.length > 0 ? command : undefined;
}

export async function packObservation(
	exec: ToolExecution,
	result: ToolExecutionResult,
	config: ObservationPackConfig,
	agent: DshAgent | undefined,
	spill?: DshContext["spillStore"],
): Promise<ToolExecutionResult | undefined> {
	if (result.isError) return undefined;
	const text = textOf(result.content);
	if (!text) return undefined;
	// Immediate dialect cannot give FULL_SENDS of the original. Do not replace
	// read/grep/knowledge results the model still needs this turn.
	if (config.mode === "immediate" && !shouldReplaceObservationAtBirth(exec.name, dumpCommand(exec))) {
		return undefined;
	}
	const observation = createObservationFromText(
		exec.name,
		String(exec.id ?? exec.callId ?? exec.token ?? `${exec.name}:${text.length}`),
		text,
		solDshRuntimeRoot(agent),
		config.thresholdBytes,
	);
	if (!observation) return undefined;
	await ensureStored(observation);
	let locator: string | undefined;
	if (spill) {
		try {
			const saved = await spill.saveText({ text: observation.text, mediaType: "text/plain" });
			locator = saved.locator;
		} catch {
			locator = undefined;
		}
	}
	if (config.mode === "delayed") {
		// Birth stays full (append-only). DSH has no silent projection hook; delayed
		// therefore archives for recall and lets native spill/compaction shrink later.
		return undefined;
	}
	const placeholder = placeholderFor(observation, {
		fullSends: 0,
		excerptBytes: config.placeholderExcerptBytes,
		retrieve: retrieveHint(observation.filePath, locator),
	});
	return {
		...result,
		content: [{ type: "text", text: placeholder }] satisfies ContentBlock[],
	};
}

export function registerObservationPack(ctx: DshContext, configOf: () => ObservationPackConfig): void {
	let spill: DshContext["spillStore"];
	if (typeof ctx.inject === "function") {
		ctx.inject(["spillStore"], (child) => {
			spill = child.spillStore;
			child.effect?.(() => () => {
				spill = undefined;
			});
		});
	}

	listenPostExecute(ctx, async (exec, result, decision) => {
		const config = configOf();
		if (!config.enabled) return decision;
		if (decision.kind !== "accept" || exec.parent !== undefined) return decision;
		const content = contentFromDecision(decision, result);
		if (!content) return decision;
		const packed = await packObservation(exec, { ...result, content }, config, executionAgent(exec), spill);
		if (!packed?.content) return decision;
		return acceptContent(decision, [...packed.content]);
	});
}
