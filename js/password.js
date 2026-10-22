// Password rules. These functions do not touch the DOM, so the page (main.js) and the tests share them.

const CHARACTER_GROUPS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
};

// Return an error message, or null when the settings can produce a password.
function validateSettings({ length, types }) {
  if (!Number.isInteger(length) || length < 1) {
    return 'Password length must be a whole number of at least 1.';
  }
  if (types.length === 0) {
    // Do not add a character type the user has not selected.
    return 'Select at least one character type.';
  }
  if (length < types.length) {
    return `Password length must be at least ${types.length} to include each selected character type.`;
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

// Return 0 (TOO WEAK) to 3 (STRONG) from the length and the number of character types.
function getStrengthLevel(password) {
  const types = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((pattern) =>
    pattern.test(password),
  ).length;
  if (password.length >= 16 && types === 4) return 3;
  if (password.length >= 12 && types >= 3) return 2;
  if (password.length >= 8 && types >= 2) return 1;
  return 0;
}

// Export for Node tests. In the browser these remain globals used by main.js.
if (typeof module === 'object' && module.exports) {
  module.exports = {
    CHARACTER_GROUPS,
    validateSettings,
    generatePassword,
    getStrengthLevel,
  };
}
