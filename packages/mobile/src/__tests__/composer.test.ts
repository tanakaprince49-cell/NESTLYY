// Pure-function tests for validatePost (#266, updated for #270).

import { validatePost } from '../utils/postValidation';

describe('#266 validatePost -- text only', () => {
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

describe('#270 validatePost -- media-only posts', () => {
  test('empty text with mediaCount 0 rejects', () => {
    expect(validatePost('', 0).ok).toBe(false);
  });

  test('empty text with mediaCount 1 accepts', () => {
    expect(validatePost('', 1).ok).toBe(true);
  });

  test('whitespace text with mediaCount 1 accepts', () => {
    expect(validatePost('   ', 1).ok).toBe(true);
  });

  test('empty text with mediaCount 4 accepts', () => {
    expect(validatePost('', 4).ok).toBe(true);
  });

  test('trimmed is empty string for media-only post', () => {
    const result = validatePost('', 2);
    expect(result.trimmed).toBe('');
  });
});

describe('#270 validatePost -- text + media', () => {
  test('text with mediaCount accepts', () => {
    expect(validatePost('Hello!', 1).ok).toBe(true);
    expect(validatePost('Hello!', 1).trimmed).toBe('Hello!');
  });

  test('text alone without media still accepts', () => {
    expect(validatePost('Just text').ok).toBe(true);
  });
});
