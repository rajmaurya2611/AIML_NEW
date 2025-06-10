// src/apps/legallens/oktaConfig.ts
import { OktaAuth } from "@okta/okta-auth-js";

export const oktaAuthLegal = new OktaAuth({
  issuer:   import.meta.env.VITE_LEGAL_OKTA_ISSUER!,
  clientId: import.meta.env.VITE_LEGAL_OKTA_CLIENT_ID!,
  redirectUri: `${window.location.origin}/login/callback`,
  scopes: ["openid", "profile", "email"],
  tokenManager: { storage: "sessionStorage" },  // or "localStorage"
});

// DEBUG – expose it for one test run
// @ts-ignore
window.oktaAuthLegal = oktaAuthLegal;