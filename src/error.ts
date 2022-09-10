export const isError = (
  maybeError: any,
): maybeError is { err: string; code: number } =>
  typeof maybeError === "object" &&
  maybeError.hasOwnProperty("err") &&
  maybeError.hasOwnProperty("code") &&
  typeof maybeError.err === "string" &&
  typeof maybeError.code === "number";

export const ErrorEntityNotFound = { err: "Entity not found", code: 404 };
