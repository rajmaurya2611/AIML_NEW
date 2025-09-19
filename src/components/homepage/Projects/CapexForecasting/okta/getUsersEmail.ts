import { oktaAuthCapex } from "./oktaConfigCapex";
// ^ adjust to your real relative path; the point is: import the SAME instance

let cachedEmail: string | null = null;

oktaAuthCapex.tokenManager.on("removed", () => {
  cachedEmail = null;
});

export async function getUserEmail(): Promise<string> {
  if (cachedEmail) return cachedEmail;
  const { email } = await oktaAuthCapex.getUser();
  if (!email) throw new Error("Email claim missing on Okta profile");
  cachedEmail = email;
  return email;
}
