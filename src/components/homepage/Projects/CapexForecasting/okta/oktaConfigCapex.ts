import { OktaAuth } from "@okta/okta-auth-js";

export const oktaAuthCapex = new OktaAuth({
  issuer: import.meta.env.VITE_CAPEX_OKTA_ISSUER!,
  clientId: import.meta.env.VITE_CAPEX_OKTA_CLIENT_ID!,
  redirectUri: `${window.location.origin}/capex-forecasting/login/callback`, // no trailing slash
  scopes: ["openid", "profile", "email"],
  pkce: true, // enable PKCE (you had false with a comment saying enable)
  tokenManager: { storage: "sessionStorage" }, // or "localStorage"
  // IMPORTANT: do NOT set restoreOriginalUri here
});
