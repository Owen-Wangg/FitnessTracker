// Name and photo for a Supabase user. Google sign-in fills user_metadata; email sign-up does not.
import type { User } from '@supabase/supabase-js';

// Only the parts of a Supabase user these helpers read.
export type UserLike = Partial<Pick<User, 'email' | 'user_metadata'>>;

export const displayNameFor = (user: UserLike | null | undefined): string => {
  const meta = user?.user_metadata || {};
  return meta.full_name || meta.name || user?.email?.split('@')[0] || 'Athlete';
};

export const avatarUrlFor = (user: UserLike | null | undefined): string | null => {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || null;
};
