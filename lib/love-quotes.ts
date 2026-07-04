import quotes from "@/lib/quotes.json";
import type { LoveQuote } from "@/lib/types";

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

type QuoteJsonPayload = {
  quoteText?: unknown;
  quoteAuthor?: unknown;
};

function normalizeQuote(payload: QuoteJsonPayload): LoveQuote | null {
  const text =
    typeof payload.quoteText === "string" ? payload.quoteText.trim() : "";

  if (!text) return null;

  const author =
    typeof payload.quoteAuthor === "string" && payload.quoteAuthor.trim()
      ? payload.quoteAuthor.trim()
      : null;

  return {
    text,
    author,
    source: "local",
  };
}

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

function getQuoteIndex(key: string, length: number) {
  let hash = 0;

  for (const character of key) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % length;
}

export function getDailyLoveQuote(timeZone: string): LoveQuote {
  const quoteList = quotes as QuoteJsonPayload[];
  const dayKey = getDayKey(new Date(), timeZone);
  const quote = normalizeQuote(quoteList[getQuoteIndex(dayKey, quoteList.length)]);

  return quote ?? fallbackQuotes[getQuoteIndex(dayKey, fallbackQuotes.length)];
}
