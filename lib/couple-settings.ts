import type { Profile } from "@/lib/types";

export function getCoupleId(
  profile: Pick<Profile, "id">,
  partner: Pick<Profile, "id">,
) {
  return [profile.id, partner.id].sort().join(":");
}
