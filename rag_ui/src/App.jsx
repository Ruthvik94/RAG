import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/components/Home/Home";
import Query from "./pages/components/Query/Query";
import Upload from "./pages/components/Upload/Upload";
import TabHeader from "./pages/layout/TabHeader";
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
          <Route element={<TabLayout />}>
            <Route path="/query" element={<Query />} />
            <Route path="/upload" element={<Upload />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
