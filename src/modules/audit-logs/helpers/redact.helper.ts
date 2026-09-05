const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'password_hash',
  'hash',
  'refreshtoken',
  'refresh_token',
  'token',
  'accesstoken',
  'access_token',
  'secret',
];

// Matches typical Myanmar NRC: e.g. "12/ABC(N)123456" or "9/DEF(N)789012"
const NRC_PATTERN = /^\d{1,2}\/[A-Za-z-]+\s*\(\s*[A-Za-z]\s*\)\s*\d+$/;

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (NRC_PATTERN.test(value)) {
      return `***${value.slice(-4)}`;
    }
    return '***';
  }
  return '***';
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYS.some(
    (k) => normalized === k || normalized.endsWith(k),
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

export function redactSensitiveData(
  data?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!data) return null;

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const sensitiveKey = isSensitiveKey(key);

    if (sensitiveKey) {
      redacted[key] = redactValue(value);
    } else if (typeof value === 'string' && NRC_PATTERN.test(value)) {
      // Redact full NRC/passport numbers stored under any key (e.g. nrcOrPassport,
      // driverNrc, nrcOrLicense) to the last 4 chars.
      redacted[key] = `***${value.slice(-4)}`;
    } else if (isPlainObject(value)) {
      redacted[key] = redactSensitiveData(value);
    } else if (Array.isArray(value)) {
      redacted[key] = value.map((item) =>
        isPlainObject(item) ? redactSensitiveData(item) : item,
      );
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
