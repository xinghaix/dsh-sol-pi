/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { apply } from "../src/sol-dsh/index.ts";
import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig } from "../src/sol-dsh/config.ts";
import { reductionEligibility } from "../src/sol-dsh/epr.ts";
import { zh, en } from "../src/sol-dsh/client/locales.ts";
import { decideCompaction, DEFAULT_COMPACTION_ECONOMICS } from "../src/sol-core/online-context-compact/economics.ts";
import { createObservationFromText, placeholderFor } from "../src/sol-core/observation-pack/observation.ts";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("sol-dsh config", () => {
	it("fills the DSH best profile when omitted", () => {
		expect(DEFAULT_SOL_DSH_CONFIG.actionFusion.enabled).toBe(true);
		expect(DEFAULT_SOL_DSH_CONFIG.observationPack).toMatchObject({
			enabled: true,
			mode: "immediate",
			fullSends: 0,
			thresholdBytes: 10_240,
		});
		expect(DEFAULT_SOL_DSH_CONFIG.evidencePreservingReducer.enabled).toBe(true);
		expect(DEFAULT_SOL_DSH_CONFIG.evidencePreservingReducer.reducerProvider).toBe("");
		expect(DEFAULT_SOL_DSH_CONFIG.onlineContextCompact.cacheWriteReadRatio).toBe(50);
		expect(DEFAULT_SOL_DSH_CONFIG.onlineContextCompact.keepRecentTokens).toBe(0);
	});

	it("keeps sibling defaults when a nested metric is overridden", () => {
		const config = resolveSolDshConfig({
			onlineContextCompact: { cacheWriteReadRatio: 30 },
		});
		expect(config.onlineContextCompact.cacheWriteReadRatio).toBe(30);
		expect(config.onlineContextCompact.enabled).toBe(true);
		expect(config.actionFusion.enabled).toBe(true);
	});

	it("rejects immediate mode with fullSends", () => {
		expect(() =>
			resolveSolDshConfig({
				observationPack: { mode: "immediate", fullSends: 2 },
			}),
		).toThrow(/fullSends/);
	});

	it("rejects a half-specified reducer route", () => {
		expect(() =>
			resolveSolDshConfig({
				evidencePreservingReducer: { reducerProvider: "deepseek" },
			}),
		).toThrow(/reducerProvider/);
	});

	it("rejects unknown and credential keys", () => {
		expect(() => resolveSolDshConfig({ locale: "zh" })).toThrow(/forbidden|unknown/i);
		expect(() => resolveSolDshConfig({ apiKey: "secret" })).toThrow(/forbidden/);
		expect(() => resolveSolDshConfig({ extra: true })).toThrow(/unknown/);
	});
});

describe("sol-dsh locale dictionaries", () => {
	it("ships identical zh and en keys", () => {
		expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
	});
});

describe("sol-dsh EPR eligibility", () => {
	const config = DEFAULT_SOL_DSH_CONFIG.evidencePreservingReducer;

	it("reduces a diagnostic pytest log", () => {
		const body = `${"error: boom\n".repeat(500)}`;
		expect(reductionEligibility("pytest -q", body, config)).toBe("reduce");
	});

	it("skips secrets and tiny logs", () => {
		expect(reductionEligibility("pytest", "short", config)).toBe("small");
		expect(reductionEligibility("pytest", `api_key=abcd\n${"x".repeat(5000)}`, config)).toBe("secret");
		expect(reductionEligibility("echo hi", `${"line\n".repeat(900)}`, config)).toBe("non-diagnostic");
	});
});

describe("sol-dsh observation placeholder", () => {
	it("points retrieval at read/grep instead of obs_recall", () => {
		const root = mkdtempSync(join(tmpdir(), "sol-dsh-obs-"));
		const observation = createObservationFromText("bash", "call-1", "a".repeat(20_000), root, 10_240);
		expect(observation).toBeDefined();
		const text = placeholderFor(observation!, {
			fullSends: 0,
			excerptBytes: 1024,
			retrieve: "read or grep the spill locator spill:1",
		});
		expect(text).toContain("read or grep");
		expect(text).not.toContain("obs_recall");
	});
});

describe("sol-dsh apply", () => {
	it("registers native listeners without a default export", async () => {
		const events: string[] = [];
		const ctx: {
			on(event: string, _listener: (...args: never[]) => unknown): () => void;
			inject(deps: readonly string[], callback: (child: never) => void): void;
			tools: {
				get(): undefined;
				register(): () => void;
				execute: () => Promise<{ content: never[] }>;
			};
			llm: { stream: () => AsyncGenerator };
		} = {
			on(event: string, _listener: (...args: never[]) => unknown) {
				events.push(event);
				return () => {};
			},
			inject(deps: readonly string[], callback: (child: never) => void) {
				const child = {
					on(event: string, _listener: (...args: never[]) => unknown) {
						events.push(event);
						return () => {};
					},
					compaction: deps.includes("compaction")
						? { compactIfNeeded: async () => {}, compactNow: async () => {} }
						: undefined,
					systemPrompt: deps.includes("systemPrompt")
						? { section() {} }
						: undefined,
					spillStore: deps.includes("spillStore")
						? {
								saveText: async () => ({ locator: "spill:1", bytes: 0, retrievalHint: "" }),
							}
						: undefined,
					effect() {},
					tools: {
						get() {
							return undefined;
						},
						register() {
							return () => {};
						},
						execute: async () => ({ content: [] }),
					},
					llm: {
						stream: async function* () {},
					},
				};
				callback(child as never);
			},
			tools: {
				get() {
					return undefined;
				},
				register() {
					return () => {};
				},
				execute: async () => ({ content: [] }),
			},
			llm: {
				stream: async function* () {},
			},
		};
		apply(ctx as never, {});
		expect(events).toContain("tools/post-execute");
		expect(events).toContain("agent/session-start");
		expect(events).toContain("agent/pre-step");
		const mod = await import("../src/sol-dsh/index.ts");
		expect("default" in mod).toBe(false);
		expect(mod.name).toBe("dsh-sol-pi");
		expect(mod.inject).toEqual(["tools", "llm"]);
	});
});

describe("sol-dsh OCC ratio 50", () => {
	it("defers when remaining horizon cannot repay a 50× cache miss", () => {
		const decision = decideCompaction({
			writeTokens: 80_000,
			archiveTokens: 40_000,
			memoTokens: 1000,
			contextTokens: 80_000,
			completedBoundaryRequestCounts: [2, 2, 2],
			remainingBoundaries: 1,
			averageContextTokenIncrement: 1000,
			contextWindowTokens: 200_000,
			priorCompactionCount: 1,
			carriedDebtTokens: 0,
			cacheDebtRepaymentTokens: 0,
			cacheWriteReadRatio: 50,
			economics: DEFAULT_COMPACTION_ECONOMICS,
		});
		expect(decision.compact).toBe(false);
		expect(decision.incrementalCacheCostRatio).toBe(49);
	});
});
