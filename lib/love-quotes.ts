import type { LoveQuote } from "@/lib/types";

const quoteMaxAgeSeconds = 24 * 60 * 60;

const fallbackQuotes: LoveQuote[] = [
  {
    text: "Love is composed of a single soul inhabiting two bodies.",
    author: "Aristotle",
    source: "fallback",
  },
  {
    text: "Where there is love there is life.",
    author: "Mahatma Gandhi",
    source: "fallback",
  },
  {
    text: "The best thing to hold onto in life is each other.",
    author: "Audrey Hepburn",
    source: "fallback",
  },
  {
    text: "Love recognizes no barriers.",
    author: "Maya Angelou",
    source: "fallback",
  },
  {
    text: "We loved with a love that was more than love.",
    author: "Edgar Allan Poe",
    source: "fallback",
  },
];

type QuoteApiPayload = {
  content?: unknown;
  quote?: unknown;
  q?: unknown;
  text?: unknown;
  author?: unknown;
  a?: unknown;
};

function getDayKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getFallbackQuote(dayKey: string) {
  const dayIndex = Number(dayKey.replaceAll("-", ""));

  return fallbackQuotes[Math.abs(dayIndex) % fallbackQuotes.length];
}

function getDailyQuoteUrl(quoteUrl: string, dayKey: string) {
  const url = new URL(quoteUrl);
  url.searchParams.set("daily_key", dayKey);

  return url.toString();
}

function normalizeQuote(payload: QuoteApiPayload): LoveQuote | null {
  const text =
    typeof payload.content === "string"
      ? payload.content
      : typeof payload.quote === "string"
        ? payload.quote
        : typeof payload.q === "string"
          ? payload.q
          : typeof payload.text === "string"
            ? payload.text
            : null;

  if (!text?.trim()) return null;

  const author =
    typeof payload.author === "string"
      ? payload.author
      : typeof payload.a === "string"
        ? payload.a
        : null;

  return {
    text: text.trim(),
    author: author?.trim() || null,
    source: "api",
  };
}

export async function getDailyLoveQuote(timeZone: string): Promise<LoveQuote> {
  const dayKey = getDayKey(new Date(), timeZone);
  const quoteUrl =
    process.env.LOVE_QUOTE_API_URL ??
    "https://api.quotable.io/random?tags=love";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 700);

  try {
    const response = await fetch(getDailyQuoteUrl(quoteUrl, dayKey), {
      signal: controller.signal,
      next: { revalidate: quoteMaxAgeSeconds },
    });

    if (!response.ok) return getFallbackQuote(dayKey);

    const payload = (await response.json()) as QuoteApiPayload | QuoteApiPayload[];
    const quote = Array.isArray(payload)
      ? normalizeQuote(payload[0] ?? {})
      : normalizeQuote(payload);

    return quote ?? getFallbackQuote(dayKey);
  } catch {
    return getFallbackQuote(dayKey);
  } finally {
    clearTimeout(timeout);
  }
}