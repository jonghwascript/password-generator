const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  CHARACTER_GROUPS,
  validateSettings,
  generatePassword,
  getStrengthLevel,
} = require('../js/password.js');

const ALL_TYPES = Object.keys(CHARACTER_GROUPS);

test('validateSettings accepts a length that fits every selected type', () => {
  assert.equal(validateSettings({ length: 4, types: ALL_TYPES }), null);
  assert.equal(validateSettings({ length: 1, types: ['numbers'] }), null);
});

test('validateSettings rejects lengths that are not whole numbers of at least 1', () => {
  for (const length of [0, -1, 1.5, NaN]) {
    assert.match(
      validateSettings({ length, types: ['lowercase'] }),
      /whole number of at least 1/,
    );
  }
});

test('validateSettings requires at least one character type', () => {
  assert.match(
    validateSettings({ length: 10, types: [] }),
    /Select at least one character type/,
  );
});

test('validateSettings requires room for one character of each type', () => {
  assert.match(validateSettings({ length: 3, types: ALL_TYPES }), /at least 4/);
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

test('getStrengthLevel maps length and character types to the four labels', () => {
  const cases = [
    ['abcdefghijklmnopqrst', 0], // one type: TOO WEAK!
    ['abcdEFGH', 1], // 8 characters, 2 types: WEAK
    ['abcdEFGH1234', 2], // 12 characters, 3 types: MEDIUM
    ['abcdEFGH1234!@#$', 3], // 16 characters, 4 types: STRONG
    ['aB3$aB3$', 1], // 8 characters, 4 types: WEAK
  ];
  for (const [password, level] of cases) {
    assert.equal(getStrengthLevel(password), level, password);
  }
});
