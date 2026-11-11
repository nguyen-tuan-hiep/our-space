import { formatAppDateTime } from "@/lib/date-format";
import type { DateStyleId } from "@/lib/note-style";

/** Presentation only: the stored creation time never changes. */
export function formatNoteDate(value: string | Date, timeZone: string, style: DateStyleId) {
	if (style === "hidden") return null;
	if (style === "classic") return formatAppDateTime(value, timeZone);
	const date = new Date(value);
	if (style === "minimal") {
		return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone }).format(date);
	}
	if (style === "postmark") {
		return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone }).format(date).toUpperCase();
	}
	return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone }).format(date);
}
