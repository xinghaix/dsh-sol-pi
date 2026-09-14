window.__ModuleLoader__.load({ id: "dsh-sol-pi", factory: function (require) {
const module = { exports: {} };
const exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/sol-dsh/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react2 = require("react");

// node_modules/@deepseek-ai/cosmokit/lib/index.js
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
  return result;
}
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
(function(Binary2) {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    else return source;
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  if (a === b) return true;
  if (!strict && isNullable(a) && isNullable(b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (!a || !b) return false;
  function check(test, then) {
    return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
  }
  return check(Array.isArray, (a2, b2) => a2.length === b2.length && a2.every((item, index) => deepEqual(item, b2[index]))) ?? check(is("Date"), (a2, b2) => a2.valueOf() === b2.valueOf()) ?? check(is("RegExp"), (a2, b2) => a2.source === b2.source && a2.flags === b2.flags) ?? check(isArrayBufferLike, (a2, b2) => {
    if (a2.byteLength !== b2.byteLength) return false;
    const viewA = new Uint8Array(a2);
    const viewB = new Uint8Array(b2);
    for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
    return true;
  }) ?? Object.keys({
    ...a,
    ...b
  }).every((key) => deepEqual(a[key], b[key], strict));
}
var Time;
(function(Time2) {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date2 = /* @__PURE__ */ new Date(), offset) {
    if (typeof date2 === "number") date2 = new Date(date2);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date2.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date2 = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date2 + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date2) {
    const parsed = parseTime(date2);
    if (parsed) date2 = Date.now() + parsed;
    else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date2}`;
    else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date2}`;
    return date2 ? new Date(date2) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) return Math.round(ms / Time2.day) + "d";
    else if (abs >= Time2.hour - Time2.minute / 2) return Math.round(ms / Time2.hour) + "h";
    else if (abs >= Time2.minute - Time2.second / 2) return Math.round(ms / Time2.minute) + "m";
    else if (abs >= Time2.second) return Math.round(ms / Time2.second) + "s";
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// node_modules/@deepseek-ai/schemastery/lib/index.mjs
var kSchema = /* @__PURE__ */ Symbol.for("schemastery");
var kValidationError = /* @__PURE__ */ Symbol.for("ValidationError");
globalThis.__schemastery_index__ ?? (globalThis.__schemastery_index__ = 0);
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
    else if (typeof segment === "number") prefix += "[" + segment + "]";
    else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    __publicField(this, "options");
    __publicField(this, "name", "ValidationError");
    this.options = options;
  }
  static is(error) {
    return !!error?.[kValidationError];
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
var Schema = function(options) {
  const schema = function(data, options2 = {}) {
    return Schema.resolve(data, schema, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema, options);
  if (typeof schema.callback === "string") try {
    schema.callback = new Function("return " + schema.callback)();
  } catch {
  }
  Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema, Schema.prototype);
  schema.meta || (schema.meta = {});
  schema.toString = schema.toString.bind(schema);
  return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
  return {
    version: 1,
    vendor: "schemastery",
    validate: (value) => {
      try {
        return { value: Schema.resolve(value, this, {})[0] };
      } catch (error) {
        if (ValidationError.is(error)) return { issues: [{
          message: error.message,
          path: error.options.path
        }] };
        throw error;
      }
    }
  };
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
  var _a, _b;
  if (globalThis.__schemastery_refs__) {
    (_a = globalThis.__schemastery_refs__)[_b = this.uid] ?? (_a[_b] = JSON.parse(JSON.stringify({ ...this })));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = {
    uid: this.uid,
    refs: globalThis.__schemastery_refs__
  };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema.prototype.set = function set(key, value) {
  this.dict[key] = value;
  return this;
};
Schema.prototype.push = function push(value) {
  this.list.push(value);
  return this;
};
function mergeDesc(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
    else if (typeof value === "string") result[locale] = value;
  }
  return result;
}
function getInner(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
  const schema = Schema(this);
  const desc = mergeDesc(schema.meta.description, messages);
  if (Object.keys(desc).length) schema.meta.description = desc;
  if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
    return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
  });
  if (schema.list) schema.list = schema.list.map((inner, index) => {
    return inner.i18n(mapValues(messages, (data = {}) => {
      if (Array.isArray(getInner(data))) return getInner(data)[index];
      if (Array.isArray(data)) return data[index];
      return extractKeys(data);
    }));
  });
  if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
    if (getInner(data)) return getInner(data);
    return extractKeys(data);
  }));
  if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
  return schema;
};
Schema.prototype.extra = function extra(key, value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
};
for (const key of [
  "required",
  "disabled",
  "collapse",
  "hidden",
  "loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.deprecated = function deprecated() {
  var _a;
  const schema = Schema(this);
  (_a = schema.meta).badges || (_a.badges = []);
  schema.meta.badges.push({
    text: "deprecated",
    type: "danger"
  });
  return schema;
};
Schema.prototype.experimental = function experimental() {
  var _a;
  const schema = Schema(this);
  (_a = schema.meta).badges || (_a.badges = []);
  schema.meta.badges.push({
    text: "experimental",
    type: "warning"
  });
  return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
  const schema = Schema(this);
  const pattern2 = pick(regexp, ["source", "flags"]);
  schema.meta = {
    ...schema.meta,
    pattern: pattern2
  };
  return schema;
};
Schema.prototype.simplify = function simplify(value) {
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema = this.type === "array" ? this.inner : this.list[index];
      const item = schema ? schema.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) Object.assign(result, item.simplify(value));
    return result;
  } else if (this.type === "union") for (const schema of this.list) try {
    Schema.resolve(value, schema, {});
    return schema.simplify(value);
  } catch {
  }
  return value;
};
Schema.prototype.toString = function toString(inline) {
  return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra2) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    role,
    extra: extra2
  };
  return schema;
};
for (const key of [
  "default",
  "link",
  "comment",
  "description",
  "max",
  "min",
  "step"
]) Object.assign(Schema.prototype, { [key](value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
var resolvers = {};
Schema.extend = function extend(type, resolve2) {
  resolvers[type] = resolve2;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
  if (!schema) return [data];
  if (options.ignore?.(data, schema)) return [data];
  if (isNullable(data) && schema.type !== "lazy") {
    if (schema.meta.required) throw new ValidationError(`missing required value`, options);
    let current = schema;
    let fallback = schema.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers[schema.type];
  if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
  try {
    return callback(data, schema, options, strict);
  } catch (error) {
    if (!schema.meta.loose) throw error;
    return [schema.meta.default];
  }
};
Schema.from = function from(source) {
  if (isNullable(source)) return Schema.any();
  else if ([
    "string",
    "number",
    "boolean"
  ].includes(typeof source)) return Schema.const(source).required();
  else if (source[kSchema]) return source;
  else if (typeof source === "function") switch (source) {
    case String:
      return Schema.string().required();
    case Number:
      return Schema.number().required();
    case Boolean:
      return Schema.boolean().required();
    case Function:
      return Schema.function().required();
    default:
      return Schema.is(source).required();
  }
  else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
  const toJSON2 = () => {
    if (!schema.inner[kSchema]) {
      schema.inner = schema.builder();
      schema.inner.meta = {
        ...schema.meta,
        ...schema.inner.meta
      };
    }
    return schema.inner.toJSON();
  };
  const schema = new Schema({
    type: "lazy",
    builder,
    inner: { toJSON: toJSON2 }
  });
  return schema;
};
Schema.natural = function natural() {
  return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
  return Schema.number().step(0.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
  return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
    const date2 = new Date(value);
    if (isNaN(+date2)) throw new ValidationError(`invalid date "${value}"`, options);
    return date2;
  }, true)]);
};
Schema.regExp = function regExp(flag = "") {
  return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
    try {
      return new RegExp(value, flag);
    } catch (e) {
      throw new ValidationError(e.message, options);
    }
  }, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
  return Schema.union([
    Schema.is(ArrayBuffer),
    Schema.is(SharedArrayBuffer),
    Schema.transform(Schema.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
  if (!schema.inner[kSchema]) {
    schema.inner = schema.builder();
    schema.inner.meta = {
      ...schema.meta,
      ...schema.inner.meta
    };
  }
  return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
  return [data];
});
Schema.extend("never", (data, _, options) => {
  throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange(data.length, meta, "string length", options);
  return [data];
});
function decimalShift(data, digits) {
  const str = data.toString();
  if (str.includes("e")) return data * Math.pow(10, digits);
  const index = str.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str.slice(index + 1);
  const integer = str.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
  checkWithinRange(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
  return [data];
});
Schema.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) if (data & bits[key]) keys.push(key);
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else throw new ValidationError(`expected number or array but got ${data}`, options);
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError(`expected ${constructor} but got ${data}`, options);
  }
});
function property(data, key, schema, options) {
  try {
    const [value, adapted] = Schema.resolve(data[key], schema, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema.meta.default;
  }
}
Schema.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property(data, key, dict[key], options);
    if (!isNullable(value) || key in data) result[key] = value;
  }
  if (!strict) merge(result, data);
  return [result];
});
Schema.extend("union", (data, { list, toString: toString2 }, options, strict) => {
  const messages = [];
  for (const inner of list) try {
    return Schema.resolve(data, inner, options, strict);
  } catch (error) {
    messages.push(error);
  }
  throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString: toString2 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) result = value;
    else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
    else if (typeof value === "object") merge(result ?? (result = {}), value);
    else if (result !== value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
  }
  if (!strict && isPlainObject(data)) merge(result, data);
  return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema.resolve(data, inner, options, true);
  if (preserve) return [callback(result)];
  else return [callback(result), callback(adapted)];
});
var formatters = {};
function defineMethod(name, keys, format) {
  formatters[name] = format;
  Object.assign(Schema, { [name](...args) {
    const schema = new Schema({ type: name });
    keys.forEach((key, index) => {
      switch (key) {
        case "sKey":
          schema.sKey = args[index] ?? Schema.string();
          break;
        case "inner":
          schema.inner = Schema.from(args[index]);
          break;
        case "list":
          schema.list = args[index].map(Schema.from);
          break;
        case "dict":
          schema.dict = mapValues(args[index], Schema.from);
          break;
        case "bits":
          schema.bits = {};
          for (const key2 in args[index]) {
            if (typeof args[index][key2] !== "number") continue;
            schema.bits[key2] = args[index][key2];
          }
          break;
        case "callback": {
          const callback = schema.callback = args[index];
          callback["toJSON"] || (callback["toJSON"] = () => callback.toString());
          break;
        }
        case "constructor": {
          const constructor = schema.constructor = args[index];
          if (typeof constructor === "function") constructor["toJSON"] || (constructor["toJSON"] = () => constructor["name"]);
          break;
        }
        default:
          schema[key] = args[index];
      }
    });
    if (name === "object" || name === "dict") schema.meta.default = {};
    else if (name === "array" || name === "tuple") schema.meta.default = [];
    else if (name === "bitset") schema.meta.default = 0;
    return schema;
  } });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") return constructor.name;
  else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
  "inner",
  "callback",
  "preserve"
], ({ inner }, isInner) => inner.toString(isInner));

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
var positiveInt = (fallback) => Schema.number().step(1).min(1).default(fallback);
var nonNegativeInt = (fallback) => Schema.number().step(1).min(0).default(fallback);
var Config = Schema.object({
  actionFusion: Schema.object({
    enabled: Schema.boolean().default(true)
  }).default({ enabled: true }),
  observationPack: Schema.object({
    enabled: Schema.boolean().default(true),
    mode: Schema.union(["immediate", "delayed"]).default("immediate"),
    thresholdBytes: positiveInt(10240),
    fullSends: nonNegativeInt(0),
    placeholderExcerptBytes: positiveInt(1024)
  }).default({
    enabled: true,
    mode: "immediate",
    thresholdBytes: 10240,
    fullSends: 0,
    placeholderExcerptBytes: 1024
  }),
  evidencePreservingReducer: Schema.object({
    enabled: Schema.boolean().default(true),
    minBytes: positiveInt(4096),
    maxChars: positiveInt(6e5),
    maxOutputTokens: positiveInt(2048),
    timeoutMs: positiveInt(9e4),
    reducerProvider: Schema.string().default(""),
    reducerModel: Schema.string().default("")
  }).default({
    enabled: true,
    minBytes: 4096,
    maxChars: 6e5,
    maxOutputTokens: 2048,
    timeoutMs: 9e4,
    reducerProvider: "",
    reducerModel: ""
  }),
  onlineContextCompact: Schema.object({
    enabled: Schema.boolean().default(true),
    cacheWriteReadRatio: Schema.number().min(0).default(50),
    keepRecentTokens: nonNegativeInt(0),
    nativeSummaryTokenEstimate: positiveInt(1e3),
    windowReserveTokens: positiveInt(16384),
    firstCompactionRequestScale: Schema.number().min(0).default(2),
    subsequentCompactionMargin: Schema.number().min(1).default(1.5)
  }).default({
    enabled: true,
    cacheWriteReadRatio: 50,
    keepRecentTokens: 0,
    nativeSummaryTokenEstimate: 1e3,
    windowReserveTokens: 16384,
    firstCompactionRequestScale: 2,
    subsequentCompactionMargin: 1.5
  })
});
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
  const config = Config(raw);
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
var import_react = require("react");

