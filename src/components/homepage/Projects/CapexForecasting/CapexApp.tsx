import { Toaster } from "./components_Capex/ui/toaster";
import { Toaster as Sonner } from "./components_Capex/ui/sonner";
import { TooltipProvider } from "./components_Capex/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//import { Routes, Route } from "react-router-dom";
import Index from "./pages_Capex/Index";
//import NotFound from "./pages_Capex/NotFound";

const queryClient = new QueryClient();

const CapexApp = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Index />
    </TooltipProvider>
  </QueryClientProvider>
);

export default CapexApp;
