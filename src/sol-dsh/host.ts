/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

/**
 * Structural DSH host surface used by sol-dsh. Typed against the public Cordis
 * plugin contract without importing DSH packages into the Pi typecheck graph.
 */
export type TextBlock = { readonly type: "text"; readonly text: string };

export type ContentBlock = TextBlock | { readonly type: string; readonly [key: string]: unknown };

export type ToolExecution = {
	readonly name: string;
	readonly args: unknown;
	readonly caller?: { readonly id?: string; readonly ctx?: DshContext; readonly session?: unknown };
	readonly agent?: DshAgent;
	readonly signal?: AbortSignal;
	readonly id?: string;
	readonly callId?: string;
	readonly token?: symbol;
	readonly parent?: unknown;
};

export type ToolExecutionResult = {
	readonly content?: readonly ContentBlock[];
	readonly isError?: boolean;
	readonly value?: unknown;
	readonly [key: string]: unknown;
};

/** DSH `tools/post-execute` waterfall decision — not a raw tool result. */
export type PostToolDecision =
	| {
			kind: "accept";
			content?: ContentBlock[];
			value?: never;
			additionalContexts?: unknown[];
	  }
	| {
			kind: "accept";
			value: unknown;
			content?: never;
			additionalContexts?: unknown[];
	  }
	| {
			kind: "block";
			feedback: ContentBlock[];
			additionalContexts?: unknown[];
	  };

export type ToolDefinition = {
	readonly name: string;
	readonly description: string;
	readonly parameters: Record<string, unknown>;
	readonly output?: {
		readonly schema?: unknown;
		render?: (args: unknown, value: unknown) => ContentBlock[];
		presentationMeta?: (args: unknown, value: unknown) => unknown;
	};
	execute(args: unknown, exec: ToolExecution): Promise<unknown>;
	finalizeContent?(exec: ToolExecution, result: ToolExecutionResult): ContentBlock[] | undefined;
	isConcurrencySafe?(args: unknown): boolean;
	presentCall?(args: unknown): unknown;
	presentResult?(args: unknown, result: unknown): unknown;
	timeoutMs?: number;
};

export type DshContext = {
	on(
		event: string,
		listener: (...args: never[]) => unknown,
		options?: boolean | { prepend?: boolean },
	): () => void;
	effect?(callback: () => void | (() => void), label?: string): void;
	inject?(deps: readonly string[], callback: (ctx: DshContext) => void): void;
	tools: {
		get(name: string, scope?: unknown): ToolDefinition | undefined;
		register(definition: ToolDefinition): () => void;
		execute(call: { name: string; args: unknown; caller?: unknown; signal?: AbortSignal }): Promise<ToolExecutionResult>;
	};
	llm: {
		stream(options: Record<string, unknown>): AsyncIterable<{ type?: string; text?: string; [key: string]: unknown }>;
	};
	compaction?: {
		compactIfNeeded(agent: unknown, trigger: string, signal?: AbortSignal): Promise<unknown>;
		compactNow(agent: unknown, signal?: AbortSignal): Promise<unknown>;
	};
	settings?: {
		installSection(
			owner: DshContext,
			ns: string,
			schema: unknown,
			entry: unknown,
			hooks: {
				setSource(source: () => unknown): void;
				onChange(): void;
				validate?(value: unknown): void;
			},
		): void;
	};
	spillStore?: {
		saveText(input: { text: string; mediaType?: string }): Promise<{
			locator: string;
			bytes: number;
			retrievalHint: string;
		}>;
	};
	tokenMeter?: { measure(input: unknown): number };
	systemPrompt?: {
		section(section: { name: string; order: number; text: string | (() => string) }): () => void;
		getSectionOrder?(name: string): number;
	};
	agents?: { list(): DshAgent[]; get?(id: string): DshAgent | undefined };
	logger?: { warn(message: string): void; error?(error: unknown): void };
	get?(name: string): unknown;
};

export type DshAgent = {
	readonly id?: string;
	readonly ctx: DshContext;
	/** DSH `Agent.options` — the live provider/model route. */
	readonly options?: { readonly provider?: string; readonly model?: string };
	readonly session?: {
		readonly id?: string;
		readonly dir?: string;
		readonly cwd?: string;
		readonly provider?: string;
		readonly modelId?: string;
		readonly model?: unknown;
		append?(event: unknown): unknown;
	};
	whenIdle?(): Promise<void>;
	steer?(text: string): unknown;
	status?: string;
};

export function textOf(content: readonly ContentBlock[] | undefined): string {
	if (!content) return "";
	return content
		.filter((block): block is TextBlock => block.type === "text" && typeof block.text === "string")
		.map((block) => block.text)
		.join("\n");
}

export function recordValue(value: unknown, key: string): unknown {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)[key]
		: undefined;
}

export function agentFromPayload(payload: unknown): DshAgent | undefined {
	if (typeof payload !== "object" || payload === null) return undefined;
	const agent = (payload as { agent?: DshAgent }).agent;
	return agent && typeof agent === "object" && "ctx" in agent ? agent : undefined;
}

export function executionAgent(exec: ToolExecution): DshAgent | undefined {
	if (exec.agent && typeof exec.agent === "object") return exec.agent;
	const caller = exec.caller;
	if (caller && typeof caller === "object" && "ctx" in caller) return caller as DshAgent;
	return undefined;
}

export function isAcceptDecision(decision: PostToolDecision): decision is Extract<PostToolDecision, { kind: "accept" }> {
	return decision.kind === "accept";
}

export function contentFromDecision(decision: PostToolDecision, result: ToolExecutionResult): ContentBlock[] | undefined {
	if (decision.kind !== "accept") return undefined;
	if ("value" in decision && decision.value !== undefined && decision.content === undefined) return undefined;
	if (decision.content) return decision.content;
	return result.content ? [...result.content] : undefined;
}

export function acceptContent(decision: PostToolDecision, content: ContentBlock[]): PostToolDecision {
	if (decision.kind === "block") return decision;
	return {
		kind: "accept",
		content,
		...decision.additionalContexts ? { additionalContexts: decision.additionalContexts } : {},
	};
}

export function listenPostExecute(
	ctx: DshContext,
	listener: (exec: ToolExecution, result: ToolExecutionResult, decision: PostToolDecision) => Promise<PostToolDecision>,
	prepend = true,
): void {
	ctx.on(
		"tools/post-execute",
		((exec: ToolExecution, result: ToolExecutionResult, next: () => Promise<PostToolDecision>) => {
			return (async () => {
				const decision = await next();
				try {
					return await listener(exec, result, decision);
				} catch {
					return decision;
				}
			})();
		}) as (...args: never[]) => unknown,
		{ prepend },
	);
}
