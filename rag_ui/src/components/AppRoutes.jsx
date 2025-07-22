import React, { Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Spinner, Center } from "@chakra-ui/react";
import Home from "../pages/components/Home/Home";
import TabHeader from "../pages/layout/TabHeader";

// Lazy load components for better performance
const Query = React.lazy(() => import("../pages/components/Query/Query"));
const Upload = React.lazy(() => import("../pages/components/Upload/Upload"));

export function TabLayout() {
  return (
    <>
      <TabHeader />
      <Outlet />
    </>
  );
}

const LoadingFallback = () => (
  <Center h="200px">
    <Spinner color="blue.500" size="lg" />
  </Center>
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<TabLayout />}>
        <Route 
          path="/query" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Query />
            </Suspense>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Upload />
            </Suspense>
          } 
        />
      </Route>
    </Routes>
  );
}
