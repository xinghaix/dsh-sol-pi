/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface PackReport {
	files: Array<{ path: string }>;
}

function packedFiles(): string[] {
	const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
		cwd: process.cwd(),
		encoding: "utf8",
	});
	if (result.status !== 0) throw new Error(result.stderr || result.stdout);
	const jsonText = result.stdout.trim().replace(/^[\s\S]*?(?=\[|{)/, "");
	const parsed = JSON.parse(jsonText) as PackReport[] | Record<string, PackReport>;
	const report = Array.isArray(parsed) ? parsed[0] : parsed["sol-pi"] ?? Object.values(parsed)[0];
	return report?.files.map((file) => file.path) ?? [];
}

describe("published package", () => {
	it("ships the default cache write/read ratio in the example config", () => {
		const config = JSON.parse(readFileSync("sol-pi.example.json", "utf8")) as Record<string, unknown>;
		expect(config.cacheWriteReadRatio).toBe(12.5);
		expect(config.evidencePreservingReducerProvider).toBe("provider-id");
		expect(config.evidencePreservingReducerModel).toBe("model-id");
	});

	it("contains the standalone entrypoint and no Pi monorepo source", () => {
		const files = packedFiles();
		expect(files).toContain("src/sol-pi/index.ts");
		expect(files).toContain("sol-pi.example.json");
		expect(files.some((file) => file.startsWith("packages/"))).toBe(false);
		expect(files.some((file) => file.startsWith("docs/superpowers/"))).toBe(false);
	});

	it("ships Online Context Compact from the standalone source tree", () => {
		const files = packedFiles();
		expect(files).toContain("src/sol-pi/extensions/online-context-compact/index.ts");
		expect(files).toContain("src/sol-dsh/index.ts");
		expect(files).toContain("src/sol-core/online-context-compact/economics.ts");
		expect(files).toContain("scripts/check-sol-pi-config.mjs");
		expect(files).toContain("scripts/check-dsh-compat.mjs");
		expect(files).toContain("docs/dsh.md");
		expect(files).toContain("docs/dsh-configuration.md");
		expect(files).toContain("agents-install.md");
		expect(files).not.toContain("AGENTS.md");
		expect(files).not.toContain("CLAUDE.md");
	});
});
