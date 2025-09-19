// src/apps/legallens/AuthRoute.tsx
import { useOktaAuth } from "@okta/okta-react";
import { Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
// Optional (equivalent approach):
// import { toRelativeUrl } from "@okta/okta-auth-js";

export default function CapexAuthRoute() {
  const { authState, oktaAuth } = useOktaAuth();
  const { pathname, search, hash } = useLocation();

  if (!authState) return <Spin className="block mx-auto mt-32" size="large" />;

  if (!authState.isAuthenticated) {
    // ✅ preserve query string and hash (e.g., ?table=...&..., #anchor)
    const originalUri = `${pathname}${search}${hash}`;

    // Alternative using Okta helper (also preserves query+hash):
    // const originalUri = toRelativeUrl(window.location.href, window.location.origin);

    oktaAuth.signInWithRedirect({ originalUri });
    return null;
  }

  return <Outlet />;
}
