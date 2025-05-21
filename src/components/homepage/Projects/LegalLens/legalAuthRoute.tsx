import { Navigate } from "react-router-dom";

const LegalAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const isLegalLensLoggedIn = sessionStorage.getItem("isLegalLensLoggedIn") === "true";

  if (!isLegalLensLoggedIn) {
    return <Navigate to="/legallens/login" replace />;
  }

  return children;
};

export default LegalAuthRoute;
