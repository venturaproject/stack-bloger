export function buildProtectedAvatarUrl(filename: string): string {
  return `/api/v1/settings/avatar/${filename}`;
}

export function normalizeAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  const legacyPrefix = '/avatars/';
  return avatar.startsWith(legacyPrefix)
    ? buildProtectedAvatarUrl(avatar.slice(legacyPrefix.length))
    : avatar;
}
