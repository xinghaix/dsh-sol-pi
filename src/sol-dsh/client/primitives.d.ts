declare module "@deepseek-ai/dsh-client-ui-primitives" {
	import type { CSSProperties, ReactNode } from "react";

	export type TagTone = "neutral" | "brand" | "success" | "warn" | "error";

	export function Tag(props: {
		tone?: TagTone;
		className?: string;
		style?: CSSProperties;
		children?: ReactNode;
	}): ReactNode;

	export function Switch(props: {
		checked: boolean;
		label: string;
		disabled?: boolean;
		onChange: (checked: boolean) => void;
		className?: string;
	}): ReactNode;

	export function IconChevronDownOutline14(props: {
		className?: string;
		style?: CSSProperties;
	}): ReactNode;

	export type MenuItem = {
		id: string;
		label: string;
		disabled?: boolean;
	};

	export function Menu(props: {
		open: boolean;
		onClose: () => void;
		items: readonly MenuItem[];
		selectedId?: string | null;
		onSelect: (id: string) => void;
		align?: "start" | "end";
		portal?: boolean;
		anchor: ReactNode;
	}): ReactNode;
}
