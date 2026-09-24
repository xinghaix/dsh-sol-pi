window.__ModuleLoader__.load({ id: "dsh-sol-pi", factory: function (require) {
const module = { exports: {} };
const exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/sol-dsh/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/sol-dsh/config.ts
var SOL_DSH_SETTINGS_NAMESPACE = "dsh-sol-pi";
var FORBIDDEN_KEYS = /* @__PURE__ */ new Set([
  "apikey",
  "api_key",
  "api-key",
  "token",
  "password",
  "secret",
  "url",
  "baseurl",
  "base_url",
  "storagepath",
  "storeroot",
  "credentials",
  "locale",
  "language"
]);
var ROOT_KEYS = /* @__PURE__ */ new Set([
  "actionFusion",
  "observationPack",
  "evidencePreservingReducer",
  "onlineContextCompact"
]);
var ACTION_FUSION_KEYS = /* @__PURE__ */ new Set(["enabled"]);
var OBSERVATION_PACK_KEYS = /* @__PURE__ */ new Set([
  "enabled",
  "mode",
  "thresholdBytes",
  "fullSends",
  "placeholderExcerptBytes"
]);
var EPR_KEYS = /* @__PURE__ */ new Set([
  "enabled",
  "minBytes",
  "maxChars",
  "maxOutputTokens",
  "timeoutMs",
  "reducerProvider",
  "reducerModel"
]);
var OCC_KEYS = /* @__PURE__ */ new Set([
  "enabled",
  "cacheWriteReadRatio",
  "keepRecentTokens",
  "nativeSummaryTokenEstimate",
  "windowReserveTokens",
  "firstCompactionRequestScale",
  "subsequentCompactionMargin"
]);
var SOL_DSH_DEFAULTS = {
  actionFusion: { enabled: true },
  observationPack: {
    enabled: true,
    mode: "immediate",
    thresholdBytes: 10240,
    fullSends: 0,
    placeholderExcerptBytes: 1024
  },
  evidencePreservingReducer: {
    enabled: true,
    minBytes: 4096,
    maxChars: 6e5,
    maxOutputTokens: 2048,
    timeoutMs: 9e4,
    reducerProvider: "",
    reducerModel: ""
  },
  onlineContextCompact: {
    enabled: true,
    cacheWriteReadRatio: 50,
    keepRecentTokens: 0,
    nativeSummaryTokenEstimate: 1e3,
    windowReserveTokens: 16384,
    firstCompactionRequestScale: 2,
    subsequentCompactionMargin: 1.5
  }
};
function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`dsh-sol-pi: ${label} must be a plain object`);
  }
}
function rejectForbiddenAndUnknown(record, allowed, label) {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      throw new Error(`dsh-sol-pi: forbidden config key "${key}"`);
    }
    if (!allowed.has(key)) {
      throw new Error(`dsh-sol-pi: unknown config key "${label}${key}"`);
    }
  }
}
function asBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function asNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function asNonNegInt(value, fallback) {
  const n = asNumber(value, fallback);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}
function asPosInt(value, fallback) {
  const n = asNumber(value, fallback);
  return Number.isInteger(n) && n >= 1 ? n : fallback;
}
function asString(value, fallback) {
  return typeof value === "string" ? value : fallback;
}
function asMode(value, fallback) {
  return value === "delayed" || value === "immediate" ? value : fallback;
}
function resolveSolDshConfig(raw = {}) {
  assertPlainObject(raw, "configuration");
  rejectForbiddenAndUnknown(raw, ROOT_KEYS, "");
  if (raw.actionFusion !== void 0) {
    assertPlainObject(raw.actionFusion, "actionFusion");
    rejectForbiddenAndUnknown(raw.actionFusion, ACTION_FUSION_KEYS, "actionFusion.");
  }
  if (raw.observationPack !== void 0) {
    assertPlainObject(raw.observationPack, "observationPack");
    rejectForbiddenAndUnknown(raw.observationPack, OBSERVATION_PACK_KEYS, "observationPack.");
  }
  if (raw.evidencePreservingReducer !== void 0) {
    assertPlainObject(raw.evidencePreservingReducer, "evidencePreservingReducer");
    rejectForbiddenAndUnknown(raw.evidencePreservingReducer, EPR_KEYS, "evidencePreservingReducer.");
  }
  if (raw.onlineContextCompact !== void 0) {
    assertPlainObject(raw.onlineContextCompact, "onlineContextCompact");
    rejectForbiddenAndUnknown(raw.onlineContextCompact, OCC_KEYS, "onlineContextCompact.");
  }
  const d = SOL_DSH_DEFAULTS;
  const actionFusionRaw = raw.actionFusion ?? {};
  const observationRaw = raw.observationPack ?? {};
  const eprRaw = raw.evidencePreservingReducer ?? {};
  const occRaw = raw.onlineContextCompact ?? {};
  const config = {
    actionFusion: {
      enabled: asBoolean(actionFusionRaw.enabled, d.actionFusion.enabled)
    },
    observationPack: {
      enabled: asBoolean(observationRaw.enabled, d.observationPack.enabled),
      mode: asMode(observationRaw.mode, d.observationPack.mode),
      thresholdBytes: asPosInt(observationRaw.thresholdBytes, d.observationPack.thresholdBytes),
      fullSends: asNonNegInt(observationRaw.fullSends, d.observationPack.fullSends),
      placeholderExcerptBytes: asPosInt(
        observationRaw.placeholderExcerptBytes,
        d.observationPack.placeholderExcerptBytes
      )
    },
    evidencePreservingReducer: {
      enabled: asBoolean(eprRaw.enabled, d.evidencePreservingReducer.enabled),
      minBytes: asPosInt(eprRaw.minBytes, d.evidencePreservingReducer.minBytes),
      maxChars: asPosInt(eprRaw.maxChars, d.evidencePreservingReducer.maxChars),
      maxOutputTokens: asPosInt(eprRaw.maxOutputTokens, d.evidencePreservingReducer.maxOutputTokens),
      timeoutMs: asPosInt(eprRaw.timeoutMs, d.evidencePreservingReducer.timeoutMs),
      reducerProvider: asString(eprRaw.reducerProvider, d.evidencePreservingReducer.reducerProvider),
      reducerModel: asString(eprRaw.reducerModel, d.evidencePreservingReducer.reducerModel)
    },
    onlineContextCompact: {
      enabled: asBoolean(occRaw.enabled, d.onlineContextCompact.enabled),
      cacheWriteReadRatio: asNumber(occRaw.cacheWriteReadRatio, d.onlineContextCompact.cacheWriteReadRatio),
      keepRecentTokens: asNonNegInt(occRaw.keepRecentTokens, d.onlineContextCompact.keepRecentTokens),
      nativeSummaryTokenEstimate: asPosInt(
        occRaw.nativeSummaryTokenEstimate,
        d.onlineContextCompact.nativeSummaryTokenEstimate
      ),
      windowReserveTokens: asPosInt(occRaw.windowReserveTokens, d.onlineContextCompact.windowReserveTokens),
      firstCompactionRequestScale: asNumber(
        occRaw.firstCompactionRequestScale,
        d.onlineContextCompact.firstCompactionRequestScale
      ),
      subsequentCompactionMargin: asNumber(
        occRaw.subsequentCompactionMargin,
        d.onlineContextCompact.subsequentCompactionMargin
      )
    }
  };
  if (config.observationPack.mode === "immediate" && config.observationPack.fullSends > 0) {
    throw new Error("dsh-sol-pi: observationPack.mode immediate requires fullSends = 0");
  }
  const provider = config.evidencePreservingReducer.reducerProvider.trim();
  const model = config.evidencePreservingReducer.reducerModel.trim();
  if (provider === "" !== (model === "")) {
    throw new Error("dsh-sol-pi: reducerProvider and reducerModel must both be empty or both be set");
  }
  if (!Number.isFinite(config.onlineContextCompact.cacheWriteReadRatio)) {
    throw new Error("dsh-sol-pi: cacheWriteReadRatio must be finite");
  }
  if (!(config.onlineContextCompact.subsequentCompactionMargin >= 1)) {
    throw new Error("dsh-sol-pi: subsequentCompactionMargin must be >= 1");
  }
  return {
    ...config,
    evidencePreservingReducer: {
      ...config.evidencePreservingReducer,
      reducerProvider: provider,
      reducerModel: model
    }
  };
}
var DEFAULT_SOL_DSH_CONFIG = resolveSolDshConfig({});

// src/sol-dsh/client/card.tsx
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react = require("react");

