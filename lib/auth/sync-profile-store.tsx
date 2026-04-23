import { useUser } from '@clerk/expo';
import { useEffect } from 'react';

import { setProfileStoreUser } from '@/store/profile-store';

export function ProfileStoreUserSync() {
  const { user } = useUser();
  useEffect(() => {
    setProfileStoreUser(user?.id);
  }, [user?.id]);
  return null;
}
