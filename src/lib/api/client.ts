"use client";
import {
  ApiError,
  apiFetch,
  type ApiFetchOptions,
} from "@/lib/auth/api-client";
import { refreshSession } from "@/lib/auth/auth-service";
import { clearSession, getAccessToken } from "@/lib/auth/session";
/** A single retry, shared refresh rotation, never replay refresh/login itself. */
export async function request<T>(
  path: string,
  parse: (data: unknown) => T,
  options: Omit<ApiFetchOptions, "token"> = {},
): Promise<T> {
  const token = getAccessToken();
  try {
    return parse(await apiFetch(path, { ...options, token }));
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
    if (options.signal?.aborted)
      throw new DOMException("Cancelled", "AbortError");
    // Another request may already have rotated the token while this 401 was in flight.
    if (getAccessToken() === token && !(await refreshSession())) throw error;
    try {
      return parse(
        await apiFetch(path, { ...options, token: getAccessToken() }),
      );
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.statusCode === 401)
        clearSession();
      throw retryError;
    }
  }
}
