import { useOktaAuth } from "@okta/okta-react";
import { Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";

export default function CapexAuthRoute() {
  const { authState, oktaAuth } = useOktaAuth();
  const loc = useLocation();

  if (!authState) return <Spin className="block mx-auto mt-32" size="large" />;

  if (!authState.isAuthenticated) {
    const originalUri = `${loc.pathname}${loc.search}${loc.hash}`;
    oktaAuth.signInWithRedirect({ originalUri });
    return null;
  }

  return <Outlet />;
}
