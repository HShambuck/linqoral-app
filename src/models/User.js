// src/models/User.js

/**
 * Generates initials from a name
 * @param {string} name
 * @returns {string}
 */
export const generateInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

/**
 * Creates a default user object
 * @returns {Object}
 */
export const createDefaultUser = () => ({
  id: '',
  displayName: '',
  initials: '',
  preferredTone: 'Professional',
  isDarkMode: true,
  linkedInConnected: false,
  linkedIn: { connected: false },
  stats: {
    totalDrafts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
  },
  createdAt: new Date(),
  lastActiveAt: new Date(),
});

/**
 * Creates a user object with provided data
 * @param {Object} params
 * @returns {Object}
 */
export const createUser = ({
  id = '',
  displayName = '',
  initials = '',
  preferredTone = 'Professional',
  isDarkMode = true,
  linkedInConnected = false,
  linkedIn = { connected: false },
  stats = null,
}) => ({
  id,
  displayName,
  initials: initials || generateInitials(displayName),
  preferredTone,
  isDarkMode,
  linkedInConnected,
  linkedIn: linkedIn || { connected: false },
  stats: stats || {
    totalDrafts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
  },
  createdAt: new Date(),
  lastActiveAt: new Date(),
});

/**
 * Updates user stats
 * @param {Object} user
 * @param {Object} newStats
 * @returns {Object}
 */
export const updateUserStats = (user, newStats) => ({
  ...user,
  stats: {
    ...user.stats,
    ...newStats,
  },
  lastActiveAt: new Date(),
});