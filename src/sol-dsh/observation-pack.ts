/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import {
	createObservationFromText,
	ensureStored,
	placeholderFor,
} from "../sol-core/observation-pack/observation.ts";
import type { ObservationPackConfig } from "./config.ts";
import type { ContentBlock, DshAgent, DshContext, ToolExecution, ToolExecutionResult } from "./host.ts";
import { textOf } from "./host.ts";
import { solDshRuntimeRoot } from "./runtime-root.ts";

function retrieveHint(path: string, locator: string | undefined): string {
	if (locator) return `read or grep the spill locator ${locator}`;
	return `read ${path} with offset 0; continue from the returned window`;
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
	const observation = createObservationFromText(
		exec.name,
		String(exec.id ?? exec.token ?? `${exec.name}:${text.length}`),
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
	// spillStore is optional — capture via nested inject; never touch ctx.spillStore on the root fiber.
	let spill: DshContext["spillStore"];
	if (typeof ctx.inject === "function") {
		ctx.inject(["spillStore"], (child) => {
			spill = child.spillStore;
			child.effect?.(() => () => {
				spill = undefined;
			});
		});
	}

	ctx.on(
		"tools/post-execute",
		(async (exec: ToolExecution, _result: ToolExecutionResult, next: () => Promise<ToolExecutionResult>) => {
			const decided = await next();
			const config = configOf();
			if (!config.enabled) return decided;
			try {
				const packed = await packObservation(
					exec,
					decided,
					config,
					exec.caller as DshAgent | undefined,
					spill,
				);
				return packed ?? decided;
			} catch {
				return decided;
			}
		}) as (...args: never[]) => unknown,
		true,
	);
}
