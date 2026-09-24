/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { registerActionFusion } from "./action-fusion.ts";
import { Config, type SolDshConfig } from "./config.ts";
import { registerEvidencePreservingReducer } from "./epr.ts";
import type { DshContext } from "./host.ts";
import { registerOnlineContextCompact } from "./occ.ts";
import { registerObservationPack } from "./observation-pack.ts";
import { liveSolDshConfig } from "./settings.ts";

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
	// Entry config is the settings document (id dsh-sol-pi). Live edits arrive
	// via Schemastery volatile refs — installSection was removed in 0.1.7.
	const source = liveSolDshConfig(config);

	// EPR must register first (inner prepend) so diagnostic logs reduce before
	// ObservationPack replaces them with a preview that looks "too small".
	registerEvidencePreservingReducer(ctx, () => source().evidencePreservingReducer);
	registerObservationPack(ctx, () => source().observationPack);
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
						"edit and write accept optional then_run {command, timeout?}. After a successful file mutation, you MUST pass then_run for the immediate format/test/build instead of a later bash call.",
					);
				}
				if (current.observationPack.enabled && current.observationPack.mode === "immediate") {
					parts.push(
						"Oversized command dumps (go test, make, fused then_run) are stored as a preview; read, grep, and git diff/show stay in full. Retrieve a dump with read/grep on the given path or locator.",
					);
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
