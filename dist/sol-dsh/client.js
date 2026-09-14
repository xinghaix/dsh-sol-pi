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
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react = require("react");

// sol-dsh-css:/Users/xing/Projects/github/SoL-Pi/src/sol-dsh/client/card.module.css
if (typeof document !== "undefined" && !document.getElementById("sol-dsh-css")) {
  const s = document.createElement("style");
  s.id = "sol-dsh-css";
  s.textContent = `/* Match @deepseek-ai/dsh-client-ui-settings-plugins PluginCard + fields chrome. */

.solDsh_card {
	border: 0.5px solid var(--dsw-alias-border-l4);
	background: var(--dsw-alias-bg-layer-3);
	border-radius: 16px;
	list-style: none;
	transition: border-color 0.16s, background 0.16s;
}

.solDsh_card:hover {
	border-color: var(--dsw-alias-label-dimmed);
}

.solDsh_cardOpen {
	background: var(--dsw-alias-bg-layer-2);
	border-color: var(--dsw-alias-label-dimmed);
}

.solDsh_header {
	appearance: none;
	width: 100%;
	font: inherit;
	color: inherit;
	text-align: left;
	cursor: pointer;
	background: 0 0;
	border: 0;
	border-radius: 12px;
	align-items: center;
	gap: 12px;
	padding: 14px 16px;
	display: flex;
}

.solDsh_header:focus-visible {
	outline: 2px solid var(--dsw-alias-brand-primary);
	outline-offset: -2px;
}

.solDsh_headText {
	flex-direction: column;
	flex: 1;
	gap: 4px;
	min-width: 0;
	display: flex;
}

.solDsh_name {
	color: var(--dsw-alias-label-primary);
	font-size: 15px;
	font-weight: 600;
	line-height: 1.4;
}

.solDsh_description {
	color: var(--dsw-alias-label-tertiary);
	font-size: 13px;
	line-height: 1.5;
}

.solDsh_pending {
	flex: none;
}

.solDsh_chevron {
	color: var(--dsw-alias-label-tertiary);
	flex: none;
	width: 14px;
	height: 14px;
	transition: transform 0.16s;
}

.solDsh_chevronOpen {
	transform: rotate(180deg);
}

.solDsh_body {
	border-top: 0.5px solid var(--dsw-alias-border-l2);
	margin: 0 16px;
	padding-bottom: 8px;
}

.solDsh_readOnly {
	color: var(--dsw-alias-label-tertiary);
	margin: 12px 0 0;
	font-size: 12px;
	line-height: 1.5;
}

.solDsh_footer {
	border-top: 0.5px solid var(--dsw-alias-border-l2);
	justify-content: flex-end;
	align-items: center;
	gap: 8px;
	padding: 12px 0 4px;
	display: flex;
}

.solDsh_failed {
	min-width: 0;
	color: var(--dsw-alias-label-error);
	flex: 1;
	margin: 0;
	font-size: 12px;
	line-height: 1.5;
}

.solDsh_discard,
.solDsh_save {
	appearance: none;
	font: inherit;
	cursor: pointer;
	border: 1px solid transparent;
	border-radius: 8px;
	padding: 5px 14px;
	font-size: 13px;
	line-height: 1.5;
}

.solDsh_discard {
	border-color: var(--dsw-alias-border-l2);
	color: var(--dsw-alias-label-secondary);
	background: 0 0;
}

.solDsh_discard:hover:not(:disabled) {
	color: var(--dsw-alias-label-primary);
	border-color: var(--dsw-alias-label-dimmed);
}

.solDsh_save {
	background: var(--dsw-alias-label-primary);
	color: var(--dsw-alias-bg-layer-3);
}

.solDsh_discard:disabled,
.solDsh_save:disabled {
	opacity: 0.4;
	cursor: default;
}

.solDsh_discard:focus-visible,
.solDsh_save:focus-visible {
	outline: 2px solid var(--dsw-alias-brand-primary);
	outline-offset: 1px;
}

.solDsh_field {
	flex-direction: column;
	gap: 6px;
	padding: 12px 0;
	display: flex;
}

.solDsh_field + .solDsh_field {
	border-top: 0.5px solid var(--dsw-alias-border-l2);
}

.solDsh_head {
	align-items: center;
	gap: 8px;
	display: flex;
}

.solDsh_label {
	min-width: 0;
	color: var(--dsw-alias-label-primary);
	flex: 1;
	font-size: 13px;
	font-weight: 500;
	line-height: 1.5;
}

.solDsh_hint {
	color: var(--dsw-alias-label-tertiary);
	margin: 0;
	font-size: 12px;
	line-height: 1.5;
}

.solDsh_input,
.solDsh_select {
	border: 0.5px solid var(--dsw-alias-border-l4);
	background: var(--dsw-alias-bg-layer-3);
	height: 34px;
	font: inherit;
	color: var(--dsw-alias-label-primary);
	border-radius: 8px;
	padding: 0 12px;
	font-size: 13px;
	line-height: 1.5;
	width: 100%;
	box-sizing: border-box;
}

.solDsh_select {
	appearance: none;
	cursor: pointer;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.solDsh_w3.solDsh_org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
	background-position: right 12px center;
	background-repeat: no-repeat;
	background-size: 12px 12px;
	padding-right: 32px;
	max-width: 100%;
}

.solDsh_input:focus-visible,
.solDsh_select:focus-visible {
	border-color: var(--dsw-alias-brand-primary);
	outline: none;
}

.solDsh_input:disabled,
.solDsh_select:disabled {
	color: var(--dsw-alias-label-tertiary);
	cursor: default;
}

.solDsh_toggleRow {
	align-items: center;
	gap: 12px;
	display: flex;
}

.solDsh_toggleLabel {
	min-width: 0;
	color: var(--dsw-alias-label-primary);
	flex: 1;
	font-size: 13px;
	font-weight: 500;
	line-height: 1.5;
}

.solDsh_group {
	padding: 14px 0 4px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.solDsh_group + .solDsh_field {
	border-top: none;
	padding-top: 8px;
}

.solDsh_groupTitle {
	color: var(--dsw-alias-label-primary);
	margin: 0;
	font-size: 13px;
	font-weight: 600;
	line-height: 1.5;
}

.solDsh_groupHint {
	color: var(--dsw-alias-label-tertiary);
	margin: 0;
	font-size: 12px;
	line-height: 1.5;
}

.solDsh_nativeSwitch {
	width: 40px;
	height: 24px;
	appearance: none;
	background: var(--dsw-alias-border-l2);
	border-radius: 999px;
	position: relative;
	cursor: pointer;
	flex: none;
	border: 0;
	padding: 0;
	transition: background 0.16s;
}

.solDsh_nativeSwitch::after {
	content: "";
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background: var(--dsw-alias-bg-layer-3);
	position: absolute;
	top: 3px;
	left: 3px;
	transition: transform 0.16s;
	box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
}

.solDsh_nativeSwitch:checked {
	background: var(--dsw-alias-brand-primary);
}

.solDsh_nativeSwitch:checked::after {
	transform: translateX(16px);
}

.solDsh_nativeSwitch:disabled {
	opacity: 0.4;
	cursor: default;
}

.solDsh_nativeSwitch:focus-visible {
	outline: 2px solid var(--dsw-alias-brand-primary);
	outline-offset: 2px;
}

.solDsh_unsavedFallback {
	white-space: nowrap;
	background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-1));
	color: var(--dsw-alias-label-secondary);
	border-radius: 999px;
	flex: none;
	padding: 1px 8px;
	font-size: 11px;
	font-weight: 500;
	line-height: 17px;
}

.solDsh_badges {
	align-items: center;
	gap: 8px;
	display: inline-flex;
}

.solDsh_reset {
	font: inherit;
	color: var(--dsw-alias-label-secondary);
	cursor: pointer;
	background: 0 0;
	border: none;
	padding: 0;
	font-size: 12px;
	line-height: 1.5;
}

.solDsh_reset:hover:not(:disabled) {
	color: var(--dsw-alias-label-primary);
}

.solDsh_reset:disabled {
	cursor: default;
}

.solDsh_inputInvalid {
	border-color: var(--dsw-alias-label-error);
}

.solDsh_invalid {
	color: var(--dsw-alias-label-error);
	margin: 0;
	font-size: 12px;
	line-height: 1.5;
}
`;
  document.head.appendChild(s);
}
var card_default = { "card": "solDsh_card", "cardOpen": "solDsh_cardOpen", "header": "solDsh_header", "headText": "solDsh_headText", "name": "solDsh_name", "description": "solDsh_description", "pending": "solDsh_pending", "chevron": "solDsh_chevron", "chevronOpen": "solDsh_chevronOpen", "body": "solDsh_body", "readOnly": "solDsh_readOnly", "footer": "solDsh_footer", "failed": "solDsh_failed", "save": "solDsh_save", "discard": "solDsh_discard", "field": "solDsh_field", "head": "solDsh_head", "label": "solDsh_label", "hint": "solDsh_hint", "select": "solDsh_select", "toggleRow": "solDsh_toggleRow", "toggleLabel": "solDsh_toggleLabel", "group": "solDsh_group", "groupTitle": "solDsh_groupTitle", "groupHint": "solDsh_groupHint", "nativeSwitch": "solDsh_nativeSwitch", "unsavedFallback": "solDsh_unsavedFallback", "badges": "solDsh_badges", "reset": "solDsh_reset", "inputInvalid": "solDsh_inputInvalid", "invalid": "solDsh_invalid" };

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
function Group(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.group, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.groupTitle, children: props.title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.groupHint, children: props.hint })
  ] });
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: card_default.field, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.toggleRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: card_default.headText, style: { flex: 1, minWidth: 0 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      FieldHead,
      {
        label: props.label,
        overridden: props.overridden,
        disabled: props.disabled,
        overriddenLabel: props.overriddenLabel,
        resetLabel: props.resetLabel,
        onReset: props.onReset
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Switch,
      {
        checked: props.checked,
        label: props.label,
        disabled: props.disabled,
        onChange: props.onChange
      }
    )
  ] }) });
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: props.invalid ? card_default.invalid : card_default.hint, children: props.invalid ? props.invalidLabel : props.hint })
  ] });
}
function SelectRow(props) {
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
      "select",
      {
        id: props.id,
        className: card_default.select,
        value: props.value,
        disabled: props.disabled,
        onChange: (event) => props.onChange(event.target.value),
        children: props.children
      }
    )
  ] });
}
function SolDshCard(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
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
  const saveStarted = (0, import_react.useRef)(false);
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
    void props.load().then(syncFromSnapshot);
  }, [props]);
  (0, import_react.useEffect)(() => {
    if (saving) {
      saveStarted.current = true;
      return;
    }
    if (!saveStarted.current) return;
    saveStarted.current = false;
    if (!sameConfig(draft, loaded) || clears.size > 0) return;
    if (!failed) setOpen(false);
  }, [saving, draft, loaded, clears, failed]);
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
      const snapshot = await props.load();
      syncFromSnapshot(snapshot);
    } catch (failure) {
      setFailed(true);
      setError(failure instanceof Error ? failure.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };
  const title = t("title");
  const common = {
    disabled,
    overriddenLabel: t("overridden"),
    resetLabel: t("reset"),
    invalidLabel: t("invalidNumber")
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: `${card_default.card}${open ? ` ${card_default.cardOpen}` : ""}`, "data-plugin": "dsh-sol-pi", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: card_default.header,
        "aria-expanded": open,
        "aria-label": `${t(open ? "collapse" : "expand")}: ${title}`,
        onClick: () => setOpen((value) => !value),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: card_default.headText, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.name, children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: card_default.description, children: t("description") })
          ] }),
          dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: "neutral", className: card_default.pending, children: t("unsaved") }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, { className: `${card_default.chevron}${open ? ` ${card_default.chevronOpen}` : ""}` })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: card_default.body, children: [
      !writable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: card_default.readOnly, role: "status", children: t("readonly") }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, { title: t("actionFusion"), hint: t("actionFusionHelp") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        SwitchRow,
        {
          ...common,
          label: t("enabled"),
          checked: draft.actionFusion.enabled,
          overridden: overridden(["actionFusion", "enabled"]),
          onChange: (checked) => editValue(["actionFusion", "enabled"], checked),
          onReset: () => resetPath(["actionFusion", "enabled"])
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, { title: t("observationPack"), hint: t("observationPackHelp") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        SwitchRow,
        {
          ...common,
          label: t("enabled"),
          checked: draft.observationPack.enabled,
          overridden: overridden(["observationPack", "enabled"]),
          onChange: (checked) => editValue(["observationPack", "enabled"], checked),
          onReset: () => resetPath(["observationPack", "enabled"])
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        SelectRow,
        {
          ...common,
          id: "sol-obs-mode",
          label: t("mode"),
          value: draft.observationPack.mode,
          overridden: overridden(["observationPack", "mode"]),
          onChange: (value) => {
            editValue(["observationPack", "mode"], value === "delayed" ? "delayed" : "immediate");
            if (value === "delayed" && draft.observationPack.fullSends < 2) {
              editValue(["observationPack", "fullSends"], 2);
            }
            if (value === "immediate") editValue(["observationPack", "fullSends"], 0);
          },
          onReset: () => resetPath(["observationPack", "mode"]),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "immediate", children: t("modeImmediate") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "delayed", children: t("modeDelayed") })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ValueRow,
        {
          ...common,
          id: "sol-obs-threshold",
          label: t("thresholdBytes"),
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
          numeric: true,
          text: textOf(["observationPack", "placeholderExcerptBytes"], draft.observationPack.placeholderExcerptBytes),
          invalid: invalidNumeric(["observationPack", "placeholderExcerptBytes"]),
          overridden: overridden(["observationPack", "placeholderExcerptBytes"]),
          onEdit: (text) => editText(["observationPack", "placeholderExcerptBytes"], text),
          onReset: () => resetPath(["observationPack", "placeholderExcerptBytes"])
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, { title: t("epr"), hint: t("eprHelp") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        SwitchRow,
        {
          ...common,
          label: t("enabled"),
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
          numeric: true,
          text: textOf(["evidencePreservingReducer", "timeoutMs"], draft.evidencePreservingReducer.timeoutMs),
          invalid: invalidNumeric(["evidencePreservingReducer", "timeoutMs"]),
          overridden: overridden(["evidencePreservingReducer", "timeoutMs"]),
          onEdit: (text) => editText(["evidencePreservingReducer", "timeoutMs"], text),
          onReset: () => resetPath(["evidencePreservingReducer", "timeoutMs"])
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ValueRow,
        {
          ...common,
          id: "sol-epr-provider",
          label: t("reducerProvider"),
          hint: t("reducerRouteHelp"),
          text: textOf(["evidencePreservingReducer", "reducerProvider"], draft.evidencePreservingReducer.reducerProvider),
          overridden: overridden(["evidencePreservingReducer", "reducerProvider"]),
          onEdit: (text) => {
            editText(["evidencePreservingReducer", "reducerProvider"], text);
            editValue(["evidencePreservingReducer", "reducerProvider"], text);
          },
          onReset: () => resetPath(["evidencePreservingReducer", "reducerProvider"])
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        ValueRow,
        {
          ...common,
          id: "sol-epr-model",
          label: t("reducerModel"),
          text: textOf(["evidencePreservingReducer", "reducerModel"], draft.evidencePreservingReducer.reducerModel),
          overridden: overridden(["evidencePreservingReducer", "reducerModel"]),
          onEdit: (text) => {
            editText(["evidencePreservingReducer", "reducerModel"], text);
            editValue(["evidencePreservingReducer", "reducerModel"], text);
          },
          onReset: () => resetPath(["evidencePreservingReducer", "reducerModel"])
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, { title: t("occ"), hint: t("occHelp") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        SwitchRow,
        {
          ...common,
          label: t("enabled"),
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
    ] }) : null
  ] });
}

// src/sol-dsh/client/locales.ts
var SOL_DSH_LOCALE_NS = "settings.solDsh";
var zh = {
  title: "SoL",
  description: "\u4E0A\u4E0B\u6587\u4E0E\u5DE5\u5177\u6548\u7387\uFF1A\u52A8\u4F5C\u878D\u5408\u3001ObservationPack\u3001\u8BC1\u636E\u4FDD\u7559\u5F52\u7EA6\u3001\u5728\u7EBF\u538B\u7F29\u3002",
  expand: "\u5C55\u5F00",
  overridden: "\u5DF2\u8986\u76D6",
  invalidNumber: "\u8BF7\u8F93\u5165\u6709\u6548\u6570\u5B57",
  collapse: "\u6536\u8D77",
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
  expand: "Expand",
  overridden: "Overridden",
  invalidNumber: "Enter a valid number",
  collapse: "Collapse",
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
var inject = ["slots", "locale", "settingsScope"];
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
  return new Promise((resolve2) => {
    const timer = setTimeout(() => {
      off();
      resolve2(scope.getSnapshot());
    }, timeoutMs);
    const off = scope.subscribe(() => {
      const next = scope.getSnapshot();
      if (next.status === "loading") return;
      clearTimeout(timer);
      off();
      resolve2(next);
    });
  });
}
function deepEqual2(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function apply(ctx) {
  ctx.effect?.(() => ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales), "dsh-sol-pi: locale dictionaries");
  if (!ctx.effect) ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales);
  const t = translator(ctx);
  const scope = ctx.settingsScope.bind({
    namespace: SOL_DSH_SETTINGS_NAMESPACE,
    decode: decodeSection
  });
  ctx.effect?.(() => () => {
    void scope.dispose?.();
  }, "dsh-sol-pi: settings scope");
  ctx.slots.inject(
    "settings.plugin.item",
    () => ctx.slots.register(
      {
        name: "settings.plugin.item",
        key: SOL_DSH_SETTINGS_NAMESPACE,
        locale: SOL_DSH_LOCALE_NS,
        inject: () => ({
          t,
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
              if (deepEqual2(next, composition)) {
                if (user && Object.prototype.hasOwnProperty.call(user, key)) {
                  ops.push({ op: "unset", path: [key] });
                }
              } else {
                ops.push({ op: "set", path: [key], value: next });
              }
            }
            if (ops.length > 0) await scope.mutate(ops, expectedRevision);
          }
        })
      },
      SolDshCard
    )
  );
}

return module.exports;
} });
