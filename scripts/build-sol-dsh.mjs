#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "dist/sol-dsh/index.js");
mkdirSync(dirname(outfile), { recursive: true });

let build;
try {
	({ build } = await import("esbuild"));
} catch {
	console.error("build-sol-dsh: esbuild is required (npm install --save-dev esbuild)");
	process.exit(1);
}

await build({
	absWorkingDir: root,
	entryPoints: ["src/sol-dsh/index.ts"],
	outfile,
	bundle: true,
	format: "esm",
	platform: "node",
	target: "node22",
	packages: "external",
});

console.error("build-sol-dsh: wrote dist/sol-dsh/index.js");
