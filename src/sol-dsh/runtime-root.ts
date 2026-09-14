/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type { DshAgent } from "./host.ts";

function sessionDir(agent: DshAgent | undefined): string {
	const session = agent?.session;
	if (session && typeof session === "object") {
		const record = session as Record<string, unknown>;
		for (const key of ["dir", "sessionDir", "storageDir", "path"]) {
			const value = record[key];
			if (typeof value === "string" && value.length > 0) return value;
		}
	}
	return join(homedir(), ".dsh", "sol-dsh");
}

function sessionId(agent: DshAgent | undefined): string {
	const id = agent?.session?.id ?? agent?.id;
	return typeof id === "string" && id.length > 0 ? id : "default";
}

/** Session-derived SoL runtime root. Never a user-configured path. */
export function solDshRuntimeRoot(agent: DshAgent | undefined): string {
	return join(sessionDir(agent), "sol-dsh", sessionId(agent));
}

export function sessionCwd(agent: DshAgent | undefined, fallback = process.cwd()): string {
	const cwd = agent?.session?.cwd;
	return typeof cwd === "string" && cwd.length > 0 ? cwd : fallback;
}
