/** Rough reading time for a note; short notes still read as one minute. */
export function formatReadingTime(content: string) {
	const words = content.trim().split(/\s+/).filter(Boolean).length;
	return `${Math.max(1, Math.round(words / 200))} min read`;
}

/**
 * A note is a new letter for the recipient until they open it. `read_at` is
 * undefined before the migration runs, which counts as read so nothing changes.
 */
export function isUnreadLetter(note: { recipient_id: string; read_at?: string | null }, userId: string) {
	return note.recipient_id === userId && note.read_at === null;
}
