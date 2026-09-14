/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { registerActionFusion } from "./action-fusion.ts";
import { Config, resolveSolDshConfig, type SolDshConfig } from "./config.ts";
import { registerEvidencePreservingReducer } from "./epr.ts";
import type { DshContext } from "./host.ts";
import { registerOnlineContextCompact } from "./occ.ts";
import { registerObservationPack } from "./observation-pack.ts";
import { installSolDshSettings } from "./settings.ts";

export const name = "dsh-sol-pi";

/** Required services. Optional ones (settings, compaction, spill, prompts) attach via inject. */
export const inject = ["tools", "llm"];

export { Config };
export type { SolDshConfig };

/**
 * Native DeepSeek Harness plugin. Named exports only — a default export would
 * drop `inject` in Cordis `unwrapExports`.
 */
export function apply(ctx: DshContext, config: SolDshConfig | Record<string, unknown> = {}): void {
	let live = resolveSolDshConfig(config);
	const source = installSolDshSettings(ctx, live, (next) => {
		live = next;
	});

	registerObservationPack(ctx, () => source().observationPack);
	registerEvidencePreservingReducer(ctx, () => source().evidencePreservingReducer);
	registerActionFusion(ctx, () => source().actionFusion.enabled);
	registerOnlineContextCompact(ctx, () => source().onlineContextCompact);

	ctx.inject?.(["systemPrompt"], (child) => {
		const prompt = child.systemPrompt;
		if (!prompt?.section) return;
		const order = prompt.getSectionOrder?.("TOOL_EDIT") ?? 800;
		prompt.section({
			name: "dsh-sol-pi",
			order,
			text: () => {
				const current = source();
				const parts = ["SoL (dsh-sol-pi) is active."];
				if (current.actionFusion.enabled) {
					parts.push(
						"edit and write accept optional then_run {command, timeout?}. After a successful file mutation, run that bash command in the same observation — do not split a mutation and its immediate test/build/run into two turns.",
					);
				}
				if (current.observationPack.enabled && current.observationPack.mode === "immediate") {
					parts.push("Large tool results are stored and shown as a preview; retrieve with read/grep on the given path or locator.");
				}
				if (current.evidencePreservingReducer.enabled) {
					parts.push("Long diagnostic logs may be replaced with a verified evidence receipt pointing at a local archive.");
				}
				if (current.onlineContextCompact.enabled) {
					parts.push("Keep todo_write current. Completed work may be compacted when the remaining horizon repays cache cost.");
				}
				return parts.join(" ");
			},
		});
	});
}
