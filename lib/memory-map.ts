import type { MemoryType } from "@/lib/types";

export const memoryTypeOptions: Array<{
  value: MemoryType;
  label: string;
  emoji: string;
}> = [
  { value: "date", label: "Date", emoji: "💞" },
  { value: "food", label: "Food", emoji: "🍜" },
  { value: "trip", label: "Trip", emoji: "🧳" },
  { value: "anniversary", label: "Anniversary", emoji: "💍" },
  { value: "photo", label: "Photo", emoji: "📸" },
  { value: "milestone", label: "Milestone", emoji: "⭐" },
  { value: "other", label: "Other", emoji: "📍" },
];

export function getMemoryTypeOption(memoryType: MemoryType) {
  return (
    memoryTypeOptions.find((option) => option.value === memoryType) ??
    memoryTypeOptions[memoryTypeOptions.length - 1]
  );
}
