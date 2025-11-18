import { OktaAuth } from "@okta/okta-auth-js";

export const oktaAuthYachiyo = new OktaAuth({
  issuer:   import.meta.env.VITE_YACHIYO_OKTA_ISSUER!,
  clientId: import.meta.env.VITE_YACHIYO_OKTA_CLIENT_ID!,
  //redirectUri: import.meta.env.VITE_YACHIYO_OKTA_REDIRECT_URI!,
  redirectUri: `${window.location.origin}/yachiyo/login/callback`,
  scopes: ["openid", "profile", "email"],
  //prod
  //pkce:true,
  //local
  pkce: false,  // Enable PKCE for enhanced security
  tokenManager: { storage: "sessionStorage" },  // or "localStorage"


  

});