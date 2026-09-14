/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

export const THEN_RUN_SUCCEEDED = "[then_run:succeeded]";
export const THEN_RUN_FAILED = "[then_run:failed]";
export const THEN_RUN_SKIPPED = "[then_run:skipped]";

export interface ThenRunInput {
	command: string;
	timeout?: number;
}

export interface ThenRunTextResult {
	readonly text: string;
	readonly isError: boolean;
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function thenRunSkippedError(error: unknown): Error {
	return new Error(
		`${errorText(error)}\n\n${THEN_RUN_SKIPPED} The file mutation did not complete successfully; the command was not run.`,
	);
}

export function formatThenRunSuccess(output: string): string {
	return output ? `${THEN_RUN_SUCCEEDED}\n${output}` : THEN_RUN_SUCCEEDED;
}

export function formatThenRunFailure(mutationOutput: string, error: unknown): string {
	return [mutationOutput, THEN_RUN_FAILED, errorText(error)].filter(Boolean).join("\n\n");
}

async function fileSha256(path: string): Promise<string> {
	const { createHash } = await import("node:crypto");
	const { readFile } = await import("node:fs/promises");
	return createHash("sha256").update(await readFile(path)).digest("hex");
}

export async function assertUnchangedBeforeCommand(
	path: string,
	yieldForInterference: () => Promise<void> = () => new Promise<void>((resolve) => setImmediate(resolve)),
): Promise<void> {
	try {
		const mutationHash = await fileSha256(path);
		await yieldForInterference();
		const commandHash = await fileSha256(path);
		if (mutationHash !== commandHash) {
			throw new Error("target content changed after the fused mutation");
		}
	} catch (error) {
		throw new Error(`${THEN_RUN_SKIPPED} ${errorText(error)}; the command was not run.`);
	}
}
