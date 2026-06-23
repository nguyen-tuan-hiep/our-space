"use client";

import {
  Camera,
  Coffee,
  Clapperboard,
  Crown,
  Flower2,
  Gamepad2,
  Gem,
  Heart,
  Music2,
  Moon,
  Plane,
  Pizza,
  SmilePlus,
  Sparkles,
  Star,
  Sun,
  UserRound,
} from "lucide-react";
import type { AvatarKey } from "@/lib/constants";
import { avatarStyles, isAvatarKey } from "@/lib/constants";

const icons = {
  heart: Heart,
  sparkles: Sparkles,
  camera: Camera,
  coffee: Coffee,
  plane: Plane,
  flower: Flower2,
  moon: Moon,
  sun: Sun,
  music: Music2,
  crown: Crown,
  gem: Gem,
  star: Star,
  smile: SmilePlus,
  gamepad: Gamepad2,
  movie: Clapperboard,
  pizza: Pizza,
} satisfies Record<AvatarKey, typeof Heart>;

interface AvatarIconProps {
  value: string | null;
  label: string;
  className?: string;
  iconClassName?: string;
}

export function AvatarIcon({
  value,
  label,
  className,
  iconClassName,
}: AvatarIconProps) {
  const key = value && isAvatarKey(value) ? value : null;
  const Icon = key ? icons[key] : UserRound;
  const style = key ? avatarStyles[key].className : "bg-white/15 text-white";

  return (
    <span
      className={className ?? `grid size-10 place-items-center rounded-full ${style}`}
      title={label}
      aria-label={label}
    >
      <Icon size={20} strokeWidth={1.8} className={iconClassName} />
    </span>
  );
}
