// Resolve only local destinations; browsers normalize backslashes as slashes.
export function safeAuthNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  for (const char of value) if (char.charCodeAt(0) < 32) return '/';
  const base = 'https://oars.invalid';
  try { const url = new URL(value, base); return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : '/'; } catch { return '/'; }
}
