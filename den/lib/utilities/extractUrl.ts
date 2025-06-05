export const extractUrl = (value?: string | string[]): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;

  try {
    const parsed = JSON.parse(value.trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {
    // not JSON, return as-is
  }

  return value.trim();
};