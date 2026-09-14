export function isSameOriginRequest(request: Request): boolean {
  const originHeader = request.headers.get("origin");

  if (!originHeader || originHeader === "null") {
    return false;
  }

  try {
    return new URL(originHeader).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
