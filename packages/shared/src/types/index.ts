export type ApiSuccess<T> = { data: T };
export type ApiFailure = { error: { message: string; code: string; details?: unknown } };