// sol-dsh-css:/Users/xing/Projects/github/dsh-sol-pi/src/sol-dsh/client/card.module.css
if (typeof document !== "undefined" && !document.getElementById("sol-dsh-css")) {
  const s = document.createElement("style");
  s.id = "sol-dsh-css";
  s.textContent = "/* Plugin-manager form fields; the owner supplies page chrome. */\n\n.solDsh_body {\n	padding-bottom: 8px;\n}\n\n.solDsh_readOnly {\n	color: var(--dsw-alias-label-tertiary);\n	margin: 12px 0 0;\n	font-size: 12px;\n	line-height: 1.5;\n}\n\n.solDsh_footer {\n	border-top: 0.5px solid var(--dsw-alias-border-l2);\n	justify-content: flex-end;\n	align-items: center;\n	gap: 8px;\n	padding: 12px 0 4px;\n	display: flex;\n}\n\n.solDsh_failed {\n	min-width: 0;\n	color: var(--dsw-alias-label-error);\n	flex: 1;\n	margin: 0;\n	font-size: 12px;\n	line-height: 1.5;\n}\n\n.solDsh_discard,\n.solDsh_save {\n	appearance: none;\n	font: inherit;\n	cursor: pointer;\n	border: 1px solid transparent;\n	border-radius: 8px;\n	padding: 5px 14px;\n	font-size: 13px;\n	line-height: 1.5;\n}\n\n.solDsh_discard {\n	border-color: var(--dsw-alias-border-l2);\n	color: var(--dsw-alias-label-secondary);\n	background: 0 0;\n}\n\n.solDsh_discard:hover:not(:disabled) {\n	color: var(--dsw-alias-label-primary);\n	border-color: var(--dsw-alias-label-dimmed);\n}\n\n.solDsh_save {\n	background: var(--dsw-alias-label-primary);\n	color: var(--dsw-alias-bg-layer-3);\n}\n\n.solDsh_discard:disabled,\n.solDsh_save:disabled {\n	opacity: 0.4;\n	cursor: default;\n}\n\n.solDsh_discard:focus-visible,\n.solDsh_save:focus-visible {\n	outline: 2px solid var(--dsw-alias-brand-primary);\n	outline-offset: 1px;\n}\n\n.solDsh_field {\n	flex-direction: column;\n	gap: 6px;\n	padding: 12px 0;\n	display: flex;\n}\n\n.solDsh_field + .solDsh_field {\n	border-top: 0.5px solid var(--dsw-alias-border-l2);\n}\n\n.solDsh_head {\n	align-items: center;\n	gap: 8px;\n	display: flex;\n}\n\n.solDsh_label {\n	min-width: 0;\n	color: var(--dsw-alias-label-primary);\n	flex: 1;\n	font-size: 13px;\n	font-weight: 500;\n	line-height: 1.5;\n}\n\n.solDsh_hint {\n	color: var(--dsw-alias-label-tertiary);\n	margin: 0;\n	font-size: 12px;\n	line-height: 1.5;\n}\n\n.solDsh_input {\n	border: 0.5px solid var(--dsw-alias-border-l4);\n	background: var(--dsw-alias-bg-layer-3);\n	height: 34px;\n	font: inherit;\n	color: var(--dsw-alias-label-primary);\n	border-radius: 8px;\n	padding: 0 12px;\n	font-size: 13px;\n	line-height: 1.5;\n	width: 100%;\n	box-sizing: border-box;\n}\n\n.solDsh_input:focus-visible {\n	border-color: var(--dsw-alias-brand-primary);\n	outline: none;\n}\n\n.solDsh_input:disabled {\n	color: var(--dsw-alias-label-tertiary);\n	cursor: default;\n}\n\n/* Permission-row style trigger; menu chrome comes from primitives.solDsh_Menu */\n.solDsh_selector {\n	appearance: none;\n	width: 100%;\n	box-sizing: border-box;\n	height: 34px;\n	font: inherit;\n	color: var(--dsw-alias-label-primary);\n	cursor: pointer;\n	background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-1));\n	border: 0.5px solid var(--dsw-alias-border-l4);\n	border-radius: 8px;\n	align-items: center;\n	justify-content: space-between;\n	gap: 12px;\n	padding: 0 12px;\n	font-size: 13px;\n	line-height: 1.5;\n	display: inline-flex;\n}\n\n.solDsh_selector:hover:not(:disabled) {\n	background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.solDsh_selector:disabled {\n	color: var(--dsw-alias-label-tertiary);\n	cursor: default;\n}\n\n.solDsh_selector:focus-visible {\n	border-color: var(--dsw-alias-brand-primary);\n	outline: none;\n}\n\n.solDsh_selectorLabel {\n	min-width: 0;\n	overflow: hidden;\n	text-overflow: ellipsis;\n	white-space: nowrap;\n	flex: 1;\n	text-align: left;\n}\n\n.solDsh_selectorChevron {\n	color: var(--dsw-alias-label-tertiary);\n	flex: none;\n	transition: transform 0.16s;\n}\n\n.solDsh_selectorChevronOpen {\n	transform: rotate(180deg);\n}\n\n/* SubagentModelSelectionCard.solDsh_toggleRow */\n.solDsh_toggleRow {\n	color: var(--dsw-alias-label-primary);\n	justify-content: space-between;\n	align-items: flex-start;\n	gap: 16px;\n	font-size: 13px;\n	line-height: 1.5;\n	display: flex;\n}\n\n.solDsh_toggleLabel {\n	flex: 1;\n	min-width: 0;\n	font-weight: 500;\n}\n\n.solDsh_badges {\n	align-items: center;\n	gap: 8px;\n	display: inline-flex;\n	flex: none;\n	padding-top: 1px;\n}\n\n.solDsh_reset {\n	font: inherit;\n	color: var(--dsw-alias-label-secondary);\n	cursor: pointer;\n	background: 0 0;\n	border: none;\n	padding: 0;\n	font-size: 12px;\n	line-height: 1.5;\n}\n\n.solDsh_reset:hover:not(:disabled) {\n	color: var(--dsw-alias-label-primary);\n}\n\n.solDsh_reset:disabled {\n	cursor: default;\n}\n\n.solDsh_inputInvalid {\n	border-color: var(--dsw-alias-label-error);\n}\n\n.solDsh_invalid {\n	color: var(--dsw-alias-label-error);\n	margin: 0;\n	font-size: 12px;\n	line-height: 1.5;\n}\n\n.solDsh_fold {\n	flex-direction: column;\n	gap: 0;\n	padding: 12px 0;\n	display: flex;\n}\n\n.solDsh_field + .solDsh_fold,\n.solDsh_fold + .solDsh_field {\n	border-top: 0.5px solid var(--dsw-alias-border-l2);\n}\n\n.solDsh_foldHeader {\n	appearance: none;\n	width: 100%;\n	font: inherit;\n	color: inherit;\n	text-align: left;\n	cursor: pointer;\n	background: 0 0;\n	border: 0;\n	border-radius: 8px;\n	align-items: center;\n	gap: 8px;\n	padding: 0;\n	display: flex;\n}\n\n.solDsh_foldHeader:focus-visible {\n	outline: 2px solid var(--dsw-alias-brand-primary);\n	outline-offset: 2px;\n}\n\n.solDsh_foldText {\n	flex-direction: column;\n	flex: 1;\n	gap: 2px;\n	min-width: 0;\n	display: flex;\n}\n\n.solDsh_foldTitle {\n	color: var(--dsw-alias-label-primary);\n	font-size: 13px;\n	font-weight: 500;\n	line-height: 1.5;\n}\n\n.solDsh_foldSummary {\n	color: var(--dsw-alias-label-tertiary);\n	font-size: 12px;\n	line-height: 1.5;\n}\n\n.solDsh_foldChevron {\n	color: var(--dsw-alias-label-tertiary);\n	flex: none;\n	transition: transform 0.16s;\n}\n\n.solDsh_foldChevronOpen {\n	transform: rotate(180deg);\n}\n\n.solDsh_foldBody {\n	flex-direction: column;\n	gap: 0;\n	margin-top: 8px;\n	display: flex;\n}\n\n.solDsh_stackField {\n	flex-direction: column;\n	gap: 6px;\n	padding: 10px 0 0;\n	display: flex;\n}\n\n.solDsh_stackLabel {\n	color: var(--dsw-alias-label-tertiary);\n	font-size: 12px;\n	line-height: 1.5;\n}\n";
  document.head.appendChild(s);
}
var card_default = { "body": "solDsh_body", "readOnly": "solDsh_readOnly", "footer": "solDsh_footer", "failed": "solDsh_failed", "save": "solDsh_save", "discard": "solDsh_discard", "field": "solDsh_field", "head": "solDsh_head", "label": "solDsh_label", "hint": "solDsh_hint", "input": "solDsh_input", "selector": "solDsh_selector", "selectorLabel": "solDsh_selectorLabel", "selectorChevron": "solDsh_selectorChevron", "selectorChevronOpen": "solDsh_selectorChevronOpen", "toggleRow": "solDsh_toggleRow", "toggleLabel": "solDsh_toggleLabel", "badges": "solDsh_badges", "reset": "solDsh_reset", "inputInvalid": "solDsh_inputInvalid", "invalid": "solDsh_invalid", "fold": "solDsh_fold", "foldHeader": "solDsh_foldHeader", "foldText": "solDsh_foldText", "foldTitle": "solDsh_foldTitle", "foldSummary": "solDsh_foldSummary", "foldChevron": "solDsh_foldChevron", "foldChevronOpen": "solDsh_foldChevronOpen", "foldBody": "solDsh_foldBody", "stackField": "solDsh_stackField", "stackLabel": "solDsh_stackLabel" };

