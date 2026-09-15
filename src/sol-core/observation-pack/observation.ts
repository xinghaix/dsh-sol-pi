/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { type FileHandle, lstat, mkdir, open } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DIAGNOSTIC_COMMAND, REDUCER_RECEIPT_PREFIX } from "../evidence-preserving-reducer/config.ts";

export const DEFAULT_THRESHOLD_BYTES = 10 * 1024;
export const DEFAULT_FULL_SENDS = 2;
export const DEFAULT_PLACEHOLDER_EXCERPT_BYTES = 1024;

/**
 * Tools whose oversized results are command dumps, not the payload the model
 * just asked to read. Immediate DSH replace (no silent projector, fullSends=0)
 * may hide those dumps at birth. Everything else stays inline until native spill.
 */
export const IMMEDIATE_REPLACE_TOOL_NAMES = ["bash", "edit", "write"] as const;

/**
 * Read-only inspection. Immediate replace would hide the bytes the model just
 * asked to see — the same failure as packing `grep` / `read`. Diagnostic
 * commands win when both match (`go test && git diff` still packs).
 */
export const RETRIEVAL_BASH_COMMAND =
	/(?:^|[;&|\n]|&&|\|\|)\s*(?:git\s+(?:diff|show|log|blame|grep|status)\b|(?:rg|grep|egrep|fgrep|ag)\b|find\s|sed\s+-n\b|(?:cat|head|tail|less|bat|nl)\s)/iu;

export function isRetrievalBash(command: string): boolean {
	return RETRIEVAL_BASH_COMMAND.test(command);
}

export function shouldReplaceObservationAtBirth(toolName: string, command?: string): boolean {
	if (!(IMMEDIATE_REPLACE_TOOL_NAMES as readonly string[]).includes(toolName)) return false;
	if (toolName !== "bash" || command === undefined || command.length === 0) return true;
	if (DIAGNOSTIC_COMMAND.test(command)) return true;
	return !isRetrievalBash(command);
}

const CHARS_PER_TOKEN = 4;
const OBSERVATION_ID_PATTERN = /^obs_[a-f0-9]{24}$/u;
const READ_OBJECT_FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW;
const CREATE_OBJECT_FLAGS = constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW;

export interface Observation {
	readonly id: string;
	readonly contentHash: string;
	readonly filePath: string;
	readonly toolName: string;
	readonly text: string;
	readonly bytes: number;
	readonly lines: number;
	readonly tokens: number;
}

export function hash(value: string | Buffer): string {
	return createHash("sha256").update(value).digest("hex");
}

export function estimateTokens(text: string): number {
	return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function countLines(text: string): number {
	if (text.length === 0) return 0;
	let lines = text.endsWith("\n") ? 0 : 1;
	for (const character of text) {
		if (character === "\n") lines += 1;
	}
	return lines;
}

export function containsReducerReceipt(text: string): boolean {
	return text.split("\n").some((line) => line === REDUCER_RECEIPT_PREFIX);
}

export function observationPath(runtimeRoot: string, id: string): string {
	return join(runtimeRoot, "observation-pack", "objects", `${id}.txt`);
}

export function isObservationId(id: string): boolean {
	return OBSERVATION_ID_PATTERN.test(id);
}

export function createObservationFromText(
	toolName: string,
	toolCallId: string,
	text: string,
	runtimeRoot: string,
	thresholdBytes = DEFAULT_THRESHOLD_BYTES,
): Observation | undefined {
	if (containsReducerReceipt(text)) return undefined;
	const bytes = Buffer.byteLength(text, "utf8");
	if (bytes <= thresholdBytes) return undefined;
	if (!runtimeRoot) throw new Error("Persistent SoL runtime directory is unavailable");
	const contentHash = hash(text);
	const id = `obs_${hash(`${toolName}\0${toolCallId}\0${contentHash}`).slice(0, 24)}`;
	return {
		id,
		contentHash,
		filePath: observationPath(runtimeRoot, id),
		toolName,
		text,
		bytes,
		lines: countLines(text),
		tokens: estimateTokens(text),
	};
}

export async function ensureStored(observation: Observation): Promise<void> {
	const directoryPath = dirname(observation.filePath);
	await mkdir(directoryPath, { recursive: true, mode: 0o700 });
	const directoryStats = await lstat(directoryPath);
	if (!directoryStats.isDirectory() || directoryStats.isSymbolicLink()) {
		throw new Error(`Observation directory is not a regular directory for ${observation.id}`);
	}

	let handle: FileHandle | undefined;
	try {
		handle = await open(observation.filePath, CREATE_OBJECT_FLAGS, 0o600);
		await handle.writeFile(observation.text, { encoding: "utf8" });
	} catch (error) {
		if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
		const existingHandle = await open(observation.filePath, READ_OBJECT_FLAGS);
		try {
			const existing = await existingHandle.stat();
			if (!existing.isFile()) {
				throw new Error(`Content-addressed observation is not a regular file for ${observation.id}`);
			}
			if (existing.size !== observation.bytes) {
				throw new Error(`Content-addressed observation size mismatch for ${observation.id}`);
			}
			const existingContent = await existingHandle.readFile();
			if (hash(existingContent) !== observation.contentHash) {
				throw new Error(`Content-addressed observation hash mismatch for ${observation.id}`);
			}
		} finally {
			await existingHandle.close();
		}
	} finally {
		await handle?.close();
	}
}

function completeLineExcerpt(text: string, budgetBytes: number, fromEnd: boolean): string {
	const lines = text.split(/(?<=\n)/);
	const selected: string[] = [];
	let selectedBytes = 0;
	let index = fromEnd ? lines.length - 1 : 0;

	while (index >= 0 && index < lines.length) {
		const line = lines[index];
		if (line === undefined) break;
		const lineBytes = Buffer.byteLength(line, "utf8");
		if (selectedBytes + lineBytes > budgetBytes) break;
		if (fromEnd) selected.unshift(line);
		else selected.push(line);
		selectedBytes += lineBytes;
		index += fromEnd ? -1 : 1;
	}

	return selected.join("");
}

export function placeholderFor(
	observation: Observation,
	options: { readonly fullSends: number; readonly excerptBytes: number; readonly retrieve: string },
): string {
	const headBudget = Math.floor(options.excerptBytes / 2);
	const tailBudget = options.excerptBytes - headBudget;
	const head = completeLineExcerpt(observation.text, headBudget, false);
	const tail = completeLineExcerpt(observation.text, tailBudget, true);
	const replacedAfter =
		options.fullSends <= 0
			? "[large tool result stored; inline preview only]"
			: `[large tool result replaced after its first ${options.fullSends} provider requests]`;
	return [
		replacedAfter,
		`id: ${observation.id}`,
		`tool: ${observation.toolName}`,
		`original_bytes: ${observation.bytes}`,
		`original_lines: ${observation.lines}`,
		`estimated_tokens: ${observation.tokens}`,
		`retrieve: ${options.retrieve}`,
		`[first complete lines, up to ${headBudget} bytes]`,
		head,
		`[middle omitted; last complete lines, up to ${tailBudget} bytes]`,
		tail,
		`[${observation.bytes} original bytes omitted]`,
	].join("\n");
}
