/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { apply } from "../src/sol-dsh/index.ts";
import { attachActionFusion, extendParameters, hasThenRunParameter } from "../src/sol-dsh/action-fusion.ts";
import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig } from "../src/sol-dsh/config.ts";
import { reduceDiagnosticResult, reductionEligibility, resolveReducerRoute } from "../src/sol-dsh/epr.ts";
import { acceptContent, listenPostExecute, type DshAgent, type ToolDefinition } from "../src/sol-dsh/host.ts";
import { zh, en } from "../src/sol-dsh/client/locales.ts";
import { decideCompaction, DEFAULT_COMPACTION_ECONOMICS } from "../src/sol-core/online-context-compact/economics.ts";
import {
	createObservationFromText,
	placeholderFor,
	shouldReplaceObservationAtBirth,
} from "../src/sol-core/observation-pack/observation.ts";
import { packObservation } from "../src/sol-dsh/observation-pack.ts";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
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

	it("treats node --check and vitest as diagnostic", () => {
		const body = `${"error: boom\n".repeat(500)}`;
		expect(reductionEligibility("node --check internal/foo.js", body, config)).toBe("reduce");
		expect(reductionEligibility("vitest run", body, config)).toBe("reduce");
	});

	it("resolves the live Agent.options route before session.model.id", () => {
		expect(
			resolveReducerRoute(config, {
				ctx: {} as DshAgent["ctx"],
				options: { provider: "local", model: "grok-4.6" },
				session: { model: { provider: "wrong", id: "stale" } },
			}),
		).toEqual({ provider: "local", model: "grok-4.6" });
		expect(resolveReducerRoute(config, { ctx: {} as DshAgent["ctx"] })).toEqual({});
	});

	it("archives a diagnostic log when Agent.options supplies the route", async () => {
		const dir = mkdtempSync(join(tmpdir(), "sol-dsh-epr-route-"));
		const agent = {
			ctx: {} as DshAgent["ctx"],
			options: { provider: "local", model: "grok-4.6" },
			session: { id: "session-epr", dir },
		} as DshAgent;
		const ctx = {
			llm: {
				async *stream() {},
			},
		};
		const body = `${"error: boom\n".repeat(500)}`;
		await reduceDiagnosticResult(
			ctx as never,
			{ name: "bash", args: { command: "go test ./..." } },
			{ content: [{ type: "text", text: body }] },
			config,
			agent,
		);
		const objects = join(dir, "dsh-sol-pi", "session-epr", "evidence-preserving-reducer", "objects");
		expect(existsSync(objects)).toBe(true);
		expect(readdirSync(objects).length).toBeGreaterThan(0);
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

describe("sol-dsh immediate observation replace policy", () => {
	it("replaces only command dumps at birth", () => {
		expect(shouldReplaceObservationAtBirth("bash")).toBe(true);
		expect(shouldReplaceObservationAtBirth("edit")).toBe(true);
		expect(shouldReplaceObservationAtBirth("write")).toBe(true);
		expect(shouldReplaceObservationAtBirth("grep")).toBe(false);
		expect(shouldReplaceObservationAtBirth("read")).toBe(false);
		expect(shouldReplaceObservationAtBirth("hindsight_read_knowledge_page")).toBe(false);
		expect(shouldReplaceObservationAtBirth("skill")).toBe(false);
	});

	it("keeps retrieval bash inline and still packs tests/builds", () => {
		expect(shouldReplaceObservationAtBirth("bash", "grep -RniE archive /opt/homebrew/lib")).toBe(false);
		expect(shouldReplaceObservationAtBirth("bash", "find /opt/homebrew/lib -type f | head -500")).toBe(false);
		expect(shouldReplaceObservationAtBirth("bash", "git diff -- internal/desktop/bridge_host.go")).toBe(false);
		expect(shouldReplaceObservationAtBirth("bash", "git show HEAD:pkg/api/foo.go | sed -n '1,220p'")).toBe(false);
		expect(shouldReplaceObservationAtBirth("bash", "go test ./pkg/services/... -count=1")).toBe(true);
		expect(shouldReplaceObservationAtBirth("bash", "make swagger\ngit diff --check")).toBe(true);
		expect(shouldReplaceObservationAtBirth("bash", "ps -axo pid=,command=")).toBe(true);
	});

	it("packs oversized bash and leaves oversized knowledge pages inline", async () => {
		const dir = mkdtempSync(join(tmpdir(), "sol-dsh-obs-policy-"));
		const agent = { session: { id: "session-test", dir } } as DshAgent;
		const config = DEFAULT_SOL_DSH_CONFIG.observationPack;
		const huge = "a".repeat(20_000);

		const packed = await packObservation(
			{ name: "bash", args: { command: "go test ./..." }, id: "call-bash" },
			{ content: [{ type: "text", text: huge }] },
			config,
			agent,
		);
		expect(packed?.content?.[0]).toMatchObject({ type: "text" });
		expect(String((packed?.content?.[0] as { text: string }).text)).toContain("large tool result stored");

		const retrieval = await packObservation(
			{ name: "bash", args: { command: "git diff -- README.md" }, id: "call-diff" },
			{ content: [{ type: "text", text: huge }] },
			config,
			agent,
		);
		expect(retrieval).toBeUndefined();

		const skipped = await packObservation(
			{ name: "hindsight_read_knowledge_page", args: {}, id: "call-kp" },
			{ content: [{ type: "text", text: huge }] },
			config,
			agent,
		);
		expect(skipped).toBeUndefined();

		const grep = await packObservation(
			{ name: "grep", args: {}, id: "call-grep" },
			{ content: [{ type: "text", text: huge }] },
			config,
			agent,
		);
		expect(grep).toBeUndefined();

		const objects = join(dir, "dsh-sol-pi", "session-test", "observation-pack", "objects");
		expect(readdirSync(objects)).toHaveLength(1);
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
						? {
								section() {
									return () => {};
								},
								getSectionOrder() {
									return 800;
								},
							}
						: undefined,
					agents: deps.includes("agents") ? { list: () => [] } : undefined,
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
		expect(events).toContain("agent/created");
		expect(events).toContain("agent/pre-step");
		const mod = await import("../src/sol-dsh/index.ts");
		expect("default" in mod).toBe(false);
		expect(mod.name).toBe("dsh-sol-pi");
		expect(mod.inject).toEqual(["tools", "llm"]);
	});
});

describe("sol-dsh DSH native seams", () => {
	it("extends edit JSON schema with then_run", () => {
		const parameters = extendParameters({
			type: "object",
			properties: {
				file_path: { type: "string" },
				old_string: { type: "string" },
				new_string: { type: "string" },
			},
			required: ["file_path", "old_string", "new_string"],
		});
		expect(hasThenRunParameter(parameters)).toBe(true);
		const properties = parameters.properties as Record<string, { required?: string[] }>;
		expect(properties.then_run?.required).toEqual(["command"]);
	});

	it("shadows edit on the agent-scoped registry", () => {
		const registered: ToolDefinition[] = [];
		const base: ToolDefinition = {
			name: "edit",
			description: "Edit an existing UTF-8 text file by replacing literal text.",
			parameters: {
				type: "object",
				properties: { file_path: { type: "string" } },
			},
			output: { schema: { type: "object" }, render: () => [] },
			async execute() {
				return { path: "x" };
			},
		};
		const agent = {
			id: "agent-1",
			ctx: {
				tools: {
					get(name: string) {
						return name === "edit" ? base : undefined;
					},
					register(definition: ToolDefinition) {
						registered.push(definition);
						return () => {};
					},
					execute: async () => ({ content: [] }),
				},
			},
		} as unknown as DshAgent;
		attachActionFusion(agent.ctx, agent, () => true);
		expect(registered).toHaveLength(1);
		expect(registered[0]?.name).toBe("edit");
		expect(hasThenRunParameter(registered[0]?.parameters ?? {})).toBe(true);
		expect(registered[0]?.description).toMatch(/then_run/);
		expect(registered[0]?.output).toBe(base.output);
	});

	it("post-execute listeners return { kind: accept, content }", async () => {
		let captured: ((...args: never[]) => unknown) | undefined;
		const ctx = {
			on(_event: string, listener: (...args: never[]) => unknown) {
				captured = listener;
				return () => {};
			},
			inject() {},
			tools: { get() {}, register() {}, execute: async () => ({ content: [] }) },
			llm: { stream: async function* () {} },
		};
		listenPostExecute(ctx as never, async (_exec, _result, decision) =>
			acceptContent(decision, [{ type: "text", text: "packed" }]),
		);
		const decision = await (captured as (exec: unknown, result: unknown, next: () => Promise<unknown>) => Promise<unknown>)(
			{ name: "bash", args: {} },
			{ content: [{ type: "text", text: "raw" }] },
			async () => ({ kind: "accept" }),
		);
		expect(decision).toEqual({ kind: "accept", content: [{ type: "text", text: "packed" }] });
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