// sol-dsh-css:/Users/xing/Projects/github/SoL-Pi/src/sol-dsh/client/card.module.css
if (typeof document !== "undefined" && !document.getElementById("sol-dsh-css")) {
  const s = document.createElement("style");
  s.id = "sol-dsh-css";
  s.textContent = '.solDsh_card {\n	border: 1px solid var(--dsw-alias-border, #d0d5dd);\n	border-radius: 12px;\n	background: var(--dsw-alias-surface, #fff);\n	color: var(--dsw-alias-text, #101828);\n	overflow: hidden;\n}\n\n.solDsh_header {\n	display: flex;\n	align-items: center;\n	gap: 12px;\n	width: 100%;\n	padding: 16px 18px;\n	border: 0;\n	background: transparent;\n	color: inherit;\n	text-align: left;\n	cursor: pointer;\n}\n\n.solDsh_titles {\n	display: flex;\n	flex-direction: column;\n	gap: 4px;\n	flex: 1;\n}\n\n.solDsh_titles strong {\n	font-size: 15px;\n}\n\n.solDsh_titles span {\n	font-size: 13px;\n	color: var(--dsw-alias-text-secondary, #667085);\n}\n\n.solDsh_pill {\n	font-size: 12px;\n	padding: 2px 8px;\n	border-radius: 999px;\n	background: var(--dsw-alias-warning-bg, #fff6e5);\n	color: var(--dsw-alias-warning, #b54708);\n}\n\n.solDsh_chevron,\n.solDsh_chevronOpen {\n	transition: transform 120ms ease;\n}\n\n.solDsh_chevronOpen {\n	transform: rotate(180deg);\n}\n\n.solDsh_body {\n	display: flex;\n	flex-direction: column;\n	gap: 16px;\n	padding: 0 18px 18px;\n	border-top: 1px solid var(--dsw-alias-border, #eaecf0);\n}\n\n.solDsh_fieldset {\n	border: 0;\n	margin: 0;\n	padding: 0;\n	display: flex;\n	flex-direction: column;\n	gap: 8px;\n}\n\n.solDsh_fieldset legend {\n	font-weight: 600;\n	margin-bottom: 4px;\n}\n\n.solDsh_help,\n.solDsh_notice {\n	margin: 0;\n	font-size: 12px;\n	color: var(--dsw-alias-text-secondary, #667085);\n}\n\n.solDsh_row {\n	display: flex;\n	align-items: center;\n	justify-content: space-between;\n	gap: 12px;\n	font-size: 13px;\n}\n\n.solDsh_row input[type="number"],\n.solDsh_row input[type="text"],\n.solDsh_row input:not([type]),\n.solDsh_row select {\n	min-width: 160px;\n	padding: 6px 8px;\n	border: 1px solid var(--dsw-alias-border, #d0d5dd);\n	border-radius: 8px;\n	background: var(--dsw-alias-input, #fff);\n	color: inherit;\n}\n\n.solDsh_error {\n	margin: 0;\n	color: var(--dsw-alias-danger, #d92d20);\n	font-size: 13px;\n}\n\n.solDsh_footer {\n	display: flex;\n	justify-content: flex-end;\n	gap: 8px;\n}\n\n.solDsh_footer button {\n	padding: 6px 12px;\n	border-radius: 8px;\n	border: 1px solid var(--dsw-alias-border, #d0d5dd);\n	background: var(--dsw-alias-surface, #fff);\n	color: inherit;\n}\n\n.solDsh_footer button[type="submit"] {\n	background: var(--dsw-alias-primary, #155eef);\n	border-color: var(--dsw-alias-primary, #155eef);\n	color: #fff;\n}\n\n.solDsh_footer button:disabled {\n	opacity: 0.5;\n}\n';
  document.head.appendChild(s);
}
var card_default = { "card": "solDsh_card", "header": "solDsh_header", "titles": "solDsh_titles", "pill": "solDsh_pill", "chevronOpen": "solDsh_chevronOpen", "body": "solDsh_body", "fieldset": "solDsh_fieldset", "notice": "solDsh_notice", "row": "solDsh_row", "error": "solDsh_error", "footer": "solDsh_footer" };

