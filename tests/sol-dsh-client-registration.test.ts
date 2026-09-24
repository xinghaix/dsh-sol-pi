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
    external: ["react", "react/jsx-runtime", "@deepseek-ai/dsh-client-ui-primitives"],
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
    if (name === "@deepseek-ai/dsh-client-ui-primitives") return { Menu: () => null, Switch: () => null, Tag: () => null, IconChevronDownOutline14: () => null };
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
