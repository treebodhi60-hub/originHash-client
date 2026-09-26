// The profile details whose history admins can see (see backend utils/profileHistory.js).
export const PROFILE_FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  address: 'Address',
  userType: 'User type',
  mobile: 'Mobile',
};

export const formatProfileValue = (field, value) => {
  if (!value) return '—';
  if (field === 'mobile') return `+91 ${value}`;
  if (field === 'userType') return value.charAt(0).toUpperCase() + value.slice(1);
  return value;
};
