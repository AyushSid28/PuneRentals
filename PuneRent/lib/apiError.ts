export class ApiError extends Error {
  status: number;
  friendlyMessage: string;
  constructor(message: string, status = 500, friendlyMessage = 'Something went wrong.') {
    super(message);
    this.status = status;
    this.friendlyMessage = friendlyMessage;
  }
}

/**
 * Map Supabase/Postgres errors to user‑friendly messages.
 */
export function handleSupabaseError(err: any): ApiError {
  const msg = err?.message ?? '';
  // Known column‑missing error
  if (msg.includes('column "source" of relation "societies" does not exist')) {
    return new ApiError(msg, 400, 'Unable to save rent data – please try again later.');
  }
  // Generic fallback
  return new ApiError(msg, 500, 'Unexpected server error. Please try again later.');
}
