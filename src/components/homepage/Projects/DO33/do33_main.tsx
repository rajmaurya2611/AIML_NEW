import { Toaster } from "./do33_ui/toaster";
import { Toaster as Sonner } from "./do33_ui/sonner";
import { TooltipProvider } from "./do33_ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages_do33/Index";
//import NotFound from "./pages_do33/NotFound";
import "./do33_custom.css";
import "./do33_main.css";
//import "./do33_custom2.css";


const queryClient = new QueryClient();

const DO33Main = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Index/>
    </TooltipProvider>
  </QueryClientProvider>
);

export default DO33Main;
