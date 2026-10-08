export function buildProtectedAvatarUrl(filename: string): string {
  return `/api/v1/settings/avatar/${filename}`;
}

export function normalizeAvatarUrl(avatar: string | null | undefined): string | null {
  if (!avatar) {
    return null;
  }

  const legacyPrefix = '/avatars/';
  if (avatar.startsWith(legacyPrefix)) {
    return buildProtectedAvatarUrl(avatar.slice(legacyPrefix.length));
  }

  return avatar;
}
