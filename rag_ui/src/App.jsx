import React from "react";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/components/Home/Home";
import TabHeader from "./pages/layout/TabHeader";
const Query = React.lazy(() => import("./pages/components/Query/Query"));
const Upload = React.lazy(() => import("./pages/components/Upload/Upload"));
import "./index.scss";

function TabLayout() {
  return (
    <>
      <TabHeader />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<TabLayout />} lazy={true}>
            <Route path="/query" element={<Query />} />
            <Route path="/upload" element={<Upload />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
