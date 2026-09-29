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
	const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--cache=/tmp/npm-cache"], {
		cwd: process.cwd(),
		encoding: "utf8",
	});
	if (result.status !== 0) throw new Error(result.stderr || result.stdout);
	const jsonText = result.stdout.trim().replace(/^[\s\S]*?(?=\[|{)/, "");
	const parsed = JSON.parse(jsonText) as PackReport[] | Record<string, PackReport>;
	const report = Array.isArray(parsed) ? parsed[0] : parsed["dsh-sol-pi"] ?? Object.values(parsed)[0];
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
		expect(files).toContain("dist/sol-dsh/index.js");
		expect(files).toContain("dist/sol-dsh/client.js");
		expect(files).toContain("src/sol-core/online-context-compact/economics.ts");
		expect(files).toContain("scripts/check-sol-pi-config.mjs");
		expect(files).toContain("scripts/check-dsh-compat.mjs");
		expect(files).toContain("docs/dsh.md");
		expect(files).toContain("docs/dsh-configuration.md");
		expect(files).toContain("agents-install.md");
		expect(files).not.toContain("AGENTS.md");
		expect(files).not.toContain("CLAUDE.md");
	});

	it("satisfies DSH 0.2.0-rc.1 peerDependencies preflight checks", async () => {
		const pkg = JSON.parse(readFileSync("package.json", "utf8")) as Record<string, any>;
		// @ts-expect-error optional dev dependency types
		const semver = (await import("semver")).default as {
			satisfies: (version: string, range: string, options?: { includePrerelease?: boolean }) => boolean;
		};
		const dshSettingsPeer = pkg.peerDependencies?.["@deepseek-ai/dsh-settings"];
		expect(dshSettingsPeer).toBe("^0.2.0-rc.1");
		expect(pkg.dsh?.engines?.dsh).toBe(">=0.2.0-rc.1");

		// DSH 0.2.0-rc.1 preflight rule: semver.satisfies(runtimeVersion, requirement, { includePrerelease: true })
		expect(semver.satisfies("0.2.0-rc.1", dshSettingsPeer, { includePrerelease: true })).toBe(true);

		// Verify old range ^0.1.7-rc.1 fails on 0.2.0-rc.1 due to caret bounding (<0.2.0-0)
		expect(semver.satisfies("0.2.0-rc.1", "^0.1.7-rc.1", { includePrerelease: true })).toBe(false);
	});
});
