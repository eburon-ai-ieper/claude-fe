// Frontend-only synthetic analytics helpers.
// Used to generate demo metrics like "minutes used" without a backend field.

import type { Organization } from "@/types/superadmin";

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSyntheticMinutesForOrganization(org: Organization): number {
  const base = hashString(org.id || org.name || "org");
  // Map hash into a readable range of minutes, e.g. 120–12_000 min
  const minutes = 120 + (base % 12000);
  return minutes;
}


