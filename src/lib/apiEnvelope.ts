export function successEnvelope<T>(data: T) {
  return { ok: true as const, data };
}

export function errorEnvelope(code: string, message: string) {
  return { ok: false as const, error: { code, message } };
}
