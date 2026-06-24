"use client";

import { avatarEmojis, isAvatarKey } from "@/lib/constants";

interface AvatarIconProps {
  value: string | null;
  label: string;
  className?: string;
}

export function AvatarIcon({ value, label, className }: AvatarIconProps) {
  const avatar = value && isAvatarKey(value) ? avatarEmojis[value] : null;
  const customEmoji = value && !avatar ? value : null;

  return (
    <span
      className={
        className ??
        "grid size-10 place-items-center rounded-full bg-white/15 text-xl text-white"
      }
      title={label}
      aria-label={avatar?.label ?? label}
    >
      {avatar?.emoji ?? customEmoji ?? "🙂"}
    </span>
  );
}
