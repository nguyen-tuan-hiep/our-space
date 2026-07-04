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

export async function getDailyLoveQuote(timeZone: string): Promise<LoveQuote> {
  const dayKey = getDayKey(new Date(), timeZone);
  return getFallbackQuote(dayKey);
}
