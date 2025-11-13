import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-ambient">
      <div className="text-center glass-card p-8 max-w-md mx-4">
        <h1 className="text-4xl font-bold mb-4 text-gradient-primary">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a 
          href="/" 
          className="inline-flex items-center px-6 py-3 btn-ai rounded-lg font-medium transition-all"
        >
          Return to YachiyoAI
        </a>
      </div>
    </div>
  );
};

export default NotFound;
