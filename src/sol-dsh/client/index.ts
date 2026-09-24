/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig, SOL_DSH_SETTINGS_NAMESPACE, type SolDshConfig } from "../config.ts";
import { SolDshCard } from "./card.tsx";
import { SOL_DSH_LOCALE_NS, solDshLocales, type SolDshLocaleKey } from "./locales.ts";

type ConfigFormSnapshot = {
	status: "loading" | "ready" | "unavailable";
	value: SolDshConfig | undefined;
	base: unknown;
	user: unknown;
	revision: number | undefined;
	writable: boolean;
};

/** DSH 0.1.7+ `configForms.get` face — mutate resolves to false after refused write + recovery. */
type ConfigForm = {
	getSnapshot(): ConfigFormSnapshot;
	subscribe(listener: () => void): () => void;
	mutate(ops: readonly { op: "set" | "unset"; path: string[]; value?: unknown }[], expectedRevision?: number): Promise<boolean>;
};

type ConfigFormsService = {
	get(entryId: string): ConfigForm;
};

type ModelCatalogProvider = {
	id: string;
	name: string;
	models: { id: string; name: string }[];
};

type ModelCatalogGroup = {
	id: string;
	name?: string;
	displayName?: string;
	models: { id: string; name?: string }[];
};

type ModelDirectories = {
	/** Host-generation catalog shared by every session (preferred for settings UI). */
	catalog?: {
		load(): Promise<{ groups?: ModelCatalogGroup[] }>;
		store?: { getSnapshot(): { value: { groups?: ModelCatalogGroup[] } | null; status: string } };
	};
	directoryFor?(sessionId: string): {
		load(): Promise<{ groups?: ModelCatalogGroup[] } | { groups?: unknown }>;
		store?: { getSnapshot(): { groups?: ModelCatalogGroup[] } };
	};
};

type ClientContext = {
	locale: {
		register(ns: string, dicts: { zh: Record<string, string>; en: Record<string, string> }): void;
		bind?(ns: string): (key: string) => string;
		t?(ns: string, key: string): string;
	};
	slots: {
		inject(slot: string, callback: () => unknown): () => void;
		register(options: Record<string, unknown>, component: unknown): () => void;
	};
	configForms: ConfigFormsService;
	inject?(deps: string[], callback: (scope: ClientContext & { modelDirectories?: ModelDirectories }) => void): void;
	effect?(callback: () => void | (() => void), label?: string): void;
};

/** Cordis fiber services — package rows belong in package.json dsh.client.inject. */
export const inject = ["slots", "locale", "configForms"];

export type SolDshSnapshot = {
	readonly value: SolDshConfig;
	readonly base: SolDshConfig;
	readonly user: Record<string, unknown> | undefined;
	readonly revision: number;
	readonly writable: boolean;
};

function translator(ctx: ClientContext): (key: SolDshLocaleKey) => string {
	const bound = ctx.locale.bind?.(SOL_DSH_LOCALE_NS);
	if (bound) return (key) => bound(key);
	return (key) => ctx.locale.t?.(SOL_DSH_LOCALE_NS, key) ?? solDshLocales.en[key];
}

function decodeSection(section: unknown): SolDshConfig | undefined {
	try {
		return resolveSolDshConfig(section);
	} catch {
		return undefined;
	}
}

