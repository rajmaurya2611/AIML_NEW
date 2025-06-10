// src/apps/legallens/oktaConfig.ts
import { OktaAuth } from "@okta/okta-auth-js";

export const oktaAuthLegal = new OktaAuth({
  issuer:   import.meta.env.VITE_LEGAL_OKTA_ISSUER!,
  clientId: import.meta.env.VITE_LEGAL_OKTA_CLIENT_ID!,
  redirectUri: `${window.location.origin}/legallens/login/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: false,  // Enable PKCE for enhanced security
  tokenManager: { storage: "sessionStorage" },  // or "localStorage"
});


//Do not use this in production, it is only for testing purposes
// DEBUG – expose it for one test run
// @ts-ignore
//console.table(window.oktaAuthLegal.options
//window.oktaAuthLegal = oktaAuthLegal;