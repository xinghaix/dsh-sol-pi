/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import {
	DEFAULT_COMPACTION_ECONOMICS,
	decideCompaction,
	type CompactionEconomics,
} from "../sol-core/online-context-compact/economics.ts";
import { analyzePlanTransition, parsePlanSteps, type PlanStep } from "../sol-core/online-context-compact/plan.ts";
import {
	initialOnlineState,
	recordBoundary,
	recordCompaction,
	recordProviderRequest,
	type OnlineState,
} from "../sol-core/online-context-compact/state.ts";
import type { OnlineContextCompactConfig } from "./config.ts";
import type { DshAgent, DshContext } from "./host.ts";
import { agentFromPayload, executionAgent, listenPostExecute, recordValue } from "./host.ts";

function economicsFrom(config: OnlineContextCompactConfig): CompactionEconomics {
	return {
		...DEFAULT_COMPACTION_ECONOMICS,
		windowReserveTokens: config.windowReserveTokens,
		firstCompactionRequestScale: config.firstCompactionRequestScale,
		subsequentCompactionMargin: config.subsequentCompactionMargin,
	};
}

function todosToPlan(args: unknown): readonly PlanStep[] | undefined {
	const todos = recordValue(args, "todos");
	if (!Array.isArray(todos)) return undefined;
	const steps: PlanStep[] = todos.map((item, index) => {
		const record = item as Record<string, unknown>;
		const goal = typeof record.content === "string" ? record.content : typeof record.goal === "string" ? record.goal : "";
		const statusRaw = typeof record.status === "string" ? record.status : "pending";
		const status: PlanStep["status"] =
			statusRaw === "in_progress" || statusRaw === "completed" || statusRaw === "pending" ? statusRaw : "pending";
		const id = typeof record.id === "string" && record.id.length > 0 ? record.id : `todo-${index + 1}`;
		return { id, goal, status };
	});
	return parsePlanSteps(steps) ?? steps;
}

function measureTokens(ctx: DshContext, agent: DshAgent): number {
	try {
		const session = agent.session as Record<string, unknown> | undefined;
		const messages = session?.messages ?? session?.log;
		const meter = (typeof ctx.get === "function" ? ctx.get("tokenMeter") : undefined) as
			| DshContext["tokenMeter"]
			| undefined;
		if (meter && messages !== undefined) {
			const measured = meter.measure(messages);
			if (typeof measured === "number" && Number.isFinite(measured)) return measured;
		}
		const tokens = session?.contextTokens ?? session?.tokenCount;
		if (typeof tokens === "number" && Number.isFinite(tokens)) return tokens;
	} catch {
		/* fail-open — undeclared injectables throw on property access */
	}
	return 0;
}

function contextWindow(agent: DshAgent): number | null {
	const session = agent.session as Record<string, unknown> | undefined;
	const model = session?.model as Record<string, unknown> | undefined;
	const window = model?.contextWindow ?? session?.contextWindow;
	return typeof window === "number" && window > 0 ? window : null;
}

function keepRecentTokens(config: OnlineContextCompactConfig, windowTokens: number | null): number {
	if (config.keepRecentTokens > 0) return config.keepRecentTokens;
	if (windowTokens === null) return 0;
	return Math.floor(windowTokens * 0.16);
}

async function maybeCompact(
	ctx: DshContext,
	agent: DshAgent,
	state: OnlineState,
	config: OnlineContextCompactConfig,
): Promise<OnlineState> {
	// Caller must run under ctx.inject(["compaction"], …); property access without inject throws.
	const compaction = ctx.compaction;
	if (!compaction) return state;
	const contextTokens = measureTokens(ctx, agent);
	const windowTokens = contextWindow(agent);
	const archiveTokens = Math.max(0, contextTokens - keepRecentTokens(config, windowTokens));
	const remainingBoundaries = Math.max(1, state.plan.filter((step) => step.status !== "completed").length);
	const averageIncrement =
		state.positiveContextDeltaCount > 0 ? state.positiveContextDeltaTotal / state.positiveContextDeltaCount : null;
	const decision = decideCompaction({
		writeTokens: contextTokens,
		archiveTokens,
		memoTokens: config.nativeSummaryTokenEstimate,
		contextTokens,
		contextWindowTokens: windowTokens,
		remainingBoundaries,
		completedBoundaryRequestCounts: state.completedBoundaryRequestCounts,
		averageContextTokenIncrement: averageIncrement,
		cacheWriteReadRatio: config.cacheWriteReadRatio,
		priorCompactionCount: state.nativeCompactionCount,
		carriedDebtTokens: state.cacheDebtTokens,
		cacheDebtRepaymentTokens: state.cacheDebtRepaymentTokens,
		economics: economicsFrom(config),
	});
	if (!decision.compact) return state;
	try {
		if (typeof agent.whenIdle === "function") await agent.whenIdle();
		await compaction.compactNow(agent, undefined);
		return recordCompaction(state, {
			debtTokens: (decision.writeTokens * Math.max(0, config.cacheWriteReadRatio - 1)) / Math.max(1, decision.archiveTokens),
			repaymentTokens: Math.max(0, decision.archiveTokens - decision.memoTokens),
		});
	} catch {
		return state;
	}
}

export function registerOnlineContextCompact(ctx: DshContext, configOf: () => OnlineContextCompactConfig): void {
	const states = new Map<string, OnlineState>();
	const keyOf = (agent: DshAgent | undefined) => agent?.id ?? agent?.session?.id ?? "default";

	ctx.on("agent/session-start", ((payload: unknown) => {
		const agent = agentFromPayload(payload);
		if (!agent) return;
		states.set(keyOf(agent), initialOnlineState());
	}) as (...args: never[]) => unknown);

	ctx.on("agent/disposed", ((payload: unknown) => {
		states.delete(keyOf(agentFromPayload(payload)));
	}) as (...args: never[]) => unknown);

	listenPostExecute(ctx, async (exec, result, decision) => {
		if (exec.name !== "todo_write" && exec.name !== "update_plan") return decision;
		if (result.isError || decision.kind === "block") return decision;
		const agent = executionAgent(exec);
		const plan = todosToPlan(exec.args);
		if (!plan) return decision;
		const current = states.get(keyOf(agent)) ?? initialOnlineState();
		const transition = analyzePlanTransition(current.plan, plan);
		const completed = transition.completedSteps.at(-1);
		states.set(
			keyOf(agent),
			recordBoundary(
				current,
				plan,
				completed
					? {
							stepId: completed.id,
							goal: completed.goal,
							filesChanged: [],
							verification: [],
							decisions: [],
							nextWork: plan.filter((step) => step.status !== "completed").map((step) => step.goal),
						}
					: undefined,
			),
		);
		return decision;
	}, false);

	const attachCompactionHooks = (runtime: DshContext): void => {
		runtime.on(
			"agent/pre-step",
			((payload: unknown, next: () => Promise<unknown>) => {
				return (async () => {
					try {
						const config = configOf();
						const agent = agentFromPayload(payload);
						if (config.enabled && agent) {
							const key = keyOf(agent);
							const current = recordProviderRequest(states.get(key) ?? initialOnlineState(), measureTokens(runtime, agent));
							states.set(key, await maybeCompact(runtime, agent, current, config));
						}
					} catch {
						/* fail-open — never block the step */
					}
					return next();
				})();
			}) as (...args: never[]) => unknown,
		);
	};

	if (typeof ctx.inject === "function") {
		ctx.inject(["compaction"], (child) => attachCompactionHooks(child));
	}
}
