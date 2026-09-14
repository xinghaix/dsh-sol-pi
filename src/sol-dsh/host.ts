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
	readonly signal?: AbortSignal;
	readonly id?: string;
	readonly token?: symbol;
};

export type ToolExecutionResult = {
	readonly content?: readonly ContentBlock[];
	readonly isError?: boolean;
	readonly value?: unknown;
	readonly [key: string]: unknown;
};

export type ToolDefinition = {
	readonly name: string;
	readonly description: string;
	readonly parameters: Record<string, unknown>;
	readonly output?: unknown;
	execute(args: unknown, exec: ToolExecution): Promise<unknown>;
	finalizeContent?(exec: ToolExecution, result: ToolExecutionResult): ContentBlock[] | undefined;
	isConcurrencySafe?(args: unknown): boolean;
	presentCall?(args: unknown): unknown;
	presentResult?(args: unknown, result: unknown): unknown;
	timeoutMs?: number;
};

export type DshContext = {
	on(event: string, listener: (...args: never[]) => unknown, prepend?: boolean): () => void;
	effect?(callback: () => void | (() => void), label?: string): void;
	inject?(deps: readonly string[], callback: (ctx: DshContext) => void): void;
	tools: {
		get(name: string): ToolDefinition | undefined;
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
		section(options: { id: string; source: () => string | undefined; description?: string }): void;
	};
	get?(name: string): unknown;
};

export type DshAgent = {
	readonly id?: string;
	readonly ctx: DshContext;
	readonly session?: {
		readonly id?: string;
		readonly dir?: string;
		readonly cwd?: string;
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
