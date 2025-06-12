// src/apps/legallens/oktaConfig.ts
import { OktaAuth } from "@okta/okta-auth-js";

export const oktaAuthDO33 = new OktaAuth({
  issuer:   import.meta.env.VITE_DO33_OKTA_ISSUER!,
  clientId: import.meta.env.VITE_DO33_OKTA_CLIENT_ID!,
  redirectUri: `${window.location.origin}/do33/login/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: false,  // Enable PKCE for enhanced security
  tokenManager: { storage: "sessionStorage" },  // or "localStorage"
});

