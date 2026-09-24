import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { build } from "esbuild";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveSolDshConfig } from "../src/sol-dsh/config.ts";

// Bundle the real entry and form in memory so host-only tsconfig stays host-only.
let source: string;
beforeAll(async () => {
  const result = await build({
    entryPoints: [fileURLToPath(new URL("../src/sol-dsh/client/index.ts", import.meta.url))],
    bundle: true, write: false, format: "cjs", platform: "browser", jsx: "automatic",
    external: ["react", "react/jsx-runtime", "@deepseek-ai/dsh-client-store"],
    plugins: [{ name: "test-css", setup(plugin) { plugin.onLoad({ filter: /\.css$/ }, () => ({ contents: "export default {}", loader: "js" })); } }],
  });
  source = result.outputFiles[0]!.text;
});

function harness() {
  const entries = new Map<string, any>();
  const waiting: { name: string; callback: () => any }[] = [];
  const cleanups: (() => void)[] = [];
  const effects: (() => any)[] = [];
  const states: any[] = [];
  const writes: any[] = [];
  let cursor = 0;
  let mounted = false;
  let readOnly = false;
  let rejectSave = false;
  let recoverSave = false;
  let user: any = {};
  let revision = 7;
  let saved: any;
  const jsx = (type: any, props: any) => ({ type, props });
  const hooks = {
    useState(initial: any) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial; return [states[index], (value: any) => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; },
    useRef(initial: any) { const index = cursor++; if (!(index in states)) states[index] = { current: initial }; return states[index]; },
    useMemo(fn: () => any) { return fn(); },
    useEffect(fn: () => any) { if (!mounted) effects.push(fn); },
  };
  const exports = {};
  const context = vm.createContext({ exports, module: { exports }, structuredClone, Error, setTimeout, clearTimeout, require(name: string) {
    if (name === "react") return hooks;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "@deepseek-ai/dsh-client-store") return { createSnapshotStore: () => ({}) };
    throw new Error(name);
  } });
  vm.runInContext(source!, context);
  const plugin = (context.module as any).exports;
  plugin.apply({
    effect(fn: () => any) { const off = fn(); if (typeof off === "function") cleanups.push(off); },
    locale: { register: () => () => {} },
    slots: {
      inject(name: string, callback: () => any) { waiting.push({ name, callback }); },
      register(spec: any, component: any) { entries.set(spec.key, { spec, component }); return () => entries.delete(spec.key); },
    },
    configForms: { get(entryId: string) {
      expect(entryId).toBe("dsh-sol-pi");
      return {
        getSnapshot: () => ({ status: "ready", value: saved, base: {}, user, revision, writable: !readOnly }),
        subscribe: () => () => {},
        async mutate(ops: any, expectedRevision: number) {
          if (rejectSave) throw new Error("stale revision");
          writes.push({ ops, revision: expectedRevision });
          if (recoverSave) return false; // Real DSH recovers and resolves false on remote ok:false.
          for (const op of ops) {
            if (op.op === "unset") delete user[op.path[0]];
            else user[op.path[0]] = structuredClone(op.value);
          }
          // Decode via resolve path — configForms.get has no decode hook.
          try { saved = resolveSolDshConfig(user); } catch { saved = undefined; }
          revision += 1;
          return true;
        },
      };
    } },
  });
  return {
    entries, writes,
    declare() { for (const item of waiting) if (item.name === "plugins.bundle.config") { const off = item.callback(); if (typeof off === "function") cleanups.push(off); } },
    entry() { const value = entries.get("dsh-sol-pi"); expect(value, "new plugin manager must discover exact bundle key").toBeDefined(); return value; },
    readonly() { readOnly = true; },
    reject() { rejectSave = true; },
    recover() { recoverSave = true; },
    override(value: any) { user = value; },
    render(entry: any, props: any, view = "page") { cursor = 0; let node = entry.component({ ...props, view }); while (node && typeof node.type === "function") node = node.type(node.props); return node; },
    async mount() { mounted = true; for (const effect of effects.splice(0)) { const off = effect(); if (typeof off === "function") cleanups.push(off); } await flush(); },
    unmount() { cleanups.reverse().forEach(off => off()); },
  };
}
async function flush() { for (let i = 0; i < 16; i++) await Promise.resolve(); }