// src/sol-dsh/client/card.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function cloneConfig(value) {
  return structuredClone(value);
}
function sameConfig(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function SolDshCard(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [draft, setDraft] = (0, import_react.useState)(() => cloneConfig(DEFAULT_SOL_DSH_CONFIG));
  const [loaded, setLoaded] = (0, import_react.useState)(DEFAULT_SOL_DSH_CONFIG);
  const [revision, setRevision] = (0, import_react.useState)(0);
  const [writable, setWritable] = (0, import_react.useState)(false);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)();
  (0, import_react.useEffect)(() => {
    void props.load().then((snapshot) => {
      setLoaded(snapshot.value);
      setDraft(cloneConfig(snapshot.value));
      setRevision(snapshot.revision);
      setWritable(snapshot.writable);
    });
  }, [props]);
  const dirty = (0, import_react.useMemo)(() => !sameConfig(draft, loaded), [draft, loaded]);
  const t = props.t;
  const saveDisabled = !dirty || saving || !writable;
  const discardDisabled = !dirty || saving;
  const patch = (key, inner) => {
    setDraft((current) => ({ ...current, [key]: { ...current[key], ...inner } }));
  };
  const onSave = async (event) => {
    event.preventDefault();
    if (saveDisabled) return;
    setSaving(true);
    setError(void 0);
    try {
      const resolved = resolveSolDshConfig(draft);
      await props.onSave(resolved, revision);
      setLoaded(resolved);
      setDraft(cloneConfig(resolved));
      setRevision(revision + 1);
      setOpen(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: card_default.card, "data-plugin": "dsh-sol-pi", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: card_default.header,
        "aria-expanded": open,
        "aria-label": t("title"),
        onClick: () => setOpen((value) => !value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: card_default.titles, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: t("title") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("description") })
          ] }),
          dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.pill, children: t("unsaved") }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: open ? card_default.chevronOpen : card_default.chevron, "aria-hidden": true, children: "\u25BE" })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { className: card_default.body, onSubmit: onSave, children: [
      !writable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.notice, children: t("readonly") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: card_default.fieldset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: t("actionFusion") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("actionFusionHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("enabled") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: draft.actionFusion.enabled,
              onChange: (event) => patch("actionFusion", { enabled: event.target.checked })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: card_default.fieldset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: t("observationPack") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("observationPackHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("enabled") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: draft.observationPack.enabled,
              onChange: (event) => patch("observationPack", { enabled: event.target.checked })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("mode") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "select",
            {
              value: draft.observationPack.mode,
              onChange: (event) => patch("observationPack", {
                mode: event.target.value === "delayed" ? "delayed" : "immediate",
                fullSends: event.target.value === "delayed" ? Math.max(draft.observationPack.fullSends, 2) : 0
              }),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "immediate", children: t("modeImmediate") }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "delayed", children: t("modeDelayed") })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("thresholdBytes"),
            value: draft.observationPack.thresholdBytes,
            onChange: (value) => patch("observationPack", { thresholdBytes: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("fullSends"),
            value: draft.observationPack.fullSends,
            onChange: (value) => patch("observationPack", { fullSends: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("placeholderExcerptBytes"),
            value: draft.observationPack.placeholderExcerptBytes,
            onChange: (value) => patch("observationPack", { placeholderExcerptBytes: value })
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: card_default.fieldset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: t("epr") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("eprHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("enabled") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: draft.evidencePreservingReducer.enabled,
              onChange: (event) => patch("evidencePreservingReducer", { enabled: event.target.checked })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("minBytes"),
            value: draft.evidencePreservingReducer.minBytes,
            onChange: (value) => patch("evidencePreservingReducer", { minBytes: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("maxChars"),
            value: draft.evidencePreservingReducer.maxChars,
            onChange: (value) => patch("evidencePreservingReducer", { maxChars: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("maxOutputTokens"),
            value: draft.evidencePreservingReducer.maxOutputTokens,
            onChange: (value) => patch("evidencePreservingReducer", { maxOutputTokens: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("timeoutMs"),
            value: draft.evidencePreservingReducer.timeoutMs,
            onChange: (value) => patch("evidencePreservingReducer", { timeoutMs: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("reducerProvider") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              value: draft.evidencePreservingReducer.reducerProvider,
              onChange: (event) => patch("evidencePreservingReducer", { reducerProvider: event.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("reducerModel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              value: draft.evidencePreservingReducer.reducerModel,
              onChange: (event) => patch("evidencePreservingReducer", { reducerModel: event.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("reducerRouteHelp") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { className: card_default.fieldset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: t("occ") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("occHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("enabled") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "checkbox",
              checked: draft.onlineContextCompact.enabled,
              onChange: (event) => patch("onlineContextCompact", { enabled: event.target.checked })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("cacheWriteReadRatio"),
            value: draft.onlineContextCompact.cacheWriteReadRatio,
            step: 0.1,
            onChange: (value) => patch("onlineContextCompact", { cacheWriteReadRatio: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("cacheWriteReadRatioHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("keepRecentTokens"),
            value: draft.onlineContextCompact.keepRecentTokens,
            onChange: (value) => patch("onlineContextCompact", { keepRecentTokens: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.help, children: t("keepRecentTokensHelp") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("nativeSummaryTokenEstimate"),
            value: draft.onlineContextCompact.nativeSummaryTokenEstimate,
            onChange: (value) => patch("onlineContextCompact", { nativeSummaryTokenEstimate: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("windowReserveTokens"),
            value: draft.onlineContextCompact.windowReserveTokens,
            onChange: (value) => patch("onlineContextCompact", { windowReserveTokens: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("firstCompactionRequestScale"),
            value: draft.onlineContextCompact.firstCompactionRequestScale,
            step: 0.1,
            onChange: (value) => patch("onlineContextCompact", { firstCompactionRequestScale: value })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          NumberRow,
          {
            label: t("subsequentCompactionMargin"),
            value: draft.onlineContextCompact.subsequentCompactionMargin,
            step: 0.1,
            onChange: (value) => patch("onlineContextCompact", { subsequentCompactionMargin: value })
          }
        )
      ] }),
      error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.error, children: error }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { className: card_default.footer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            disabled: discardDisabled,
            onClick: () => {
              setDraft(cloneConfig(loaded));
              setError(void 0);
            },
            children: t("discard")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            disabled: saving,
            onClick: () => setDraft(cloneConfig(DEFAULT_SOL_DSH_CONFIG)),
            children: t("reset")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "submit", disabled: saveDisabled, children: saving ? t("saving") : t("save") })
      ] })
    ] }) : null
  ] });
}
function NumberRow(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: card_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        type: "number",
        step: props.step ?? 1,
        value: props.value,
        onChange: (event) => props.onChange(Number(event.target.value))
      }
    )
  ] });
}

// src/sol-dsh/client/locales.ts
var SOL_DSH_LOCALE_NS = "settings.solDsh";
var zh = {
  title: "SoL",
  description: "\u4E0A\u4E0B\u6587\u4E0E\u5DE5\u5177\u6548\u7387\uFF1A\u52A8\u4F5C\u878D\u5408\u3001ObservationPack\u3001\u8BC1\u636E\u4FDD\u7559\u5F52\u7EA6\u3001\u5728\u7EBF\u538B\u7F29\u3002",
  unsaved: "\u672A\u4FDD\u5B58",
  save: "\u4FDD\u5B58",
  discard: "\u4E22\u5F03",
  reset: "\u91CD\u7F6E\u4E3A\u9ED8\u8BA4",
  saving: "\u6B63\u5728\u4FDD\u5B58\u2026",
  saveFailed: "\u4FDD\u5B58\u5931\u8D25\u3002\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002",
  conflict: "\u914D\u7F6E\u5DF2\u5728\u522B\u5904\u66F4\u65B0\uFF0C\u4FDD\u5B58\u88AB\u62D2\u7EDD\u3002\u8BF7\u4E22\u5F03\u540E\u91CD\u8BD5\u3002",
  readonly: "\u5F53\u524D\u73AF\u5883\u53EA\u8BFB\uFF0C\u65E0\u6CD5\u5199\u5165\u8BBE\u7F6E\u3002",
  actionFusion: "\u52A8\u4F5C\u878D\u5408",
  actionFusionHelp: "\u4E3A edit / write \u589E\u52A0\u53EF\u9009 then_run\uFF0C\u5728\u540C\u4E00\u6B21\u89C2\u5BDF\u91CC\u8DD1\u5B8C\u540E\u7EED\u547D\u4EE4\u3002",
  observationPack: "ObservationPack",
  observationPackHelp: "\u5927\u5DE5\u5177\u7ED3\u679C\u843D\u76D8\u5E76\u4EE5\u9884\u89C8\u4EE3\u66FF\u5168\u6587\u3002\u68C0\u7D22\u8BF7\u7528 read / grep\uFF0C\u4E0D\u8981\u53D1\u660E obs_recall\u3002",
  mode: "\u6A21\u5F0F",
  modeImmediate: "\u7ACB\u5373\uFF08\u9ED8\u8BA4\uFF0C\u4E0D\u6539\u5386\u53F2\u524D\u7F00\uFF09",
  modeDelayed: "\u5EF6\u8FDF\uFF08\u82E5\u5E72\u6B21\u5168\u6587\u540E\u518D\u66FF\u6362\uFF0C\u4F1A\u7F13\u5B58\u672A\u547D\u4E2D\uFF09",
  thresholdBytes: "\u4F53\u79EF\u9608\u503C\uFF08\u5B57\u8282\uFF09",
  fullSends: "\u5168\u6587\u53D1\u9001\u6B21\u6570",
  placeholderExcerptBytes: "\u9884\u89C8\u6458\u5F55\uFF08\u5B57\u8282\uFF09",
  epr: "\u8BC1\u636E\u4FDD\u7559\u5F52\u7EA6",
  eprHelp: "\u628A\u8BCA\u65AD\u65E5\u5FD7\u6536\u6210\u53EF\u6838\u5BF9\u7684\u8BC1\u636E\u56DE\u6267\u3002\u65E5\u5FD7\u4E0D\u5F97\u79BB\u673A\u65F6\u8BF7\u5173\u95ED\u3002",
  minBytes: "\u6700\u5C0F\u4F53\u79EF\uFF08\u5B57\u8282\uFF09",
  maxChars: "\u6700\u5927\u5B57\u7B26",
  maxOutputTokens: "\u5F52\u7EA6\u8F93\u51FA\u4E0A\u9650",
  timeoutMs: "\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09",
  reducerProvider: "\u5F52\u7EA6\u4F9B\u5E94\u5546",
  reducerModel: "\u5F52\u7EA6\u6A21\u578B",
  reducerRouteHelp: "\u7559\u7A7A\u5219\u4F7F\u7528\u5F53\u524D agent \u8DEF\u7531\u3002\u4E24\u9879\u5FC5\u987B\u540C\u7A7A\u6216\u540C\u586B\u3002",
  occ: "\u5728\u7EBF\u4E0A\u4E0B\u6587\u538B\u7F29",
  occHelp: "\u53EA\u4F5C\u4E3A ctx.compaction \u7684\u7B56\u7565\uFF0C\u4E0D\u6302\u7B2C\u4E8C\u5957\u538B\u7F29\u5F15\u64CE\u3002",
  cacheWriteReadRatio: "\u7F13\u5B58\u5199/\u8BFB\u6BD4",
  cacheWriteReadRatioHelp: "DeepSeek Flash \u5CF0\u503C miss/hit = 50\u3002V4 Pro = 30\u3002",
  keepRecentTokens: "\u4FDD\u7559\u8FD1\u671F token",
  keepRecentTokensHelp: "0 \u8868\u793A\u8DDF\u968F DSH retainRatio\uFF08\u7EA6 0.16 \xD7 \u7A97\u53E3\uFF09\u3002",
  nativeSummaryTokenEstimate: "\u6458\u8981 token \u4F30\u8BA1",
  windowReserveTokens: "\u7A97\u53E3\u4FDD\u62A4\u9884\u7559",
  firstCompactionRequestScale: "\u9996\u6B21\u538B\u7F29\u89C6\u91CE\u500D\u7387",
  subsequentCompactionMargin: "\u540E\u7EED\u538B\u7F29\u4F59\u91CF",
  enabled: "\u542F\u7528"
};
var en = {
  title: "SoL",
  description: "Context and tool efficiency: action fusion, ObservationPack, evidence-preserving reduction, online compaction.",
  unsaved: "Unsaved",
  save: "Save",
  discard: "Discard",
  reset: "Reset to defaults",
  saving: "Saving\u2026",
  saveFailed: "Save failed. Drafts were kept.",
  conflict: "Configuration changed elsewhere; save was rejected. Discard and retry.",
  readonly: "This environment is read-only.",
  actionFusion: "Action fusion",
  actionFusionHelp: "Adds optional then_run on edit/write so the follow-up command shares one observation.",
  observationPack: "ObservationPack",
  observationPackHelp: "Stores large tool results and shows a preview. Retrieve with read/grep \u2014 do not invent obs_recall.",
  mode: "Mode",
  modeImmediate: "Immediate (default, prefix-cache safe)",
  modeDelayed: "Delayed (full sends then replace; cache miss)",
  thresholdBytes: "Threshold (bytes)",
  fullSends: "Full sends",
  placeholderExcerptBytes: "Preview excerpt (bytes)",
  epr: "Evidence-preserving reducer",
  eprHelp: "Turns diagnostic logs into a verifiable receipt. Disable if logs must not leave the machine.",
  minBytes: "Minimum size (bytes)",
  maxChars: "Maximum characters",
  maxOutputTokens: "Reducer output cap",
  timeoutMs: "Timeout (ms)",
  reducerProvider: "Reducer provider",
  reducerModel: "Reducer model",
  reducerRouteHelp: "Leave both empty to use the current agent route. Both must be empty or both set.",
  occ: "Online context compact",
  occHelp: "A policy on ctx.compaction \u2014 not a second compaction engine.",
  cacheWriteReadRatio: "Cache write/read ratio",
  cacheWriteReadRatioHelp: "DeepSeek Flash peak miss/hit = 50. V4 Pro = 30.",
  keepRecentTokens: "Keep-recent tokens",
  keepRecentTokensHelp: "0 follows DSH retainRatio (about 0.16 \xD7 window).",
  nativeSummaryTokenEstimate: "Summary token estimate",
  windowReserveTokens: "Window-protection reserve",
  firstCompactionRequestScale: "First-compaction horizon scale",
  subsequentCompactionMargin: "Subsequent compaction margin",
  enabled: "Enabled"
};
var zhKeys = Object.keys(zh).sort();
var enKeys = Object.keys(en).sort();
if (zhKeys.join("\0") !== enKeys.join("\0")) {
  throw new Error("sol-dsh locale dictionaries must share one key set");
}
var solDshLocales = { zh, en };

// src/sol-dsh/client/index.ts
var inject = ["slots", "locale"];
function translator(ctx) {
  const bound = ctx.locale?.bind?.(SOL_DSH_LOCALE_NS);
  if (bound) return (key) => bound(key);
  return (key) => ctx.locale?.t?.(SOL_DSH_LOCALE_NS, key) ?? solDshLocales.en[key];
}
async function readConfig(remote) {
  try {
    if (remote?.get) {
      const snapshot = await remote.get(SOL_DSH_SETTINGS_NAMESPACE);
      if (snapshot && typeof snapshot === "object" && "value" in snapshot) {
        const record = snapshot;
        return {
          value: resolveSolDshConfig(record.value),
          revision: record.revision ?? 0,
          writable: true
        };
      }
      return { value: resolveSolDshConfig(snapshot), revision: 0, writable: true };
    }
    const described = await remote?.describe?.();
    const row = described?.find((item) => item.namespace === SOL_DSH_SETTINGS_NAMESPACE);
    if (row) {
      return {
        value: resolveSolDshConfig(row.value),
        revision: row.revision ?? 0,
        writable: true
      };
    }
  } catch {
  }
  return { value: DEFAULT_SOL_DSH_CONFIG, revision: 0, writable: false };
}
function apply(ctx) {
  ctx.locale?.register(SOL_DSH_LOCALE_NS, solDshLocales);
  ctx.slots?.inject("settings.plugin.item", { key: SOL_DSH_SETTINGS_NAMESPACE }, (frame) => {
    const remote = frame.get?.("remote.settings") ?? frame.get?.("settings");
    const t = translator(frame);
    return (0, import_react2.createElement)(SolDshCard, {
      t,
      load: () => readConfig(remote),
      onSave: async (patch, expectedRevision) => {
        if (!remote?.update) throw new Error(t("readonly"));
        await remote.update(SOL_DSH_SETTINGS_NAMESPACE, patch, expectedRevision);
      }
    });
  });
}

return module.exports;
} });
