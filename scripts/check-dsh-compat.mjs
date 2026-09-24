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
must(/export const name = "dsh-sol-pi"/.test(index), "src/sol-dsh/index.ts must export name = \"dsh-sol-pi\"");
must(/export const inject = /.test(index), "src/sol-dsh/index.ts must export inject");
must(/export function apply\(/.test(index), "src/sol-dsh/index.ts must export apply");
must(/export \{ Config \}/.test(index), "src/sol-dsh/index.ts must export Config");
must(!/export default/.test(index), "src/sol-dsh/index.ts must not use export default (Cordis unwrapExports drops inject)");
must(!/purpose:\s*['"]sol-/.test(index), "auxiliary LLM calls must not invent a purpose outside compaction | session-title");
must(/name:\s*"dsh-sol-pi"/.test(index), "systemPrompt.section must use DSH PromptSection { name, order, text }");
must(!/source:\s*\(\)\s*=>/.test(index), "systemPrompt.section must not use Pi-style id/source");
must(
	index.indexOf("registerEvidencePreservingReducer") < index.indexOf("registerObservationPack"),
	"EPR must register before ObservationPack so diagnostic logs reduce before dump replace",
);

const epr = read("src/sol-dsh/epr.ts");
must(!/purpose:/.test(epr), "EPR nested calls must leave purpose unset");

const occ = read("src/sol-dsh/occ.ts");
must(!/new CompactionEngine/.test(occ), "OCC must not mount a second CompactionEngine");
must(/compactNow/.test(occ), "OCC must call ctx.compaction.compactNow");

const pack = read("src/sol-dsh/observation-pack.ts");
must(!/obs_recall/.test(pack), "DSH ObservationPack must not invent obs_recall");
must(read("src/sol-dsh/host.ts").includes("PostToolDecision"), "host must type tools/post-execute as PostToolDecision");
must(read("src/sol-dsh/observation-pack.ts").includes("listenPostExecute"), "ObservationPack must use the DSH post-execute decision helper");
must(read("src/sol-dsh/epr.ts").includes("listenPostExecute"), "EPR must use the DSH post-execute decision helper");
must(read("src/sol-dsh/action-fusion.ts").includes("agent/created"), "Action Fusion must wrap agents on created as well as session-start");
must(read("src/sol-dsh/occ.ts").includes("return next()"), "OCC agent/pre-step must delegate next() so the waterfall does not stall");

const patch = read("src/sol-dsh/cordis.patch.yml");
must(/id: dsh-sol-pi/.test(patch), "cordis.patch.yml must insert id dsh-sol-pi");
must(/name: dsh-sol-pi/.test(patch), "cordis.patch.yml row name must match the npm package dsh-sol-pi");

const pkg = JSON.parse(read("package.json"));
must(pkg.name === "dsh-sol-pi", "package.json name must be dsh-sol-pi");
must(pkg.dsh?.bundle?.patch === "./src/sol-dsh/cordis.patch.yml", "package.json dsh.bundle.patch must point at the native patch");
must(pkg.dsh?.client?.platform === "web", "package.json dsh.client.platform must be web");
must(pkg.dsh?.client?.immediately !== true, "dsh.client.immediately must not be true — stage-one barrier + heavy inject deps can leave the client fiber pending so plugins.bundle.config never registers (match dsh-web-fetch-allowlist)");
must(!pkg.dsh?.client?.inject?.includes("@deepseek-ai/dsh-client-ui-model-selection"), "dsh.client.inject must not hard-depend on model-selection; optional modelDirectories is acquired via ctx.inject at runtime");
must(pkg.exports?.["./client"], "package.json must export ./client for the settings card");
must(Array.isArray(pkg.dsh?.client?.inject) && pkg.dsh.client.inject.every((item) => typeof item === "string" && item.includes("/")), "package.json dsh.client.inject must list package rows (e.g. @deepseek-ai/...), not Cordis service names");
must(pkg.dsh?.client?.inject?.includes("@deepseek-ai/dsh-client-ui-plugin-manager"), "package.json dsh.client.inject must include @deepseek-ai/dsh-client-ui-plugin-manager so the plugins.bundle.config slot exists first");
must(pkg.dsh?.client?.inject?.includes("@deepseek-ai/dsh-client-ui-settings"), "package.json dsh.client.inject must include @deepseek-ai/dsh-client-ui-settings for configForms");
must(!pkg.dsh?.client?.inject?.some((item) => String(item).includes("pi-")), "dsh.client.inject must not name Pi packages");
must(pkg.main === "./dist/sol-dsh/index.js", "package.json main must point at built dist/sol-dsh/index.js (Node cannot strip types under node_modules)");
must(pkg.exports?.["."] === "./dist/sol-dsh/index.js", "package.json exports[\".\"] must point at built dist/sol-dsh/index.js");

const locales = read("src/sol-dsh/client/locales.ts");
must(/export const zh =/.test(locales) && /export const en =/.test(locales), "client locales must ship zh and en");
must(!/setLocale/.test(read("src/sol-dsh/client/index.ts")), "SoL must not write dshweb locale preference");

const clientInject = read("src/sol-dsh/client/index.ts").match(/export const inject = \[[\s\S]*?\]/)?.[0] ?? "";
must(clientInject.includes('"slots"') && clientInject.includes('"locale"') && clientInject.includes('"configForms"'), "client inject must declare slots, locale, and configForms");
must(!clientInject.includes('"settingsScope"'), "client inject must not declare removed settingsScope");
must(pkg.dsh?.engines?.dsh === ">=0.1.7-rc.1" || String(pkg.dsh?.engines?.dsh ?? "").includes("0.1.7"), "package.json dsh.engines.dsh must require >=0.1.7-rc.1");
must(!/\.installSection\s*\(/.test(read("src/sol-dsh/settings.ts")), "settings.ts must not call installSection");
must(!/installSection\s*\(/.test(read("src/sol-dsh/host.ts")), "host.ts must not type installSection");
must(read("src/sol-dsh/config-schema.ts").includes(".volatile()"), "Config schema must mark live fields volatile");
must(!/from "@deepseek-ai\/schemastery"/.test(read("src/sol-dsh/config.ts")), "config.ts must stay Schema-free so the Web client does not bundle Schemastery");
must(!/schemastery|cosmokit/.test(read("dist/sol-dsh/client.js")), "dist/sol-dsh/client.js must not embed Schemastery/cosmokit (match allowlist-sized client)");
must(!/modelDirectories/.test(read("src/sol-dsh/client/index.ts")), "client apply must not soft-inject modelDirectories — nested ctx.inject is unnecessary for Settings visibility");
must(/configForms\.get\s*\(/.test(read("src/sol-dsh/client/index.ts")), "client must use configForms.get");
must(!clientInject.includes("@deepseek-ai/"), "client fiber inject must not list @deepseek-ai/* package names");
must(read("src/sol-dsh/client/index.ts").includes('ctx.slots.register'), "client must register plugins.bundle.config via ctx.slots.register");
must(/export\s*\{[^}]*\bname\b/.test(read("dist/sol-dsh/index.js")) && /\binject\b/.test(read("dist/sol-dsh/index.js")) && /\bapply\b/.test(read("dist/sol-dsh/index.js")), "dist/sol-dsh/index.js must export name/inject/apply");
must(read("dist/sol-dsh/client.js").includes("window.__ModuleLoader__.load"), "dist/sol-dsh/client.js must be the DSH ModuleLoader CJS factory");

if (failures.length > 0) {
	console.error("check-dsh-compat failed:");
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log("check-dsh-compat: ok");
