type ApplicationEnvironment = Readonly<{
  NODE_ENV?: string;
  NEXT_PUBLIC_BASE_URL?: string;
}>;

function isLocalHttpUrl(url: URL): boolean {
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

export function getApplicationOrigin(
  requestUrl: string,
  environment: ApplicationEnvironment = process.env
): string {
  const configuredUrl = environment.NEXT_PUBLIC_BASE_URL?.trim();

  if (!configuredUrl) {
    if (environment.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_BASE_URL is required in production.");
    }

    return new URL(requestUrl).origin;
  }

  const applicationUrl = new URL(configuredUrl);
  const isAllowedDevelopmentUrl =
    environment.NODE_ENV !== "production" && isLocalHttpUrl(applicationUrl);

  if (applicationUrl.protocol !== "https:" && !isAllowedDevelopmentUrl) {
    throw new Error("The application URL must use HTTPS in production.");
  }

  if (applicationUrl.username || applicationUrl.password) {
    throw new Error("The application URL must not contain credentials.");
  }

  return applicationUrl.origin;
}
