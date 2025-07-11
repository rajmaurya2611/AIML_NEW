// src/types/global.d.ts
import React from "react";

/**
 * Treat any import ending in .js or .jsx as a React component
 * whose props we’ll temporarily type as `any`.
 */
declare module "*.js" {
  const Component: React.ComponentType<any>;
  export default Component;
}
declare module "*.jsx" {
  const Component: React.ComponentType<any>;
  export default Component;
}
