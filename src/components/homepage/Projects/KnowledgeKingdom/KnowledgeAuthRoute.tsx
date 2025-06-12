// src/apps/knowledge/KKAuthRoute.tsx
import { useOktaAuth } from "@okta/okta-react";
import { Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";

export default function KKAuthRoute() {
  const { authState, oktaAuth } = useOktaAuth();
  const { pathname } = useLocation();

  if (!authState) return <Spin className="block mx-auto mt-32" size="large" />;

  if (!authState.isAuthenticated) {
    oktaAuth.signInWithRedirect({ originalUri: pathname });
    return null;
  }

  return <Outlet />;
}
