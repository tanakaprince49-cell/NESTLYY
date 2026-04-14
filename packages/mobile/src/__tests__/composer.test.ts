// Pure-function tests for validatePost (#266).

import { validatePost } from '../utils/postValidation';

describe('#266 validatePost', () => {
  test('empty string rejects', () => {
    expect(validatePost('').ok).toBe(false);
  });

  test('whitespace-only rejects', () => {
    expect(validatePost('   ').ok).toBe(false);
    expect(validatePost('\n\t').ok).toBe(false);
  });

  test('500 character string accepts', () => {
    const text = 'a'.repeat(500);
    const result = validatePost(text);
    expect(result.ok).toBe(true);
    expect(result.trimmed).toBe(text);
  });

  test('leading and trailing whitespace is trimmed', () => {
    const result = validatePost('  hello  ');
    expect(result.ok).toBe(true);
    expect(result.trimmed).toBe('hello');
  });

  test('trimmed field matches trimmed content when valid', () => {
    const result = validatePost('  test post  ');
    expect(result.trimmed).toBe('test post');
  });

  test('trimmed field is empty string when rejected', () => {
    const result = validatePost('   ');
    expect(result.trimmed).toBe('');
  });
});
