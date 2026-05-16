export type ApiError = { error: string };

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : ({} as any);
  if (!res.ok) {
    const msg = (data as ApiError)?.error ?? `Request failed (${res.status})`;
    throw new HttpError(res.status, msg);
  }
  return data as T;
}