function nodes(tree: any, match: (node: any) => boolean): any[] {
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, match));
  if (!tree || typeof tree !== "object") return [];
  return [...(match(tree) ? [tree] : []), ...nodes(tree.props?.children, match)];
}

describe("DSH plugin manager configuration", () => {
  it("waits for the new slot and unregisters the exact bundle key on unload", () => {
    const h = harness(); expect(h.entries.size).toBe(0); h.declare();
    expect(h.entry().spec.name).toBe("plugins.bundle.config");
    h.unmount(); expect(h.entries.size).toBe(0);
  });
  it("declares the new owner package dependency", () => {
    const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(manifest.dsh.client.inject).toContain("@deepseek-ai/dsh-client-ui-plugin-manager");
    expect(manifest.dsh.client.inject).toContain("@deepseek-ai/dsh-client-ui-settings");
    expect(manifest.dsh.client.inject).not.toContain("@deepseek-ai/dsh-client-ui-settings-plugins");
    expect(manifest.dsh.client.inject).not.toContain("@deepseek-ai/dsh-client-ui-model-selection");
    expect(manifest.dsh.client.immediately).not.toBe(true);
  });
  it("renders summary as text and the settings page without an accordion", async () => {
    const h = harness(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    expect(h.render(entry, props, "summary")).toBe(props.t("description"));
    h.render(entry, props); await h.mount(); const page = h.render(entry, props);
    expect(page.type).toBe("section");
    expect(nodes(page, node => node.type?.name === "SwitchRow").length).toBeGreaterThan(0);
    expect(nodes(page, node => node.props?.["aria-expanded"] !== undefined).length).toBe(0);
    expect(h.writes).toEqual([]);
  });
  it("keeps edits on parent renders and only explicit Save invokes mutations", async () => {
    const h = harness(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    h.render(entry, props); await h.mount();
    let page = h.render(entry, props);
    const first = nodes(page, node => node.type?.name === "SwitchRow")[0];
    first.props.onChange(!first.props.checked);
    page = h.render(entry, entry.spec.inject());
    expect(nodes(page, node => node.type?.name === "SwitchRow")[0].props.checked).toBe(!first.props.checked);
    expect(h.writes).toEqual([]);
    nodes(page, node => node.type === "button" && node.props.children === props.t("save"))[0].props.onClick();
    await flush();
    expect(h.writes).toHaveLength(1); expect(h.writes[0].revision).toBe(7);
    expect(h.render(entry, props).type).toBe("section");
  });
  it("read-only scope rejects saving and disables the form", async () => {
    const h = harness(); h.readonly(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    h.render(entry, props); await h.mount(); const page = h.render(entry, props);
    expect(nodes(page, node => node.type?.name === "SwitchRow").every(node => node.props.disabled)).toBe(true);
    const snap = await props.load();
    await expect(props.onSave(snap.value, snap.revision, snap.base, snap.user)).rejects.toThrow();
    expect(h.writes).toEqual([]);
  });
  it("a rejected revision preserves the editable draft", async () => {
    const h = harness(); h.reject(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    h.render(entry, props); await h.mount(); let page = h.render(entry, props);
    const first = nodes(page, node => node.type?.name === "SwitchRow")[0]; first.props.onChange(!first.props.checked);
    page = h.render(entry, props);
    nodes(page, node => node.type === "button" && node.props.children === props.t("save"))[0].props.onClick();
    await flush();
    page = h.render(entry, props);
    expect(nodes(page, node => node.type?.name === "SwitchRow")[0].props.checked).toBe(!first.props.checked);
    expect(nodes(page, node => node.type === "p" && node.props.children === "stale revision").length).toBe(1);
    expect(h.writes).toEqual([]);
  });
  it("preserves drafts when DSH recovers a failed mutation without throwing", async () => {
    const h = harness(); h.recover(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    h.render(entry, props); await h.mount(); let page = h.render(entry, props);
    const first = nodes(page, node => node.type?.name === "SwitchRow")[0]; first.props.onChange(!first.props.checked);
    page = h.render(entry, props);
    nodes(page, node => node.type === "button" && node.props.children === props.t("save"))[0].props.onClick();
    await flush(); page = h.render(entry, props);
    expect(nodes(page, node => node.type?.name === "SwitchRow")[0].props.checked).toBe(!first.props.checked);
    expect(nodes(page, node => node.type === "p" && node.props.children === props.t("saveFailed"))).toHaveLength(1);
  });
  it("treats pending numeric text edits as dirty so Save persists and Discard clears", async () => {
    // Use keepRecentTokens (not fullSends): default mode is immediate, which rejects fullSends > 0.
    const h = harness(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    h.render(entry, props); await h.mount();
    let page = h.render(entry, props);
    const saveBtn = () => nodes(page, node => node.type === "button" && node.props.children === props.t("save"))[0];
    const discardBtn = () => nodes(page, node => node.type === "button" && node.props.children === props.t("discard"))[0];
    const keep = () => nodes(page, node => node.type?.name === "ValueRow" && node.props.id === "sol-occ-keep")[0];
    expect(saveBtn().props.disabled).toBe(true);
    const before = keep().props.text;
    keep().props.onEdit("1");
    page = h.render(entry, props);
    expect(keep().props.text).toBe("1");
    expect(keep().props.overridden).toBe(true);
    expect(saveBtn().props.disabled).toBe(false);
    expect(discardBtn().props.disabled).toBe(false);
    discardBtn().props.onClick();
    page = h.render(entry, props);
    expect(keep().props.text).toBe(before);
    expect(saveBtn().props.disabled).toBe(true);
    expect(h.writes).toHaveLength(0);
    keep().props.onEdit("1");
    page = h.render(entry, props);
    saveBtn().props.onClick();
    await flush();
    expect(h.writes).toHaveLength(1);
    const ops = h.writes[0].ops;
    expect(ops.some((op: any) => op.op === "set" && op.path[0] === "onlineContextCompact" && op.value?.keepRecentTokens === 1)).toBe(true);
    page = h.render(entry, props);
    expect(saveBtn().props.disabled).toBe(true);
  });

  it("confirms successful writes and Discard never writes", async () => {
    const h = harness(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    h.render(entry, props); await h.mount(); let page = h.render(entry, props);
    const first = nodes(page, node => node.type?.name === "SwitchRow")[0]; first.props.onChange(!first.props.checked);
    page = h.render(entry, props);
    nodes(page, node => node.type === "button" && node.props.children === props.t("discard"))[0].props.onClick();
    page = h.render(entry, props);
    expect(nodes(page, node => node.type?.name === "SwitchRow")[0].props.checked).toBe(first.props.checked);
    expect(h.writes).toHaveLength(0);
    first.props.onChange(!first.props.checked); page = h.render(entry, props);
    nodes(page, node => node.type === "button" && node.props.children === props.t("save"))[0].props.onClick();
    await flush(); page = h.render(entry, props);
    expect(nodes(page, node => node.type === "button" && node.props.children === props.t("save"))[0].props.disabled).toBe(true);
    expect(nodes(page, node => node.type === "p" && node.props.children === props.t("saveFailed"))).toHaveLength(0);
    expect(h.writes).toHaveLength(1);
  });
  it("does not mistake an unchanged effective default for a successful unset", async () => {
    const h = harness(); h.recover(); h.override({ actionFusion: { enabled: true } }); h.declare();
    const props = h.entry().spec.inject(); const snap = await props.load();
    await expect(props.onSave(snap.value, snap.revision, snap.base, snap.user)).rejects.toThrow(props.t("saveFailed"));
    expect(h.writes[0].ops).toEqual([{ op: "unset", path: ["actionFusion"] }]);
  });
  it("ignores initial loads that settle after the form unmounts", async () => {
    const h = harness(); h.declare(); const entry = h.entry(); const props = entry.spec.inject();
    const snap = await props.load(); let finish!: (value: any) => void;
    const delayed = { ...props, load: () => new Promise(resolve => { finish = resolve; }) };
    h.render(entry, delayed); await h.mount(); h.unmount(); finish(snap); await flush();
    const page = h.render(entry, delayed);
    expect(nodes(page, node => node.type?.name === "SwitchRow").every(node => node.props.disabled)).toBe(true);
  });
});

describe("DSH client bundle registration invariants", () => {
  it("registers plugins.bundle.config under the npm package name", () => {
    const h = harness();
    h.declare();
    expect(h.entry().spec.key).toBe("dsh-sol-pi");
    expect(h.entries.has("dsh-sol-pi")).toBe(true);
  });

  it("registers Settings without calling ctx.inject", () => {
    const h = harness();
    // harness apply has no ctx.inject — registration must still succeed
    h.declare();
    expect(h.entry().spec.name).toBe("plugins.bundle.config");
  });

  it("ships a Schemastery-free client artifact", () => {
    const artifact = readFileSync(new URL("../dist/sol-dsh/client.js", import.meta.url), "utf8");
    expect(artifact).toContain("window.__ModuleLoader__.load");
    expect(artifact).toMatch(/key:\s*(?:SOL_DSH_SETTINGS_NAMESPACE|"dsh-sol-pi")/);
    expect(artifact.toLowerCase()).not.toContain("schemastery");
    expect(artifact.toLowerCase()).not.toContain("cosmokit");
    expect(artifact).not.toContain("modelDirectories");
  });

  it("does not require dsh-client-ui-primitives (seed-table miss aborts materialize)", () => {
    const artifact = readFileSync(new URL("../dist/sol-dsh/client.js", import.meta.url), "utf8");
    expect(artifact).not.toContain("@deepseek-ai/dsh-client-ui-primitives");
    expect(artifact).toContain('require("react")');
    expect(artifact).toContain('require("react/jsx-runtime")');

    // Live ModuleLoader makeRequire: non-seed require throws and aborts factory.
    let loaded: { id: string; factory: (require: (name: string) => unknown) => any } | undefined;
    const sandbox = {
      window: { __ModuleLoader__: { load(def: typeof loaded) { loaded = def!; } } },
      document: { getElementById: () => null, createElement: () => ({ id: "", textContent: "" }), head: { appendChild() {} } },
      console: { info() {}, error() {}, warn() {} },
      Object, Array, Error, Promise, setTimeout, clearTimeout, JSON, Map, Set,
    };
    vm.runInNewContext(artifact, sandbox);
    const seed = new Map<string, unknown>([
      ["react", { useState: () => [null, () => {}], useEffect: () => {}, useMemo: (f: () => unknown) => f(), useRef: (v: unknown) => ({ current: v }), createElement: () => null }],
      ["react/jsx-runtime", { jsx: () => null, jsxs: () => null }],
    ]);
    const mod = loaded!.factory((name: string) => {
      if (seed.has(name)) return seed.get(name);
      throw new Error(`client-modules: require("${name}") missed the module table`);
    });
    expect(typeof mod.apply).toBe("function");
  });

  it("assigns exports.apply and exports.inject for ModuleLoader/Cordis", () => {
    // Regression: esbuild CJS emitted module.exports = __toCommonJS(...) (getters +
    // __esModule) without exports.apply = apply. Cordis then never received apply,
    // plugins.bundle.config never registered, ledger.bundles lacked dsh-sol-pi,
    // and PackageDetail hid Settings (configured = ledger.bundles.has(pkg.name)).
    const artifact = readFileSync(new URL("../dist/sol-dsh/client.js", import.meta.url), "utf8");
    expect(artifact).toContain("exports.apply = apply");
    expect(artifact).toContain("exports.inject = inject");

    let loaded: { id: string; factory: (require: (name: string) => unknown) => any } | undefined;
    const sandbox = {
      window: { __ModuleLoader__: { load(def: typeof loaded) { loaded = def!; } } },
      document: {
        getElementById: () => null,
        createElement: () => ({ id: "", textContent: "" }),
        head: { appendChild() {} },
      },
      Object, Array, Error, Promise, setTimeout, clearTimeout, JSON, Map, Set, console,
    };
    vm.runInNewContext(artifact, sandbox);
    expect(loaded?.id).toBe("dsh-sol-pi");
    const mod = loaded!.factory((name: string) => {
      if (name === "react") return { useState: () => [null, () => {}], useEffect: () => {}, useMemo: (f: () => unknown) => f(), useRef: (v: unknown) => ({ current: v }), createElement: () => null };
      if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
      if (name === "react-dom" || name === "react-dom/client") return {};
      if (name === "@deepseek-ai/dsh-client-store") return { createSnapshotStore: () => ({}) };
      throw new Error(name);
    });
    const applyDesc = Object.getOwnPropertyDescriptor(mod, "apply");
    const injectDesc = Object.getOwnPropertyDescriptor(mod, "inject");
    expect(typeof mod.apply).toBe("function");
    expect(mod.inject).toEqual(["slots", "locale", "configForms"]);
    // Own data properties — not esbuild getter bag on a replaced module.exports.
    expect(applyDesc?.value).toBeTypeOf("function");
    expect(injectDesc?.value).toEqual(["slots", "locale", "configForms"]);
    expect(mod.__esModule).toBeUndefined();
  });
});
