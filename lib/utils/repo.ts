/**
 * Convert a stored repoId (owner-repo) back into a display name.
 * The dashboard creates repoIds with `owner-repo` (single hyphen split),
 * so we restore on the FIRST hyphen only.
 */
export function repoIdToDisplayName(repoId: string | undefined | null): string {
  if (!repoId) return "repository";
  // First try splitting on first '-'
  const dashIdx = repoId.indexOf("-");
  if (dashIdx > 0) {
    return `${repoId.slice(0, dashIdx)}/${repoId.slice(dashIdx + 1)}`;
  }
  // Legacy underscore
  if (repoId.includes("_")) {
    const parts = repoId.split("_");
    return parts.slice(1).join("/") || repoId;
  }
  return repoId;
}

export function repoIdToOwnerAvatar(repoId: string | undefined | null): string | null {
  if (!repoId) return null;
  const dashIdx = repoId.indexOf("-");
  const owner = dashIdx > 0 ? repoId.slice(0, dashIdx) : repoId;
  if (!owner) return null;
  return `https://github.com/${owner}.png?size=80`;
}
