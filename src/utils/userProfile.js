// Name and photo for a Supabase user. Google sign-in fills user_metadata; email sign-up does not.
export const displayNameFor = (user) => {
  const meta = user?.user_metadata || {};
  return meta.full_name || meta.name || user?.email?.split('@')[0] || 'Athlete';
};

export const avatarUrlFor = (user) => {
  const meta = user?.user_metadata || {};
  return meta.avatar_url || meta.picture || null;
};