function asUserLayer(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function whenSettled(scope: ConfigForm, timeoutMs = 8_000): Promise<ConfigFormSnapshot> {
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

function deepEqual(left: unknown, right: unknown): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}


function normalizeCatalog(snapshot: unknown): ModelCatalogProvider[] {
	const groups = (snapshot as { groups?: unknown } | null | undefined)?.groups;
	if (!Array.isArray(groups)) return [];
	const out: ModelCatalogProvider[] = [];
	for (const group of groups) {
		if (typeof group !== "object" || group === null) continue;
		const record = group as Record<string, unknown>;
		const id = typeof record.id === "string" ? record.id : "";
		if (!id) continue;
		const name =
			typeof record.name === "string"
				? record.name
				: typeof record.displayName === "string"
					? record.displayName
					: id;
		const modelsRaw = record.models;
		const models: { id: string; name: string }[] = [];
		if (Array.isArray(modelsRaw)) {
			for (const model of modelsRaw) {
				if (typeof model !== "object" || model === null) continue;
				const row = model as Record<string, unknown>;
				const modelId = typeof row.id === "string" ? row.id : "";
				if (!modelId) continue;
				models.push({
					id: modelId,
					name: typeof row.name === "string" ? row.name : modelId,
				});
			}
		}
		out.push({ id, name, models });
	}
	return out;
}

async function loadCatalogFromDirectories(directories: ModelDirectories | undefined): Promise<ModelCatalogProvider[]> {
	if (!directories) return [];
	try {
		// Prefer the shared Host catalog — directoryFor() is per-session and needs a live session.
		if (directories.catalog) {
			const value = await directories.catalog.load();
			const fromCatalog = normalizeCatalog(value);
			if (fromCatalog.length > 0) return fromCatalog;
			const snap = directories.catalog.store?.getSnapshot();
			if (snap?.value) {
				const fromStore = normalizeCatalog(snap.value);
				if (fromStore.length > 0) return fromStore;
			}
		}
		if (!directories.directoryFor) return [];
		const directory = directories.directoryFor("");
		const loaded = await directory.load();
		const fromLoad = normalizeCatalog(loaded);
		if (fromLoad.length > 0) return fromLoad;
		return normalizeCatalog(directory.store?.getSnapshot());
	} catch {
		return [];
	}
}

/**
 * Sidebar Plugins → dsh-sol-pi bundle configuration.
 * Reads/writes through `ctx.configForms` (DSH 0.1.7+; settingsScope was removed).
 */
export function apply(ctx: ClientContext): void {
	ctx.effect?.(() => ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales), "dsh-sol-pi: locale dictionaries");
	if (!ctx.effect) ctx.locale.register(SOL_DSH_LOCALE_NS, solDshLocales);

	// Cordis throws on undeclared ctx.modelDirectories — only touch it inside inject().
	let directories: ModelDirectories | undefined;
	const directoriesReady = new Promise<ModelDirectories | undefined>((resolve) => {
		if (typeof ctx.inject !== "function") {
			resolve(undefined);
			return;
		}
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			resolve(directories);
		};
		ctx.inject(["modelDirectories"], (scope) => {
			directories = scope.modelDirectories;
			finish();
		});
		// Settings card can open before the service attaches; don't hang the menu forever.
		setTimeout(finish, 4_000);
	});

	const t = translator(ctx);
	const scope = ctx.configForms.get(SOL_DSH_SETTINGS_NAMESPACE);

	ctx.slots.inject("plugins.bundle.config", () =>
		ctx.slots.register(
			{
				name: "plugins.bundle.config",
				key: SOL_DSH_SETTINGS_NAMESPACE,
				locale: SOL_DSH_LOCALE_NS,
				inject: () => ({
					t,
					loadModelCatalog: async () => loadCatalogFromDirectories(await directoriesReady),
					load: async (): Promise<SolDshSnapshot> => {
						const snap = await whenSettled(scope);
						const base = decodeSection(snap.base) ?? DEFAULT_SOL_DSH_CONFIG;
						return {
							value: snap.value ?? base,
							base,
							user: asUserLayer(snap.user),
							revision: snap.revision ?? 0,
							writable: snap.writable && snap.status !== "unavailable",
						};
					},
					onSave: async (patch: SolDshConfig, expectedRevision: number, base: SolDshConfig, user: Record<string, unknown> | undefined) => {
						const snap = scope.getSnapshot();
						if (!snap.writable || snap.status === "unavailable") throw new Error(t("readonly"));
						const ops: { op: "set" | "unset"; path: string[]; value?: unknown }[] = [];
						for (const key of Object.keys(patch) as (keyof SolDshConfig)[]) {
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
							// configForms.mutate resolves to false after a refused write + recovery.
							const ok = await scope.mutate(ops, expectedRevision);
							if (!ok) {
								throw new Error(t("saveFailed"));
							}
							// Belt-and-suspenders: confirm the mirrored user layer matches.
							const settled = await whenSettled(scope);
							const value = decodeSection(settled.value);
							const settledUser = asUserLayer(settled.user);
							if (settled.status !== "ready" || !value || !deepEqual(value, patch) ||
								ops.some((op) => op.op === "unset"
									? settledUser && Object.prototype.hasOwnProperty.call(settledUser, op.path[0]!)
									: !deepEqual(settledUser?.[op.path[0]!], op.value))) {
								throw new Error(t("saveFailed"));
							}
						}
					},
				}),
			},
			SolDshCard,
		),
	);
}
