#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 *
 * Emits the closure-factory CJS artifact DSH Web loads as /plugins/sol-pi/client.js.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let build;
try {
	({ build } = await import("esbuild"));
} catch {
	console.error("build-sol-dsh-client: esbuild is required (npm install --save-dev esbuild)");
	process.exit(1);
}

const CLIENT_EXTERNALS = [
	"react",
	"react/jsx-runtime",
	"react-dom",
	"react-dom/client",
	"@deepseek-ai/cordis",
	"@deepseek-ai/dsh-client-ui-slots",
	"@deepseek-ai/dsh-client-store",
];

const outfile = join(root, "dist/sol-dsh/client.js");
mkdirSync(dirname(outfile), { recursive: true });

const cssNamespace = "sol-dsh-css";
await build({
	absWorkingDir: root,
	entryPoints: ["src/sol-dsh/client/index.ts"],
	outfile,
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2020",
	jsx: "automatic",
	external: CLIENT_EXTERNALS,
	plugins: [
		{
			name: "inline-css-modules",
			setup(plugin) {
				plugin.onResolve({ filter: /\.module\.css$/ }, (args) => ({
					path: require.resolve(args.path, { paths: [args.resolveDir] }),
					namespace: cssNamespace,
				}));
				plugin.onLoad({ filter: /.*/, namespace: cssNamespace }, (args) => {
					const css = readFileSync(args.path, "utf8");
					const locals = Object.fromEntries(
						[...css.matchAll(/\.([A-Za-z_][\w]*)\s*\{/g)].map((match) => [match[1], `solDsh_${match[1]}`]),
					);
					const rewritten = css.replace(/\.([A-Za-z_][\w]*)/g, (_, name) => `.solDsh_${name}`);
					return {
						loader: "js",
						contents: `if (typeof document !== "undefined" && !document.getElementById("sol-dsh-css")) { const s = document.createElement("style"); s.id = "sol-dsh-css"; s.textContent = ${JSON.stringify(rewritten)}; document.head.appendChild(s); } export default ${JSON.stringify(locals)};`,
					};
				});
			},
		},
	],
});

const artifact = readFileSync(outfile, "utf8");
// DSH ModuleLoader materializes factory(require) → exports. Two live-Desktop
// traps this wrapper defends: (1) esbuild CJS `module.exports = __toCommonJS`
// drops own-property apply/inject for Cordis; (2) requiring non-seed modules
// (e.g. @deepseek-ai/dsh-client-ui-primitives) throws "missed the module table"
// and aborts materialize before apply runs — keep the client on seed-only
// requires (react / jsx-runtime / dsh-client-store), matching allowlist.
const wrapped = `window.__ModuleLoader__.load({ id: "dsh-sol-pi", factory: function (require) {
const module = { exports: {} };
const exports = module.exports;
try { console.info("[dsh-sol-pi] client factory start"); } catch (_) {}
${artifact}
exports.apply = apply;
exports.inject = inject;
module.exports = exports;
try { console.info("[dsh-sol-pi] client factory ok apply="+typeof exports.apply); } catch (_) {}
return module.exports;
} });
`;
if (wrapped.includes("import.meta") || /^\s*import\s/m.test(artifact) || /^\s*export\s/m.test(artifact)) {
	throw new Error("client bundle must not contain ESM import/export or import.meta");
}
if (!wrapped.includes("exports.apply = apply") || !wrapped.includes("exports.inject = inject")) {
	throw new Error("client bundle must assign exports.apply and exports.inject (ModuleLoader/Cordis contract)");
}
writeFileSync(outfile, wrapped);
writeFileSync(join(root, "dist/sol-dsh/client.d.ts"), 'export * from "../../src/sol-dsh/client/index.ts";\n');
console.error("build-sol-dsh-client: wrote dist/sol-dsh/client.js");
