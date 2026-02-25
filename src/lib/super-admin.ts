// Super admin email — only this user can access architecture & flowchart docs
export const SUPER_ADMIN_EMAIL = 'sumanthskori7@gmail.com';

export const isSuperAdmin = (email?: string | null): boolean => {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};
