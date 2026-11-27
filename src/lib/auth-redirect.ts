export function safeInternalPath(value: string | null): string | null {
  if (!value?.startsWith('/') || /[\\\u0000-\u0020\u007f]/.test(value)) return null;

  const origin = 'https://internal.invalid';
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || /^\/(?:\/|%2f|%5c)/i.test(url.pathname)) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
