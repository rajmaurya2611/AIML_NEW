// src/apps/legallens/oktaConfig.ts
import { OktaAuth } from "@okta/okta-auth-js";

export const oktaAuthKK = new OktaAuth({
  issuer:   import.meta.env.VITE_KNOWLEDGEBOT_OKTA_ISSUER!,
  clientId: import.meta.env.VITE_KNOWLEDGEBOT_OKTA_CLIENT_ID!,
  redirectUri: `${window.location.origin}/knowledgebot/login/callback`,
  scopes: ["openid", "profile", "email"],
  pkce: false,  // Enable PKCE for enhanced security
  tokenManager: { storage: "sessionStorage" },  // or "localStorage"
});

