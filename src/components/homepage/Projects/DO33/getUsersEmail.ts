// src/apps/knowledge/getUserEmail.ts
import { oktaAuthDO33 } from "./oktaConfigDO33";

/** Module-level cache – survives while the tab stays on your SPA */
let cachedEmail: string | null = null;

/*  ❶  Clear the cache automatically
       This fires when the user logs out, the tokens are programmatically
       cleared, or a renew attempt fails and the SDK purges its store. */
oktaAuthDO33.tokenManager.on("removed", () => {
  cachedEmail = null;
});

/** ❷  Returns the current user's e-mail, fetching it once per tab. */
export async function getUserEmail(): Promise<string> {
  if (cachedEmail) return cachedEmail;             // fast path

  // /userinfo call – one HTTPS round-trip the first time
  const { email } = await oktaAuthDO33.getUser();     // { email, sub, name, … }

  if (!email) throw new Error("Email claim missing on Okta profile");
  cachedEmail = email;
  return email;
}
