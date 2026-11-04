const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  CHARACTER_GROUPS,
  validateSettings,
  generatePassword,
  getEntropy,
  getStrengthLevel,
} = require('../js/password.js');

const ALL_TYPES = Object.keys(CHARACTER_GROUPS);

test('validateSettings accepts a length that fits every selected type', () => {
  assert.equal(validateSettings({ length: 4, types: ALL_TYPES }), null);
  assert.equal(validateSettings({ length: 1, types: ['numbers'] }), null);
});

test('validateSettings rejects lengths that are not whole numbers of at least 1', () => {
  for (const length of [0, -1, 1.5, NaN]) {
    const error = validateSettings({ length, types: ['lowercase'] });
    assert.equal(error.field, 'length');
    assert.match(error.message, /whole number of at least 1/);
  }
});

test('validateSettings requires at least one character type', () => {
  const error = validateSettings({ length: 10, types: [] });
  assert.equal(error.field, 'types');
  assert.match(error.message, /Select at least one character type/);
});

test('validateSettings requires room for one character of each type', () => {
  const error = validateSettings({ length: 3, types: ALL_TYPES });
  assert.equal(error.field, 'length');
  assert.match(error.message, /at least 4/);
});

test('generatePassword uses only selected types and includes each of them', () => {
  const combinations = [['uppercase'], ['numbers', 'symbols'], ALL_TYPES];
  for (const types of combinations) {
    const groups = types.map((type) => CHARACTER_GROUPS[type]);
    const pool = groups.join('');
    for (let length = types.length; length <= 20; length++) {
      for (let run = 0; run < 20; run++) {
        const chars = [...generatePassword(length, groups)];
        assert.equal(chars.length, length);
        assert.ok(chars.every((char) => pool.includes(char)));
        assert.ok(
          groups.every((group) => chars.some((char) => group.includes(char))),
        );
      }
    }
  }
});

test('getEntropy multiplies length by log2 of the pool of used groups', () => {
  assert.equal(getEntropy(''), 0);
  assert.equal(getEntropy('a'.repeat(10)), 10 * Math.log2(26));
  assert.equal(getEntropy('aA1!'), 4 * Math.log2(26 + 26 + 10 + 29));
});

test('getStrengthLevel maps entropy to the four labels', () => {
  const cases = [
    ['abcde', 0], // 23.5 bits: TOO WEAK!
    ['abcdefgh', 1], // 37.6 bits: WEAK
    ['abcdefghijklm', 2], // 61.1 bits: MEDIUM
    ['abcdefghijklmnopqrst', 3], // 94.0 bits: STRONG
    ['aB3$aB3$', 1], // 52.1 bits: WEAK
    ['aB3$aB3$aB3$a', 3], // 84.6 bits: STRONG
  ];
  for (const [password, level] of cases) {
    assert.equal(getStrengthLevel(password), level, password);
  }
});
