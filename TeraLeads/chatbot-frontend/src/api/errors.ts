import { AxiosError } from 'axios'

/** The backend's `{ error }` message when there is one, else the fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as { error?: string } | undefined
    return body?.error || fallback
  }
  return fallback
}
