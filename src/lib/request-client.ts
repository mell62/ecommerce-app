import { isIP } from "node:net";

type ClientEnvironment = Readonly<{
  VERCEL?: string;
}>;

function getFirstValidAddress(value: string | null): string | null {
  const address = value?.split(",")[0]?.trim() ?? "";

  return isIP(address) ? address : null;
}

export function getClientAddress(
  request: Request,
  environment: ClientEnvironment = { VERCEL: process.env.VERCEL }
): string {
  if (environment.VERCEL === "1") {
    return (
      getFirstValidAddress(
        request.headers.get("x-vercel-forwarded-for")
      ) ?? "unknown-client"
    );
  }

  const realIp = getFirstValidAddress(request.headers.get("x-real-ip"));

  if (realIp) {
    return realIp;
  }

  const forwardedIp = getFirstValidAddress(
    request.headers.get("x-forwarded-for")
  );

  return forwardedIp || "unknown-client";
}
