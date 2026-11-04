// Password rules. These functions do not touch the DOM, so the page (main.js) and the tests share them.

const CHARACTER_GROUPS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
};

// Minimum entropy in bits for WEAK, MEDIUM and STRONG. Anything lower is TOO WEAK.
// These are UI thresholds for randomly generated passwords, not a guarantee against real attacks.
const STRENGTH_THRESHOLDS = [36, 60, 80];

// Return null when the settings can produce a password, otherwise
// { field, message } where field is the control the message belongs to.
function validateSettings({ length, types }) {
  if (!Number.isInteger(length) || length < 1) {
    return {
      field: 'length',
      message: 'Password length must be a whole number of at least 1.',
    };
  }
  if (types.length === 0) {
    // Do not add a character type the user has not selected.
    return { field: 'types', message: 'Select at least one character type.' };
  }
  if (length < types.length) {
    return {
      field: 'length',
      message: `Password length must be at least ${types.length} to include each selected character type.`,
    };
  }
  return null;
}

// Select an index using cryptographic randomness without modulo bias.
function randomIndex(max) {
  const range = 2 ** 32;
  const limit = range - (range % max);
  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % max;
}

function generatePassword(length, groups) {
  const chars = groups.join('');
  // Include at least one character from each selected group.
  const password = groups.map((group) => group[randomIndex(group.length)]);
  while (password.length < length) {
    password.push(chars[randomIndex(chars.length)]);
  }

  // Use a Fisher–Yates shuffle to randomize required character positions.
  for (let i = password.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}

// Entropy of a random password: length × log2(size of the character pool).
// The pool is the sum of every character group that appears in the password.
function getEntropy(password) {
  const pool = Object.values(CHARACTER_GROUPS)
    .filter((group) => [...password].some((char) => group.includes(char)))
    .reduce((size, group) => size + group.length, 0);
  return pool > 1 ? password.length * Math.log2(pool) : 0;
}

// Return 0 (TOO WEAK) to 3 (STRONG).
function getStrengthLevel(password) {
  const entropy = getEntropy(password);
  return STRENGTH_THRESHOLDS.filter((bits) => entropy >= bits).length;
}

// Export for Node tests. In the browser these remain globals used by main.js.
if (typeof module === 'object' && module.exports) {
  module.exports = {
    CHARACTER_GROUPS,
    STRENGTH_THRESHOLDS,
    validateSettings,
    generatePassword,
    getEntropy,
    getStrengthLevel,
  };
}
