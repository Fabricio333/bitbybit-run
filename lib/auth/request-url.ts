export function publicRequestUrl(inputUrl: string, headers: Headers): string {
  const url = new URL(inputUrl);
  const forwardedHost = headers.get("x-forwarded-host") ?? headers.get("host");
  const forwardedProto = headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const publicHost = forwardedHost.split(",")[0]?.trim();
    if (publicHost) {
      url.host = publicHost;
      if (!publicHost.includes(":")) {
        url.port = "";
      }
    }
  }
  if (forwardedProto) {
    url.protocol = `${forwardedProto.split(",")[0]?.trim() || url.protocol.replace(":", "")}:`;
  }

  return url.toString();
}
