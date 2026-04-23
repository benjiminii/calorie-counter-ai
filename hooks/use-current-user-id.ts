import { useUser } from '@clerk/expo';

import { useProfileStore } from '@/store/profile-store';

export function useCurrentUserId(): string | null {
  const { user } = useUser();
  const isGuest = useProfileStore((s) => s.isGuest);
  if (user?.id) return user.id;
  if (isGuest) return 'guest';
  return null;
}