// src/sol-dsh/client/card.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function cloneConfig(value) {
  return structuredClone(value);
}
function sameConfig(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function readPath(source, path) {
  let current = source;
  for (const key of path) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) return void 0;
    current = current[key];
  }
  return current;
}
function hasPath(user, path) {
  let current = user;
  for (const key of path) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) return false;
    if (!Object.prototype.hasOwnProperty.call(current, key)) return false;
    current = current[key];
  }
  return true;
}
function writePath(target, path, value) {
  const next = cloneConfig(target);
  let cursor = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const child = cursor[key];
    const copy = typeof child === "object" && child !== null && !Array.isArray(child) ? { ...child } : {};
    cursor[key] = copy;
    cursor = copy;
  }
  cursor[path[path.length - 1]] = value;
  return next;
}
function pathKey(path) {
  return path.join(".");
}
function FieldHead(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.head, children: [
    props.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: card_default.label, htmlFor: props.id, children: props.label }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.label, children: props.label }),
    props.overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: card_default.badges, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: props.overriddenLabel }),
      props.onReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: card_default.reset, disabled: props.disabled, onClick: props.onReset, children: props.resetLabel }) : null
    ] }) : null
  ] });
}
function SwitchRow(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.toggleRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.toggleLabel, children: props.label }),
      props.overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: card_default.badges, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: props.overriddenLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: card_default.reset, disabled: props.disabled, onClick: props.onReset, children: props.resetLabel })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Switch,
        {
          checked: props.checked,
          label: props.label,
          disabled: props.disabled,
          onChange: props.onChange
        }
      )
    ] }),
    props.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, children: props.hint }) : null
  ] });
}
function ValueRow(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      FieldHead,
      {
        id: props.id,
        label: props.label,
        overridden: props.overridden,
        disabled: props.disabled,
        overriddenLabel: props.overriddenLabel,
        resetLabel: props.resetLabel,
        onReset: props.onReset
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        id: props.id,
        className: props.invalid ? card_default.inputInvalid : card_default.input,
        type: "text",
        inputMode: props.numeric ? "numeric" : void 0,
        "aria-invalid": props.invalid || void 0,
        value: props.text,
        disabled: props.disabled,
        onChange: (event) => props.onEdit(event.target.value)
      }
    ),
    props.invalid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.invalid, children: props.invalidLabel }) : props.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, children: props.hint }) : null
  ] });
}
function SelectRow(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const selected = props.options.find((option) => option.id === props.value);
  const triggerLabel = selected?.label ?? props.value;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.field, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      FieldHead,
      {
        id: props.id,
        label: props.label,
        overridden: props.overridden,
        disabled: props.disabled,
        overriddenLabel: props.overriddenLabel,
        resetLabel: props.resetLabel,
        onReset: props.onReset
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open,
        onClose: () => setOpen(false),
        items: props.options,
        selectedId: props.value,
        align: "start",
        portal: true,
        onSelect: (id) => {
          setOpen(false);
          if (id === props.value) return;
          props.onChange(id);
        },
        anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            id: props.id,
            className: card_default.selector,
            "aria-haspopup": "menu",
            "aria-expanded": open,
            disabled: props.disabled,
            onClick: () => setOpen((value) => !value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.selectorLabel, children: triggerLabel }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_dsh_client_ui_primitives.IconChevronDownOutline14,
                {
                  className: `${card_default.selectorChevron}${open ? ` ${card_default.selectorChevronOpen}` : ""}`
                }
              )
            ]
          }
        )
      }
    ),
    props.hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, children: props.hint }) : null,
    props.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, children: props.detail }) : null
  ] });
}
var FOLLOW = "__follow__";
function toMenuId(value) {
  return value.trim() ? value : FOLLOW;
}
function fromMenuId(value) {
  return value === FOLLOW ? "" : value;
}
function StackSelect(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const selected = props.options.find((option) => option.id === props.value);
  const triggerLabel = selected?.label ?? (props.value || props.placeholder);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.stackField, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.stackLabel, id: `${props.id}-label`, children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open,
        onClose: () => setOpen(false),
        items: props.options,
        selectedId: props.value,
        align: "start",
        portal: true,
        onSelect: (id) => {
          setOpen(false);
          props.onChange(id);
        },
        anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            id: props.id,
            className: card_default.selector,
            "aria-labelledby": `${props.id}-label`,
            "aria-haspopup": "menu",
            "aria-expanded": open,
            disabled: props.disabled,
            onClick: () => setOpen((value) => !value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.selectorLabel, children: triggerLabel }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_dsh_client_ui_primitives.IconChevronDownOutline14,
                {
                  className: `${card_default.selectorChevron}${open ? ` ${card_default.selectorChevronOpen}` : ""}`
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
function ReducerRouteFold(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const follow = !props.provider && !props.model;
  const summary = follow ? props.t("reducerRouteSummaryFollow") : props.t("reducerRouteSummaryPinned").replace("{provider}", props.provider).replace("{model}", props.model);
  const providerOptions = [
    { id: FOLLOW, label: props.t("reducerFollowAgent") },
    ...props.catalog.map((group2) => ({ id: group2.id, label: group2.name || group2.id }))
  ];
  if (props.provider && !providerOptions.some((option) => option.id === props.provider)) {
    providerOptions.push({ id: props.provider, label: props.provider });
  }
  const group = props.catalog.find((entry) => entry.id === props.provider);
  const modelOptions = [
    ...group?.models.map((model) => ({ id: model.id, label: model.name || model.id })) ?? []
  ];
  if (props.model && !modelOptions.some((option) => option.id === props.model)) {
    modelOptions.unshift({ id: props.model, label: props.model });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.fold, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: card_default.foldHeader,
        "aria-expanded": open,
        "aria-label": props.t(open ? "reducerRouteCollapse" : "reducerRouteExpand"),
        onClick: () => {
          const next = !open;
          setOpen(next);
          if (next) props.onOpen();
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: card_default.foldText, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.foldTitle, children: props.t("reducerRoute") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.foldSummary, children: summary })
          ] }),
          props.overridden ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: card_default.badges, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", children: props.overriddenLabel }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                className: card_default.reset,
                disabled: props.disabled,
                onClick: (event) => {
                  event.stopPropagation();
                  props.onReset();
                },
                children: props.resetLabel
              }
            )
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: `${card_default.foldChevron}${open ? ` ${card_default.foldChevronOpen}` : ""}` })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.foldBody, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, children: props.t("reducerRouteHelp") }),
      props.catalogStatus === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, role: "status", children: props.t("reducerCatalogLoading") }) : null,
      props.catalogStatus === "empty" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.hint, children: props.t("reducerCatalogEmpty") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        StackSelect,
        {
          id: "sol-epr-provider",
          label: props.t("reducerProvider"),
          value: toMenuId(props.provider),
          placeholder: props.t("reducerFollowAgent"),
          options: providerOptions,
          disabled: props.disabled,
          onChange: (value) => {
            const provider = fromMenuId(value);
            if (!provider) {
              props.onRoute("", "");
              return;
            }
            const nextGroup = props.catalog.find((entry) => entry.id === provider);
            const keepModel = props.model && nextGroup?.models.some((model) => model.id === props.model) ? props.model : nextGroup?.models[0]?.id ?? "";
            props.onRoute(provider, keepModel);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        StackSelect,
        {
          id: "sol-epr-model",
          label: props.t("reducerModel"),
          value: props.provider ? toMenuId(props.model) : FOLLOW,
          placeholder: props.t("reducerFollowAgent"),
          options: props.provider && modelOptions.length > 0 ? modelOptions : [{ id: FOLLOW, label: props.t("reducerFollowAgent") }],
          disabled: props.disabled || !props.provider || modelOptions.length === 0,
          onChange: (value) => {
            const model = fromMenuId(value);
            if (!model) {
              props.onRoute("", "");
              return;
            }
            props.onRoute(props.provider, model);
          }
        }
      )
    ] }) : null
  ] });
}
function SolDshCard(props) {
  return props.view === "summary" ? props.t("description") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SolDshForm, { ...props });
}
function SolDshForm(props) {
  const [draft, setDraft] = (0, import_react.useState)(() => cloneConfig(DEFAULT_SOL_DSH_CONFIG));
  const [loaded, setLoaded] = (0, import_react.useState)(DEFAULT_SOL_DSH_CONFIG);
  const [base, setBase] = (0, import_react.useState)(DEFAULT_SOL_DSH_CONFIG);
  const [user, setUser] = (0, import_react.useState)();
  const [texts, setTexts] = (0, import_react.useState)({});
  const [clears, setClears] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
  const [revision, setRevision] = (0, import_react.useState)(0);
  const [writable, setWritable] = (0, import_react.useState)(false);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [failed, setFailed] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)();
  const [catalog, setCatalog] = (0, import_react.useState)([]);
  const [catalogStatus, setCatalogStatus] = (0, import_react.useState)("idle");
  const active = (0, import_react.useRef)(false);
  const ensureCatalog = () => {
    if (catalogStatus === "loading" || catalogStatus === "ready" || catalogStatus === "empty") return;
    if (!props.loadModelCatalog) {
      setCatalogStatus("empty");
      return;
    }
    setCatalogStatus("loading");
    void props.loadModelCatalog().then(
      (groups) => {
        if (!active.current) return;
        setCatalog(groups);
        setCatalogStatus(groups.length > 0 ? "ready" : "empty");
      },
      () => {
        if (!active.current) return;
        setCatalog([]);
        setCatalogStatus("empty");
      }
    );
  };
  const syncFromSnapshot = (snapshot) => {
    setLoaded(snapshot.value);
    setDraft(cloneConfig(snapshot.value));
    setBase(snapshot.base);
    setUser(snapshot.user);
    setRevision(snapshot.revision);
    setWritable(snapshot.writable);
    setTexts({});
    setClears(/* @__PURE__ */ new Set());
    setFailed(false);
    setError(void 0);
  };
  (0, import_react.useEffect)(() => {
    active.current = true;
    let cancelled = false;
    void props.load().then(
      (snapshot) => {
        if (!cancelled) syncFromSnapshot(snapshot);
      },
      () => {
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
      active.current = false;
    };
  }, []);
  const dirty = (0, import_react.useMemo)(() => !sameConfig(draft, loaded) || clears.size > 0, [draft, loaded, clears]);
  const t = props.t;
  const disabled = !writable || saving;
  const textOf = (path, fallback) => {
    const key = pathKey(path);
    return Object.prototype.hasOwnProperty.call(texts, key) ? texts[key] : String(fallback);
  };
  const overridden = (path) => {
    const key = pathKey(path);
    if (clears.has(key)) return false;
    if (Object.prototype.hasOwnProperty.call(texts, key)) return true;
    const draftValue = readPath(draft, path);
    const loadedValue = readPath(loaded, path);
    if (JSON.stringify(draftValue) !== JSON.stringify(loadedValue)) return true;
    return hasPath(user, path);
  };
  const editText = (path, text) => {
    const key = pathKey(path);
    setTexts((current) => ({ ...current, [key]: text }));
    setClears((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setFailed(false);
    setError(void 0);
  };
  const editValue = (path, value) => {
    const key = pathKey(path);
    setDraft((current) => writePath(current, path, value));
    setTexts((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, key)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setClears((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setFailed(false);
    setError(void 0);
  };
  const editReducerRoute = (provider, model) => {
    setDraft((current) => {
      let next = writePath(current, ["evidencePreservingReducer", "reducerProvider"], provider);
      next = writePath(next, ["evidencePreservingReducer", "reducerModel"], model);
      return next;
    });
    setTexts((current) => {
      const next = { ...current };
      delete next["evidencePreservingReducer.reducerProvider"];
      delete next["evidencePreservingReducer.reducerModel"];
      return next;
    });
    setClears((current) => {
      const next = new Set(current);
      next.delete("evidencePreservingReducer.reducerProvider");
      next.delete("evidencePreservingReducer.reducerModel");
      return next;
    });
    setFailed(false);
    setError(void 0);
  };
  const resetPath = (path) => {
    const key = pathKey(path);
    const composition = readPath(base, path);
    setDraft((current) => writePath(current, path, composition));
    setTexts((current) => {
      if (!Object.prototype.hasOwnProperty.call(current, key)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setClears((current) => new Set(current).add(key));
    setFailed(false);
    setError(void 0);
  };
  const parseNumericDrafts = () => {
    let next = draft;
    const numericPaths = [
      [["observationPack", "thresholdBytes"], draft.observationPack.thresholdBytes],
      [["observationPack", "fullSends"], draft.observationPack.fullSends],
      [["observationPack", "placeholderExcerptBytes"], draft.observationPack.placeholderExcerptBytes],
      [["evidencePreservingReducer", "minBytes"], draft.evidencePreservingReducer.minBytes],
      [["evidencePreservingReducer", "maxChars"], draft.evidencePreservingReducer.maxChars],
      [["evidencePreservingReducer", "maxOutputTokens"], draft.evidencePreservingReducer.maxOutputTokens],
      [["evidencePreservingReducer", "timeoutMs"], draft.evidencePreservingReducer.timeoutMs],
      [["onlineContextCompact", "cacheWriteReadRatio"], draft.onlineContextCompact.cacheWriteReadRatio],
      [["onlineContextCompact", "keepRecentTokens"], draft.onlineContextCompact.keepRecentTokens],
      [["onlineContextCompact", "nativeSummaryTokenEstimate"], draft.onlineContextCompact.nativeSummaryTokenEstimate],
      [["onlineContextCompact", "windowReserveTokens"], draft.onlineContextCompact.windowReserveTokens],
      [["onlineContextCompact", "firstCompactionRequestScale"], draft.onlineContextCompact.firstCompactionRequestScale],
      [["onlineContextCompact", "subsequentCompactionMargin"], draft.onlineContextCompact.subsequentCompactionMargin]
    ];
    for (const [path, fallback] of numericPaths) {
      const key = pathKey(path);
      if (!Object.prototype.hasOwnProperty.call(texts, key)) continue;
      const raw = texts[key];
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) return { ok: false };
      next = writePath(next, path, n);
    }
    return { ok: true, value: next };
  };
  const invalidNumeric = (path) => {
    const key = pathKey(path);
    if (!Object.prototype.hasOwnProperty.call(texts, key)) return false;
    const n = Number(texts[key]);
    return !Number.isFinite(n) || n < 0;
  };
  const anyInvalid = (0, import_react.useMemo)(() => {
    return Object.keys(texts).some((key) => {
      if (key.includes("reducerProvider") || key.includes("reducerModel")) return false;
      const n = Number(texts[key]);
      return !Number.isFinite(n) || n < 0;
    });
  }, [texts]);
  const saveDisabled = !dirty || saving || !writable || anyInvalid;
  const discardDisabled = !dirty || saving;
  const onDiscard = () => {
    setDraft(cloneConfig(loaded));
    setTexts({});
    setClears(/* @__PURE__ */ new Set());
    setFailed(false);
    setError(void 0);
  };
  const onSave = async () => {
    if (saveDisabled) return;
    const parsed = parseNumericDrafts();
    if (!parsed.ok) return;
    setSaving(true);
    setFailed(false);
    setError(void 0);
    try {
      const resolved = resolveSolDshConfig(parsed.value);
      await props.onSave(resolved, revision, base, user);
      if (!active.current) return;
      const snapshot = await props.load();
      if (active.current) syncFromSnapshot(snapshot);
    } catch (failure) {
      if (!active.current) return;
      setFailed(true);
      setError(failure instanceof Error ? failure.message : t("saveFailed"));
    } finally {
      if (active.current) setSaving(false);
    }
  };
  const common = {
    disabled,
    overriddenLabel: t("overridden"),
    resetLabel: t("reset"),
    invalidLabel: t("invalidNumber")
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { "data-plugin": "dsh-sol-pi", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.body, children: [
    !writable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.readOnly, role: "status", children: t("readonly") }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchRow,
      {
        ...common,
        label: t("actionFusion"),
        hint: t("actionFusionHelp"),
        checked: draft.actionFusion.enabled,
        overridden: overridden(["actionFusion", "enabled"]),
        onChange: (checked) => editValue(["actionFusion", "enabled"], checked),
        onReset: () => resetPath(["actionFusion", "enabled"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchRow,
      {
        ...common,
        label: t("observationPack"),
        hint: t("observationPackHelp"),
        checked: draft.observationPack.enabled,
        overridden: overridden(["observationPack", "enabled"]),
        onChange: (checked) => editValue(["observationPack", "enabled"], checked),
        onReset: () => resetPath(["observationPack", "enabled"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SelectRow,
      {
        ...common,
        id: "sol-obs-mode",
        label: t("mode"),
        hint: t("modeHelp"),
        detail: draft.observationPack.mode === "delayed" ? t("modeDelayedHint") : t("modeImmediateHint"),
        value: draft.observationPack.mode,
        options: [
          { id: "immediate", label: t("modeImmediate") },
          { id: "delayed", label: t("modeDelayed") }
        ],
        overridden: overridden(["observationPack", "mode"]),
        onChange: (value) => {
          editValue(["observationPack", "mode"], value === "delayed" ? "delayed" : "immediate");
          if (value === "delayed" && draft.observationPack.fullSends < 2) {
            editValue(["observationPack", "fullSends"], 2);
          }
          if (value === "immediate") editValue(["observationPack", "fullSends"], 0);
        },
        onReset: () => resetPath(["observationPack", "mode"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-obs-threshold",
        label: t("thresholdBytes"),
        hint: t("thresholdBytesHelp"),
        numeric: true,
        text: textOf(["observationPack", "thresholdBytes"], draft.observationPack.thresholdBytes),
        invalid: invalidNumeric(["observationPack", "thresholdBytes"]),
        overridden: overridden(["observationPack", "thresholdBytes"]),
        onEdit: (text) => editText(["observationPack", "thresholdBytes"], text),
        onReset: () => resetPath(["observationPack", "thresholdBytes"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-obs-fullsends",
        label: t("fullSends"),
        hint: t("fullSendsHelp"),
        numeric: true,
        text: textOf(["observationPack", "fullSends"], draft.observationPack.fullSends),
        invalid: invalidNumeric(["observationPack", "fullSends"]),
        overridden: overridden(["observationPack", "fullSends"]),
        onEdit: (text) => editText(["observationPack", "fullSends"], text),
        onReset: () => resetPath(["observationPack", "fullSends"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-obs-excerpt",
        label: t("placeholderExcerptBytes"),
        hint: t("placeholderExcerptBytesHelp"),
        numeric: true,
        text: textOf(["observationPack", "placeholderExcerptBytes"], draft.observationPack.placeholderExcerptBytes),
        invalid: invalidNumeric(["observationPack", "placeholderExcerptBytes"]),
        overridden: overridden(["observationPack", "placeholderExcerptBytes"]),
        onEdit: (text) => editText(["observationPack", "placeholderExcerptBytes"], text),
        onReset: () => resetPath(["observationPack", "placeholderExcerptBytes"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchRow,
      {
        ...common,
        label: t("epr"),
        hint: t("eprHelp"),
        checked: draft.evidencePreservingReducer.enabled,
        overridden: overridden(["evidencePreservingReducer", "enabled"]),
        onChange: (checked) => editValue(["evidencePreservingReducer", "enabled"], checked),
        onReset: () => resetPath(["evidencePreservingReducer", "enabled"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-epr-min",
        label: t("minBytes"),
        hint: t("minBytesHelp"),
        numeric: true,
        text: textOf(["evidencePreservingReducer", "minBytes"], draft.evidencePreservingReducer.minBytes),
        invalid: invalidNumeric(["evidencePreservingReducer", "minBytes"]),
        overridden: overridden(["evidencePreservingReducer", "minBytes"]),
        onEdit: (text) => editText(["evidencePreservingReducer", "minBytes"], text),
        onReset: () => resetPath(["evidencePreservingReducer", "minBytes"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-epr-maxchars",
        label: t("maxChars"),
        hint: t("maxCharsHelp"),
        numeric: true,
        text: textOf(["evidencePreservingReducer", "maxChars"], draft.evidencePreservingReducer.maxChars),
        invalid: invalidNumeric(["evidencePreservingReducer", "maxChars"]),
        overridden: overridden(["evidencePreservingReducer", "maxChars"]),
        onEdit: (text) => editText(["evidencePreservingReducer", "maxChars"], text),
        onReset: () => resetPath(["evidencePreservingReducer", "maxChars"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-epr-out",
        label: t("maxOutputTokens"),
        hint: t("maxOutputTokensHelp"),
        numeric: true,
        text: textOf(["evidencePreservingReducer", "maxOutputTokens"], draft.evidencePreservingReducer.maxOutputTokens),
        invalid: invalidNumeric(["evidencePreservingReducer", "maxOutputTokens"]),
        overridden: overridden(["evidencePreservingReducer", "maxOutputTokens"]),
        onEdit: (text) => editText(["evidencePreservingReducer", "maxOutputTokens"], text),
        onReset: () => resetPath(["evidencePreservingReducer", "maxOutputTokens"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-epr-timeout",
        label: t("timeoutMs"),
        hint: t("timeoutMsHelp"),
        numeric: true,
        text: textOf(["evidencePreservingReducer", "timeoutMs"], draft.evidencePreservingReducer.timeoutMs),
        invalid: invalidNumeric(["evidencePreservingReducer", "timeoutMs"]),
        overridden: overridden(["evidencePreservingReducer", "timeoutMs"]),
        onEdit: (text) => editText(["evidencePreservingReducer", "timeoutMs"], text),
        onReset: () => resetPath(["evidencePreservingReducer", "timeoutMs"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ReducerRouteFold,
      {
        t,
        disabled,
        provider: draft.evidencePreservingReducer.reducerProvider,
        model: draft.evidencePreservingReducer.reducerModel,
        catalog,
        catalogStatus,
        overridden: overridden(["evidencePreservingReducer", "reducerProvider"]) || overridden(["evidencePreservingReducer", "reducerModel"]),
        overriddenLabel: t("overridden"),
        resetLabel: t("reset"),
        onOpen: ensureCatalog,
        onRoute: editReducerRoute,
        onReset: () => {
          editReducerRoute("", "");
          setClears((current) => {
            const next = new Set(current);
            next.add("evidencePreservingReducer.reducerProvider");
            next.add("evidencePreservingReducer.reducerModel");
            return next;
          });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      SwitchRow,
      {
        ...common,
        label: t("occ"),
        hint: t("occHelp"),
        checked: draft.onlineContextCompact.enabled,
        overridden: overridden(["onlineContextCompact", "enabled"]),
        onChange: (checked) => editValue(["onlineContextCompact", "enabled"], checked),
        onReset: () => resetPath(["onlineContextCompact", "enabled"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-occ-ratio",
        label: t("cacheWriteReadRatio"),
        hint: t("cacheWriteReadRatioHelp"),
        numeric: true,
        text: textOf(["onlineContextCompact", "cacheWriteReadRatio"], draft.onlineContextCompact.cacheWriteReadRatio),
        invalid: invalidNumeric(["onlineContextCompact", "cacheWriteReadRatio"]),
        overridden: overridden(["onlineContextCompact", "cacheWriteReadRatio"]),
        onEdit: (text) => editText(["onlineContextCompact", "cacheWriteReadRatio"], text),
        onReset: () => resetPath(["onlineContextCompact", "cacheWriteReadRatio"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-occ-keep",
        label: t("keepRecentTokens"),
        hint: t("keepRecentTokensHelp"),
        numeric: true,
        text: textOf(["onlineContextCompact", "keepRecentTokens"], draft.onlineContextCompact.keepRecentTokens),
        invalid: invalidNumeric(["onlineContextCompact", "keepRecentTokens"]),
        overridden: overridden(["onlineContextCompact", "keepRecentTokens"]),
        onEdit: (text) => editText(["onlineContextCompact", "keepRecentTokens"], text),
        onReset: () => resetPath(["onlineContextCompact", "keepRecentTokens"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-occ-summary",
        label: t("nativeSummaryTokenEstimate"),
        hint: t("nativeSummaryTokenEstimateHelp"),
        numeric: true,
        text: textOf(
          ["onlineContextCompact", "nativeSummaryTokenEstimate"],
          draft.onlineContextCompact.nativeSummaryTokenEstimate
        ),
        invalid: invalidNumeric(["onlineContextCompact", "nativeSummaryTokenEstimate"]),
        overridden: overridden(["onlineContextCompact", "nativeSummaryTokenEstimate"]),
        onEdit: (text) => editText(["onlineContextCompact", "nativeSummaryTokenEstimate"], text),
        onReset: () => resetPath(["onlineContextCompact", "nativeSummaryTokenEstimate"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-occ-reserve",
        label: t("windowReserveTokens"),
        hint: t("windowReserveTokensHelp"),
        numeric: true,
        text: textOf(["onlineContextCompact", "windowReserveTokens"], draft.onlineContextCompact.windowReserveTokens),
        invalid: invalidNumeric(["onlineContextCompact", "windowReserveTokens"]),
        overridden: overridden(["onlineContextCompact", "windowReserveTokens"]),
        onEdit: (text) => editText(["onlineContextCompact", "windowReserveTokens"], text),
        onReset: () => resetPath(["onlineContextCompact", "windowReserveTokens"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-occ-first",
        label: t("firstCompactionRequestScale"),
        hint: t("firstCompactionRequestScaleHelp"),
        numeric: true,
        text: textOf(
          ["onlineContextCompact", "firstCompactionRequestScale"],
          draft.onlineContextCompact.firstCompactionRequestScale
        ),
        invalid: invalidNumeric(["onlineContextCompact", "firstCompactionRequestScale"]),
        overridden: overridden(["onlineContextCompact", "firstCompactionRequestScale"]),
        onEdit: (text) => editText(["onlineContextCompact", "firstCompactionRequestScale"], text),
        onReset: () => resetPath(["onlineContextCompact", "firstCompactionRequestScale"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      ValueRow,
      {
        ...common,
        id: "sol-occ-margin",
        label: t("subsequentCompactionMargin"),
        hint: t("subsequentCompactionMarginHelp"),
        numeric: true,
        text: textOf(
          ["onlineContextCompact", "subsequentCompactionMargin"],
          draft.onlineContextCompact.subsequentCompactionMargin
        ),
        invalid: invalidNumeric(["onlineContextCompact", "subsequentCompactionMargin"]),
        overridden: overridden(["onlineContextCompact", "subsequentCompactionMargin"]),
        onEdit: (text) => editText(["onlineContextCompact", "subsequentCompactionMargin"], text),
        onReset: () => resetPath(["onlineContextCompact", "subsequentCompactionMargin"])
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.footer, children: [
      failed || error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.failed, role: "status", children: error ?? t("saveFailed") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: card_default.discard, disabled: discardDisabled, onClick: onDiscard, children: t("discard") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: card_default.save, disabled: saveDisabled, onClick: () => void onSave(), children: t(saving ? "saving" : "save") })
    ] })
  ] }) });
}

// src/sol-dsh/client/locales.ts
var SOL_DSH_LOCALE_NS = "settings.solDsh";
var zh = {
  title: "SoL",
  description: "\u7701\u4E0A\u4E0B\u6587\u3001\u5C11\u91CD\u590D\u8DD1\u5DE5\u5177\uFF1A\u52A8\u4F5C\u878D\u5408\u3001ObservationPack\u3001\u8BC1\u636E\u4FDD\u7559\u5F52\u7EA6\u3001\u5728\u7EBF\u538B\u7F29\u3002",
  expand: "\u5C55\u5F00\u8BBE\u7F6E",
  overridden: "\u5DF2\u8986\u76D6",
  invalidNumber: "\u8BF7\u586B\u6570\u5B57\uFF1B\u7559\u7A7A\u8868\u793A\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002",
  collapse: "\u6536\u8D77\u8BBE\u7F6E",
  unsaved: "\u672A\u4FDD\u5B58",
  save: "\u4FDD\u5B58",
  discard: "\u653E\u5F03\u4FEE\u6539",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  saveFailed: "\u672C\u90E8\u7F72\u6CA1\u6709\u63A5\u53D7\u8FD9\u4E9B\u503C\uFF0C\u5DF2\u4FDD\u7559\u4F9B\u4F60\u4FEE\u6539\u3002",
  conflict: "\u914D\u7F6E\u5DF2\u5728\u522B\u5904\u66F4\u65B0\uFF0C\u4FDD\u5B58\u88AB\u62D2\u7EDD\u3002\u8BF7\u653E\u5F03\u4FEE\u6539\u540E\u91CD\u8BD5\u3002",
  readonly: "\u672C\u90E8\u7F72\u7684\u8BBE\u7F6E\u4E3A\u53EA\u8BFB\u3002",
  actionFusion: "\u52A8\u4F5C\u878D\u5408",
  actionFusionHelp: "\u6253\u5F00\u540E\uFF0C\u7F16\u8F91\u6216\u5199\u5165\u6587\u4EF6\u65F6\u5FC5\u987B\u7528 then_run \u5E26\u4E0A\u7ACB\u523B\u8981\u8DD1\u7684 format/test/build\uFF0C\u7ED3\u679C\u548C\u6587\u4EF6\u6539\u52A8\u5199\u5728\u540C\u4E00\u6B21\u89C2\u5BDF\u91CC\uFF0C\u4E0D\u8981\u518D\u5355\u72EC\u5F00\u4E00\u8F6E bash\u3002PTC / Code \u6A21\u5F0F\u4E0B\u6A21\u578B\u53EA\u770B\u89C1 run_code\uFF0Cthen_run \u51E0\u4E4E\u7528\u4E0D\u4E0A\u3002",
  observationPack: "ObservationPack",
  observationPackHelp: "\u7ACB\u5373\u6A21\u5F0F\u53EA\u628A\u6D4B\u8BD5/\u6784\u5EFA\u8FD9\u7C7B\u547D\u4EE4\u8F6C\u50A8\u843D\u76D8\u6210\u9884\u89C8\uFF1Bread\u3001grep\u3001git diff/show\u3001\u77E5\u8BC6\u9875\u4FDD\u6301\u5168\u6587\u3002\u9700\u8981\u8F6C\u50A8\u5168\u6587\u65F6\u7528 read / grep\uFF0C\u4E0D\u8981\u53D1\u660E obs_recall\u3002",
  mode: "\u6253\u5305\u65F6\u673A",
  modeHelp: "\u51B3\u5B9A\u5927\u7ED3\u679C\u4F55\u65F6\u4ECE\u300C\u5168\u6587\u300D\u6362\u6210\u300C\u9884\u89C8\u300D\u3002\u6539\u5B8C\u53EA\u5F71\u54CD\u4E4B\u540E\u7684\u65B0\u5DE5\u5177\u7ED3\u679C\u3002",
  modeImmediate: "\u7ACB\u5373\u6253\u5305\uFF08\u9ED8\u8BA4\uFF09",
  modeImmediateHint: "\u8D85\u8FC7\u9608\u503C\u7684\u6D4B\u8BD5/\u6784\u5EFA\u8F6C\u50A8\u7ACB\u523B\u6362\u6210\u9884\u89C8\uFF1Bread / grep / git diff / \u77E5\u8BC6\u5DE5\u5177\u4FDD\u6301\u5168\u6587\u3002\u524D\u7F00\u4E0D\u53D8\uFF0C\u66F4\u7701\u7F13\u5B58\u3002",
  modeDelayed: "\u5EF6\u8FDF\u6253\u5305",
  modeDelayedHint: "\u5148\u6309\u5168\u6587\u53D1\u9001\u82E5\u5E72\u6B21\uFF0C\u518D\u6362\u6210\u9884\u89C8\uFF1B\u53EF\u80FD\u6253\u7A7F\u524D\u7F00\u7F13\u5B58\uFF0C\u9002\u5408\u5076\u5C14\u8FD8\u8981\u770B\u5168\u6587\u7684\u573A\u666F\u3002",
  thresholdBytes: "\u4F53\u79EF\u9608\u503C\uFF08\u5B57\u8282\uFF09",
  thresholdBytesHelp: "\u5355\u6B21\u5DE5\u5177\u8F93\u51FA\u8D85\u8FC7\u8FD9\u4E2A\u5927\u5C0F\u624D\u6253\u5305\u3002\u592A\u5C0F\u4F1A\u9891\u7E41\u9884\u89C8\uFF0C\u592A\u5927\u4F1A\u7EE7\u7EED\u628A\u5927\u6BB5\u539F\u6587\u585E\u8FDB\u5BF9\u8BDD\u3002",
  fullSends: "\u5168\u6587\u53D1\u9001\u6B21\u6570",
  fullSendsHelp: "\u4EC5\u300C\u5EF6\u8FDF\u6253\u5305\u300D\u6709\u7528\uFF1A\u5148\u5B8C\u6574\u53D1\u9001\u8FD9\u4E48\u591A\u6B21\uFF0C\u4E4B\u540E\u518D\u6539\u9884\u89C8\u3002\u9009\u300C\u7ACB\u5373\u300D\u65F6\u4F1A\u6309 0 \u5904\u7406\u3002",
  placeholderExcerptBytes: "\u9884\u89C8\u6458\u5F55\uFF08\u5B57\u8282\uFF09",
  placeholderExcerptBytesHelp: "\u9884\u89C8\u91CC\u4FDD\u7559\u5F00\u5934\u591A\u5C11\u5B57\u8282\uFF0C\u65B9\u4FBF\u4F60\u8BA4\u51FA\u8FD9\u662F\u54EA\u6B21\u8F93\u51FA\u3002",
  epr: "\u8BC1\u636E\u4FDD\u7559\u5F52\u7EA6",
  eprHelp: "\u628A\u53C8\u957F\u53C8\u5435\u7684\u8BCA\u65AD\u65E5\u5FD7\u6536\u6210\u4E00\u5F20\u53EF\u6838\u5BF9\u7684\u300C\u8BC1\u636E\u56DE\u6267\u300D\u3002\u65E5\u5FD7\u4E0D\u80FD\u79BB\u5F00\u672C\u673A\u65F6\u8BF7\u5173\u6389\u3002",
  minBytes: "\u6700\u5C0F\u4F53\u79EF\uFF08\u5B57\u8282\uFF09",
  minBytesHelp: "\u5C0F\u4E8E\u8FD9\u4E2A\u4F53\u79EF\u7684\u65E5\u5FD7\u4E0D\u5F52\u7EA6\uFF0C\u539F\u6837\u4FDD\u7559\uFF0C\u907F\u514D\u5C0F\u8F93\u51FA\u4E5F\u88AB\u6A21\u578B\u518D\u52A0\u5DE5\u4E00\u904D\u3002",
  maxChars: "\u9001\u5165\u5F52\u7EA6\u7684\u6700\u5927\u5B57\u7B26",
  maxCharsHelp: "\u4EA4\u7ED9\u5F52\u7EA6\u6A21\u578B\u7684\u539F\u6587\u4E0A\u9650\uFF0C\u8D85\u51FA\u90E8\u5206\u4F1A\u622A\u65AD\uFF0C\u9632\u6B62\u4E00\u6B21\u585E\u7206\u4E0A\u4E0B\u6587\u3002",
  maxOutputTokens: "\u5F52\u7EA6\u8F93\u51FA\u4E0A\u9650",
  maxOutputTokensHelp: "\u56DE\u6267\u672C\u8EAB\u6700\u591A\u5141\u8BB8\u591A\u5C11 token\uFF0C\u907F\u514D\u300C\u538B\u7F29\u7ED3\u679C\u300D\u6BD4\u539F\u6587\u8FD8\u957F\u3002",
  timeoutMs: "\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09",
  timeoutMsHelp: "\u5F52\u7EA6\u8BF7\u6C42\u6700\u957F\u7B49\u591A\u4E45\uFF1B\u8D85\u65F6\u5219\u4FDD\u7559\u539F\u6587\uFF0C\u4E0D\u963B\u585E\u4E3B\u5BF9\u8BDD\u3002",
  reducerProvider: "\u63D0\u4F9B\u5546",
  reducerModel: "\u6A21\u578B",
  reducerRouteHelp: "\u9ED8\u8BA4\u8DDF\u968F\u5F53\u524D Agent\u3002\u5C55\u5F00\u540E\u53EF\u6307\u5B9A\u4E13\u7528\u63D0\u4F9B\u5546\u548C\u6A21\u578B\uFF1B\u4E24\u9879\u9700\u540C\u7A7A\u6216\u540C\u586B\u3002",
  reducerRoute: "\u5F52\u7EA6\u6A21\u578B",
  reducerRouteSummaryFollow: "\u8DDF\u968F\u5F53\u524D Agent",
  reducerRouteSummaryPinned: "\u5DF2\u6307\u5B9A {provider} / {model}",
  reducerRouteExpand: "\u5C55\u5F00\u5F52\u7EA6\u6A21\u578B",
  reducerRouteCollapse: "\u6536\u8D77\u5F52\u7EA6\u6A21\u578B",
  reducerFollowAgent: "\u8DDF\u968F\u5F53\u524D Agent",
  reducerSelectProvider: "\u9009\u62E9\u63D0\u4F9B\u5546",
  reducerSelectModel: "\u9009\u62E9\u6A21\u578B",
  reducerCatalogLoading: "\u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u76EE\u5F55\u2026",
  reducerCatalogEmpty: "\u6682\u65E0\u53EF\u7528\u6A21\u578B\uFF1B\u4ECD\u53EF\u8DDF\u968F\u5F53\u524D Agent\u3002",
  occ: "\u5728\u7EBF\u4E0A\u4E0B\u6587\u538B\u7F29",
  occHelp: "\u6302\u5728\u5B98\u65B9 ctx.compaction \u4E0A\u7684\u7B56\u7565\uFF0C\u4E0D\u662F\u7B2C\u4E8C\u5957\u538B\u7F29\u5F15\u64CE\u3002\u7528\u6765\u51B3\u5B9A\u4F55\u65F6\u538B\u3001\u538B\u591A\u5C11\u3001\u7559\u591A\u5C11\u8FD1\u671F\u5185\u5BB9\u3002",
  cacheWriteReadRatio: "\u7F13\u5B58\u5199/\u8BFB\u6BD4",
  cacheWriteReadRatioHelp: "\u8861\u91CF\u300C\u65B0\u5199\u5165\u7F13\u5B58\u300D\u76F8\u5BF9\u300C\u547D\u4E2D\u5DF2\u6709\u7F13\u5B58\u300D\u7684\u6BD4\u4F8B\u3002DeepSeek Flash \u5CF0\u503C\u5927\u7EA6 50\uFF0CV4 Pro \u5927\u7EA6 30\uFF1B\u504F\u9AD8\u8BF4\u660E\u7F13\u5B58\u4E0D\u5212\u7B97\uFF0C\u66F4\u8BE5\u538B\u7F29\u3002",
  keepRecentTokens: "\u4FDD\u7559\u8FD1\u671F token",
  keepRecentTokensHelp: "\u538B\u7F29\u65F6\u6700\u8FD1\u8FD9\u4E00\u6BB5\u5BF9\u8BDD\u81F3\u5C11\u7559\u591A\u5C11 token\u3002\u586B 0 \u5219\u8DDF\u968F DSH \u9ED8\u8BA4 retainRatio\uFF08\u5927\u7EA6\u7A97\u53E3\u7684 16%\uFF09\u3002",
  nativeSummaryTokenEstimate: "\u6458\u8981 token \u4F30\u8BA1",
  nativeSummaryTokenEstimateHelp: "\u538B\u7F29\u540E\u5199\u5165\u7684\u6458\u8981\u5927\u6982\u5360\u591A\u5C11 token\uFF0C\u7528\u6765\u7ED9\u7A97\u53E3\u9884\u7B97\u7559\u7A7A\uFF0C\u907F\u514D\u521A\u538B\u5B8C\u53C8\u7ACB\u523B\u8D85\u7A97\u3002",
  windowReserveTokens: "\u7A97\u53E3\u4FDD\u62A4\u9884\u7559",
  windowReserveTokensHelp: "\u7ED9\u7CFB\u7EDF\u63D0\u793A\u3001\u5DE5\u5177\u5B9A\u4E49\u7B49\u56FA\u5B9A\u5F00\u9500\u7559\u7684\u4F59\u91CF\uFF0C\u538B\u7F29\u8BA1\u7B97\u65F6\u4F1A\u5148\u6263\u6389\u8FD9\u90E8\u5206\u3002",
  firstCompactionRequestScale: "\u9996\u6B21\u538B\u7F29\u89C6\u91CE\u500D\u7387",
  firstCompactionRequestScaleHelp: "\u7B2C\u4E00\u6B21\u89E6\u53D1\u538B\u7F29\u65F6\uFF0C\u6309\u7A97\u53E3\u7684\u591A\u5C11\u500D\u53BB\u770B\u5386\u53F2\u3002\u5927\u4E8E 1 \u4F1A\u770B\u5F97\u66F4\u8FDC\uFF0C\u6458\u8981\u66F4\u5168\uFF0C\u4F46\u4E5F\u66F4\u8D39\u3002",
  subsequentCompactionMargin: "\u540E\u7EED\u538B\u7F29\u4F59\u91CF",
  subsequentCompactionMarginHelp: "\u5DF2\u7ECF\u538B\u8FC7\u4E4B\u540E\uFF0C\u518D\u538B\u65F6\u989D\u5916\u7559\u4E00\u70B9\u5B89\u5168\u8FB9\u8DDD\uFF0C\u51CF\u5C11\u6765\u56DE\u6296\u52A8\u3002"
};
var en = {
  title: "SoL",
  description: "Save context and avoid redo: action fusion, ObservationPack, evidence-preserving reduction, online compaction.",
  expand: "Show settings",
  overridden: "Overridden",
  invalidNumber: "Enter a number, or leave blank to use the default.",
  collapse: "Hide settings",
  unsaved: "Unsaved",
  save: "Save",
  discard: "Discard",
  reset: "Reset to default",
  saving: "Saving\u2026",
  saveFailed: "The deployment did not accept these values; they were left for you to correct.",
  conflict: "Configuration changed elsewhere; save was rejected. Discard and retry.",
  readonly: "This deployment stores settings read-only.",
  actionFusion: "Action fusion",
  actionFusionHelp: "When on, edit/write MUST pass then_run for the immediate format/test/build so it shares one observation \u2014 do not follow with a separate bash turn. Under PTC / Code mode the model only sees run_code, so then_run is almost unused.",
  observationPack: "ObservationPack",
  observationPackHelp: "Immediate mode previews only test/build dumps. read, grep, git diff/show, and knowledge pages stay in full. Fetch a dump with read/grep \u2014 do not invent obs_recall.",
  mode: "Packing timing",
  modeHelp: "When oversized results switch from full text to a preview. Applies to new tool results after you save.",
  modeImmediate: "Pack immediately (default)",
  modeImmediateHint: "Test/build dumps above the threshold become a preview immediately; read / grep / git diff / knowledge tools stay in full. Prefix-stable and cache-friendly.",
  modeDelayed: "Pack after full sends",
  modeDelayedHint: "Send the full text a few times first, then switch to a preview. May miss the prefix cache; useful when you still need the full body briefly.",
  thresholdBytes: "Size threshold (bytes)",
  thresholdBytesHelp: "Pack only when a single tool result is larger than this. Too low packs often; too high keeps dumping huge text into the chat.",
  fullSends: "Full-text sends",
  fullSendsHelp: "Only for delayed packing: send the full body this many times before previewing. Immediate mode treats this as 0.",
  placeholderExcerptBytes: "Preview excerpt (bytes)",
  placeholderExcerptBytesHelp: "How many leading bytes to keep in the preview so you can recognize which result it was.",
  epr: "Evidence-preserving reducer",
  eprHelp: "Turns long noisy diagnostic logs into a short verifiable receipt. Turn off if logs must not leave this machine.",
  minBytes: "Minimum size (bytes)",
  minBytesHelp: "Skip reduction below this size so small logs are not reprocessed for no gain.",
  maxChars: "Max characters into reducer",
  maxCharsHelp: "Upper bound on raw text sent to the reducer model; the rest is truncated.",
  maxOutputTokens: "Reducer output cap",
  maxOutputTokensHelp: "Max tokens allowed in the receipt itself, so the \u201Csummary\u201D cannot outgrow the log.",
  timeoutMs: "Timeout (ms)",
  timeoutMsHelp: "How long to wait for reduction. On timeout the original log is kept and the main turn is not blocked.",
  reducerProvider: "Provider",
  reducerModel: "Model",
  reducerRouteHelp: "Follows the current agent by default. Expand to pin a provider and model; both must be empty or both set.",
  reducerRoute: "Reducer model",
  reducerRouteSummaryFollow: "Follow current agent",
  reducerRouteSummaryPinned: "Pinned {provider} / {model}",
  reducerRouteExpand: "Show reducer model",
  reducerRouteCollapse: "Hide reducer model",
  reducerFollowAgent: "Follow current agent",
  reducerSelectProvider: "Select provider",
  reducerSelectModel: "Select model",
  reducerCatalogLoading: "Loading model catalog\u2026",
  reducerCatalogEmpty: "No models available; you can still follow the current agent.",
  occ: "Online context compact",
  occHelp: "A policy on the host ctx.compaction \u2014 not a second engine. Controls when to compact, how far to look, and how much recent context to keep.",
  cacheWriteReadRatio: "Cache write/read ratio",
  cacheWriteReadRatioHelp: "New cache writes versus cache hits. DeepSeek Flash peaks near 50, V4 Pro near 30; higher means caching is less worthwhile and compaction helps more.",
  keepRecentTokens: "Keep-recent tokens",
  keepRecentTokensHelp: "Minimum recent dialogue to keep when compacting. 0 follows the DSH retainRatio (about 16% of the window).",
  nativeSummaryTokenEstimate: "Summary token estimate",
  nativeSummaryTokenEstimateHelp: "Budget reserved for the post-compaction summary so the window does not refill immediately.",
  windowReserveTokens: "Window-protection reserve",
  windowReserveTokensHelp: "Tokens reserved for fixed overhead (system prompt, tool defs, etc.) before compaction math runs.",
  firstCompactionRequestScale: "First-compaction horizon scale",
  firstCompactionRequestScaleHelp: "How many window-lengths of history the first compaction looks at. Above 1 sees farther (richer summary, more cost).",
  subsequentCompactionMargin: "Subsequent compaction margin",
  subsequentCompactionMarginHelp: "Extra slack on later compactions to reduce thrashing after the first pass."
};
var zhKeys = Object.keys(zh).sort();
var enKeys = Object.keys(en).sort();
if (zhKeys.join("\0") !== enKeys.join("\0")) {
  throw new Error("sol-dsh locale dictionaries must share one key set");
}
var solDshLocales = { zh, en };

// src/sol-dsh/client/index.ts
var inject = ["slots", "locale", "configForms"];
function translator(ctx) {
  const bound = ctx.locale.bind?.(SOL_DSH_LOCALE_NS);
  if (bound) return (key) => bound(key);
  return (key) => ctx.locale.t?.(SOL_DSH_LOCALE_NS, key) ?? solDshLocales.en[key];
}
function decodeSection(section) {
  try {
    return resolveSolDshConfig(section);
  } catch {
    return void 0;
  }
}
function asUserLayer(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function whenSettled(scope, timeoutMs = 8e3) {
  const first = scope.getSnapshot();
  if (first.status !== "loading") return Promise.resolve(first);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      off();
      resolve(scope.getSnapshot());
    }, timeoutMs);
    const off = scope.subscribe(() => {
      const next = scope.getSnapshot();
      if (next.status === "loading") return;
      clearTimeout(timer);
      off();
      resolve(next);
    });
  });
}
function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function apply(ctx) {
  ctx.effect?.(() => ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales), "dsh-sol-pi: locale dictionaries");
  if (!ctx.effect) ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales);
  const t = translator(ctx);
  const scope = ctx.configForms.get(SOL_DSH_SETTINGS_NAMESPACE);
  ctx.slots.inject(
    "plugins.bundle.config",
    () => ctx.slots.register(
      {
        name: "plugins.bundle.config",
        key: SOL_DSH_SETTINGS_NAMESPACE,
        locale: SOL_DSH_LOCALE_NS,
        inject: () => ({
          t,
          // Model catalog is optional chrome; never gate slot registration on it.
          loadModelCatalog: async () => [],
          load: async () => {
            const snap = await whenSettled(scope);
            const base = decodeSection(snap.base) ?? DEFAULT_SOL_DSH_CONFIG;
            return {
              value: snap.value ?? base,
              base,
              user: asUserLayer(snap.user),
              revision: snap.revision ?? 0,
              writable: snap.writable && snap.status !== "unavailable"
            };
          },
          onSave: async (patch, expectedRevision, base, user) => {
            const snap = scope.getSnapshot();
            if (!snap.writable || snap.status === "unavailable") throw new Error(t("readonly"));
            const ops = [];
            for (const key of Object.keys(patch)) {
              const next = patch[key];
              const composition = base[key];
              if (deepEqual(next, composition)) {
                if (user && Object.prototype.hasOwnProperty.call(user, key)) {
                  ops.push({ op: "unset", path: [key] });
                }
              } else {
                ops.push({ op: "set", path: [key], value: next });
              }
            }
            if (ops.length > 0) {
              const ok = await scope.mutate(ops, expectedRevision);
              if (!ok) {
                throw new Error(t("saveFailed"));
              }
              const settled = await whenSettled(scope);
              const value = decodeSection(settled.value);
              const settledUser = asUserLayer(settled.user);
              if (settled.status !== "ready" || !value || !deepEqual(value, patch) || ops.some((op) => op.op === "unset" ? settledUser && Object.prototype.hasOwnProperty.call(settledUser, op.path[0]) : !deepEqual(settledUser?.[op.path[0]], op.value))) {
                throw new Error(t("saveFailed"));
              }
            }
          }
        })
      },
      SolDshCard
    )
  );
}

return module.exports;
} });
