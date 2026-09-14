#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 *
 * Static DSH plugin-contract checks. Does not boot DeepSeek Harness.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function read(rel) {
	return readFileSync(join(root, rel), "utf8");
}

function must(condition, message) {
	if (!condition) failures.push(message);
}

const index = read("src/sol-dsh/index.ts");
must(/export const name = "sol-dsh"/.test(index), "src/sol-dsh/index.ts must export name = \"sol-dsh\"");
must(/export const inject = /.test(index), "src/sol-dsh/index.ts must export inject");
must(/export function apply\(/.test(index), "src/sol-dsh/index.ts must export apply");
must(/export \{ Config \}/.test(index), "src/sol-dsh/index.ts must export Config");
must(!/export default/.test(index), "src/sol-dsh/index.ts must not use export default (Cordis unwrapExports drops inject)");
must(!/purpose:\s*['"]sol-/.test(index), "auxiliary LLM calls must not invent a purpose outside compaction | session-title");

const epr = read("src/sol-dsh/epr.ts");
must(!/purpose:/.test(epr), "EPR nested calls must leave purpose unset");

const occ = read("src/sol-dsh/occ.ts");
must(!/new CompactionEngine/.test(occ), "OCC must not mount a second CompactionEngine");
must(/compactNow/.test(occ), "OCC must call ctx.compaction.compactNow");

const pack = read("src/sol-dsh/observation-pack.ts");
must(!/obs_recall/.test(pack), "DSH ObservationPack must not invent obs_recall");

const patch = read("src/sol-dsh/cordis.patch.yml");
must(/id: sol-dsh/.test(patch), "cordis.patch.yml must insert id sol-dsh");
must(/name: sol-dsh/.test(patch), "cordis.patch.yml row name must match the npm package sol-dsh");

const pkg = JSON.parse(read("package.json"));
must(pkg.name === "sol-dsh", "package.json name must be sol-dsh");
must(pkg.dsh?.bundle?.patch === "./src/sol-dsh/cordis.patch.yml", "package.json dsh.bundle.patch must point at the native patch");
must(pkg.dsh?.client?.platform === "web", "package.json dsh.client.platform must be web");
must(pkg.exports?.["./client"], "package.json must export ./client for the settings card");
must(!pkg.dsh?.client?.inject?.some((item) => item.includes("pi-")), "dsh.client.inject must not name Pi packages");

const locales = read("src/sol-dsh/client/locales.ts");
must(/export const zh =/.test(locales) && /export const en =/.test(locales), "client locales must ship zh and en");
must(!/setLocale/.test(read("src/sol-dsh/client/index.ts")), "SoL must not write dshweb locale preference");

if (failures.length > 0) {
	console.error("check-dsh-compat failed:");
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log("check-dsh-compat: ok");
