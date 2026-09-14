/*
 * SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { SolDshConfig } from "../config.ts";
import { DEFAULT_SOL_DSH_CONFIG, resolveSolDshConfig } from "../config.ts";
import type { SolDshLocaleKey } from "./locales.ts";
import styles from "./card.module.css";

export type Translator = (key: SolDshLocaleKey) => string;

export type SolDshSnapshot = {
	readonly value: SolDshConfig;
	readonly revision: number;
	readonly writable: boolean;
};

export type SolDshCardProps = {
	readonly t: Translator;
	readonly load: () => Promise<SolDshSnapshot>;
	readonly onSave: (patch: SolDshConfig, expectedRevision: number) => Promise<void>;
};

function cloneConfig(value: SolDshConfig): SolDshConfig {
	return structuredClone(value);
}

function sameConfig(left: SolDshConfig, right: SolDshConfig): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

export function SolDshCard(props: SolDshCardProps) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(() => cloneConfig(DEFAULT_SOL_DSH_CONFIG));
	const [loaded, setLoaded] = useState(DEFAULT_SOL_DSH_CONFIG);
	const [revision, setRevision] = useState(0);
	const [writable, setWritable] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | undefined>();

	useEffect(() => {
		void props.load().then((snapshot) => {
			setLoaded(snapshot.value);
			setDraft(cloneConfig(snapshot.value));
			setRevision(snapshot.revision);
			setWritable(snapshot.writable);
		});
	}, [props]);

	const dirty = useMemo(() => !sameConfig(draft, loaded), [draft, loaded]);

	const t = props.t;
	const saveDisabled = !dirty || saving || !writable;
	const discardDisabled = !dirty || saving;

	const patch = <K extends keyof SolDshConfig>(key: K, inner: Partial<SolDshConfig[K]>) => {
		setDraft((current) => ({ ...current, [key]: { ...current[key], ...inner } }));
	};

	const onSave = async (event: FormEvent) => {
		event.preventDefault();
		if (saveDisabled) return;
		setSaving(true);
		setError(undefined);
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

	return (
		<section className={styles.card} data-plugin="dsh-sol-pi">
			<button
				type="button"
				className={styles.header}
				aria-expanded={open}
				aria-label={t("title")}
				onClick={() => setOpen((value) => !value)}
			>
				<span className={styles.titles}>
					<strong>{t("title")}</strong>
					<span>{t("description")}</span>
				</span>
				{dirty ? <span className={styles.pill}>{t("unsaved")}</span> : null}
				<span className={open ? styles.chevronOpen : styles.chevron} aria-hidden>
					▾
				</span>
			</button>
			{open ? (
				<form className={styles.body} onSubmit={onSave}>
					{!writable ? <p className={styles.notice}>{t("readonly")}</p> : null}

					<fieldset className={styles.fieldset}>
						<legend>{t("actionFusion")}</legend>
						<p className={styles.help}>{t("actionFusionHelp")}</p>
						<label className={styles.row}>
							<span>{t("enabled")}</span>
							<input
								type="checkbox"
								checked={draft.actionFusion.enabled}
								onChange={(event) => patch("actionFusion", { enabled: event.target.checked })}
							/>
						</label>
					</fieldset>

					<fieldset className={styles.fieldset}>
						<legend>{t("observationPack")}</legend>
						<p className={styles.help}>{t("observationPackHelp")}</p>
						<label className={styles.row}>
							<span>{t("enabled")}</span>
							<input
								type="checkbox"
								checked={draft.observationPack.enabled}
								onChange={(event) => patch("observationPack", { enabled: event.target.checked })}
							/>
						</label>
						<label className={styles.row}>
							<span>{t("mode")}</span>
							<select
								value={draft.observationPack.mode}
								onChange={(event) =>
									patch("observationPack", {
										mode: event.target.value === "delayed" ? "delayed" : "immediate",
										fullSends: event.target.value === "delayed" ? Math.max(draft.observationPack.fullSends, 2) : 0,
									})
								}
							>
								<option value="immediate">{t("modeImmediate")}</option>
								<option value="delayed">{t("modeDelayed")}</option>
							</select>
						</label>
						<NumberRow
							label={t("thresholdBytes")}
							value={draft.observationPack.thresholdBytes}
							onChange={(value) => patch("observationPack", { thresholdBytes: value })}
						/>
						<NumberRow
							label={t("fullSends")}
							value={draft.observationPack.fullSends}
							onChange={(value) => patch("observationPack", { fullSends: value })}
						/>
						<NumberRow
							label={t("placeholderExcerptBytes")}
							value={draft.observationPack.placeholderExcerptBytes}
							onChange={(value) => patch("observationPack", { placeholderExcerptBytes: value })}
						/>
					</fieldset>

					<fieldset className={styles.fieldset}>
						<legend>{t("epr")}</legend>
						<p className={styles.help}>{t("eprHelp")}</p>
						<label className={styles.row}>
							<span>{t("enabled")}</span>
							<input
								type="checkbox"
								checked={draft.evidencePreservingReducer.enabled}
								onChange={(event) => patch("evidencePreservingReducer", { enabled: event.target.checked })}
							/>
						</label>
						<NumberRow
							label={t("minBytes")}
							value={draft.evidencePreservingReducer.minBytes}
							onChange={(value) => patch("evidencePreservingReducer", { minBytes: value })}
						/>
						<NumberRow
							label={t("maxChars")}
							value={draft.evidencePreservingReducer.maxChars}
							onChange={(value) => patch("evidencePreservingReducer", { maxChars: value })}
						/>
						<NumberRow
							label={t("maxOutputTokens")}
							value={draft.evidencePreservingReducer.maxOutputTokens}
							onChange={(value) => patch("evidencePreservingReducer", { maxOutputTokens: value })}
						/>
						<NumberRow
							label={t("timeoutMs")}
							value={draft.evidencePreservingReducer.timeoutMs}
							onChange={(value) => patch("evidencePreservingReducer", { timeoutMs: value })}
						/>
						<label className={styles.row}>
							<span>{t("reducerProvider")}</span>
							<input
								value={draft.evidencePreservingReducer.reducerProvider}
								onChange={(event) => patch("evidencePreservingReducer", { reducerProvider: event.target.value })}
							/>
						</label>
						<label className={styles.row}>
							<span>{t("reducerModel")}</span>
							<input
								value={draft.evidencePreservingReducer.reducerModel}
								onChange={(event) => patch("evidencePreservingReducer", { reducerModel: event.target.value })}
							/>
						</label>
						<p className={styles.help}>{t("reducerRouteHelp")}</p>
					</fieldset>

					<fieldset className={styles.fieldset}>
						<legend>{t("occ")}</legend>
						<p className={styles.help}>{t("occHelp")}</p>
						<label className={styles.row}>
							<span>{t("enabled")}</span>
							<input
								type="checkbox"
								checked={draft.onlineContextCompact.enabled}
								onChange={(event) => patch("onlineContextCompact", { enabled: event.target.checked })}
							/>
						</label>
						<NumberRow
							label={t("cacheWriteReadRatio")}
							value={draft.onlineContextCompact.cacheWriteReadRatio}
							step={0.1}
							onChange={(value) => patch("onlineContextCompact", { cacheWriteReadRatio: value })}
						/>
						<p className={styles.help}>{t("cacheWriteReadRatioHelp")}</p>
						<NumberRow
							label={t("keepRecentTokens")}
							value={draft.onlineContextCompact.keepRecentTokens}
							onChange={(value) => patch("onlineContextCompact", { keepRecentTokens: value })}
						/>
						<p className={styles.help}>{t("keepRecentTokensHelp")}</p>
						<NumberRow
							label={t("nativeSummaryTokenEstimate")}
							value={draft.onlineContextCompact.nativeSummaryTokenEstimate}
							onChange={(value) => patch("onlineContextCompact", { nativeSummaryTokenEstimate: value })}
						/>
						<NumberRow
							label={t("windowReserveTokens")}
							value={draft.onlineContextCompact.windowReserveTokens}
							onChange={(value) => patch("onlineContextCompact", { windowReserveTokens: value })}
						/>
						<NumberRow
							label={t("firstCompactionRequestScale")}
							value={draft.onlineContextCompact.firstCompactionRequestScale}
							step={0.1}
							onChange={(value) => patch("onlineContextCompact", { firstCompactionRequestScale: value })}
						/>
						<NumberRow
							label={t("subsequentCompactionMargin")}
							value={draft.onlineContextCompact.subsequentCompactionMargin}
							step={0.1}
							onChange={(value) => patch("onlineContextCompact", { subsequentCompactionMargin: value })}
						/>
					</fieldset>

					{error ? <p className={styles.error}>{error}</p> : null}
					<footer className={styles.footer}>
						<button
							type="button"
							disabled={discardDisabled}
							onClick={() => {
								setDraft(cloneConfig(loaded));
								setError(undefined);
							}}
						>
							{t("discard")}
						</button>
						<button
							type="button"
							disabled={saving}
							onClick={() => setDraft(cloneConfig(DEFAULT_SOL_DSH_CONFIG))}
						>
							{t("reset")}
						</button>
						<button type="submit" disabled={saveDisabled}>
							{saving ? t("saving") : t("save")}
						</button>
					</footer>
				</form>
			) : null}
		</section>
	);
}

function NumberRow(props: {
	readonly label: string;
	readonly value: number;
	readonly step?: number;
	readonly onChange: (value: number) => void;
}) {
	return (
		<label className={styles.row}>
			<span>{props.label}</span>
			<input
				type="number"
				step={props.step ?? 1}
				value={props.value}
				onChange={(event) => props.onChange(Number(event.target.value))}
			/>
		</label>
	);
}
