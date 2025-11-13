// src/apps/knowledge/getUserEmail.ts
import { oktaAuthYachiyo } from "./oktaConfigYachiyo";


interface UserProfile {
  name: string;
  given_name:string;
  email: string;
  picture?: string;
  role?: string;
  [key: string]: any; // allows any extra fields from Okta
}

/*  ❶  Clear the cache automatically
       This fires when the user logs out, the tokens are programmatically
       cleared, or a renew attempt fails and the SDK purges its store. */
// Module-level cache for email (cleared when Okta tokens are removed)
oktaAuthYachiyo.tokenManager.on("removed", () => {
  // Cache clearing logic here when function is uncommented
});

/** ❷  Returns the current user's e-mail, fetching it once per tab. */
// export async function getUserEmail(): Promise<string> {
//   if (cachedEmail) return cachedEmail;             // fast path

//   // /userinfo call – one HTTPS round-trip the first time
//   const { email } = await oktaAuthYachiyo.getUser();     // { email, sub, name, … }

//   if (!email) throw new Error("Email claim missing on Okta profile");
//   cachedEmail = email;
//   return email;
// }

/** Cache for the user object within current tab session */
let cachedUser: UserProfile | null = null;

export async function getUserProfile(): Promise<UserProfile> {
  if (cachedUser) return cachedUser; // return cached profile quickly

  const user: Record<string, any> = await oktaAuthYachiyo.getUser();

  if (!user?.email || !user?.name) {
    throw new Error("Missing required user fields (name or email)");
  }

  cachedUser = {
    name: user.name,
    given_name:user.given_name,
    email: user.email,
    picture: user.picture, // optional
    role: user.role || user.groups?.[0], // example if role is stored in groups
    ...user, // keep all other Okta claims
  };

  return cachedUser;
}