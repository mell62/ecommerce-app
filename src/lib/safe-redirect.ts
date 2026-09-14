const redirectValidationOrigin = "https://zeus.invalid";

export function getSafeInternalRedirect(
  requestedRedirect: string | null | undefined,
  fallback = "/"
): string {
  if (!requestedRedirect?.startsWith("/")) {
    return fallback;
  }

  try {
    const decodedRedirect = decodeURIComponent(requestedRedirect);

    if (
      decodedRedirect.startsWith("//") ||
      decodedRedirect.includes("\\")
    ) {
      return fallback;
    }

    const redirectUrl = new URL(requestedRedirect, redirectValidationOrigin);

    return redirectUrl.origin === redirectValidationOrigin
      ? requestedRedirect
      : fallback;
  } catch {
    return fallback;
  }
}
