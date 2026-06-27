import type { Profile } from "@/lib/types";

export function getCoupleSettingsId(
  profile: Pick<Profile, "id">,
  partner: Pick<Profile, "id">,
) {
  return `couple:${[profile.id, partner.id].sort().join(":")}`;
}
