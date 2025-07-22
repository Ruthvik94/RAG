import React from "react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AppRoutes } from "./components/AppRoutes";
import "./index.scss";

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
    </ChakraProvider>
  );
}

export default App;
