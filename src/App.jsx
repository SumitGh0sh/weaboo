import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { SiteHeader } from "./components/SiteHeader";
import { SiteSidebar } from "./components/SiteSidebar";
import { SiteFooter } from "./components/SiteFooter";
import { BottomNav } from "./components/BottomNav";
import { LoginModal } from "./components/LoginModal";
import { MalLinkModal } from "./components/MalLinkModal";
import { MalProfileModal } from "./components/MalProfileModal";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { DetailsPage } from "./pages/DetailsPage";
import { WatchPage } from "./pages/WatchPage";
import { FilterPage } from "./pages/FilterPage";
import { SchedulePage } from "./pages/SchedulePage";
import { MalCallbackPage } from "./pages/MalCallbackPage";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};

const AppShellLayout = () => {
  return (
    <>
      <SiteHeader />
      <div className="app-shell" id="app-shell">
        <SiteSidebar />
        <div className="app-main" id="app-main">
          <Outlet />
          <SiteFooter />
        </div>
      </div>
      <BottomNav />
      <LoginModal />
      <MalLinkModal />
      <MalProfileModal />
    </>
  );
};

function App() {
  const [runtimeError, setRuntimeError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      setRuntimeError(event.error?.stack || event.message || "Unknown error");
    };
    const handleRejection = (event) => {
      setRuntimeError(event.reason?.stack || event.reason?.message || String(event.reason));
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <AppProvider>
      {runtimeError && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "hsl(350 85% 55%)",
          color: "white",
          padding: "16px",
          zIndex: 99999,
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          whiteSpace: "pre-wrap",
          maxHeight: "30vh",
          overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <strong>🚨 Weaboo Runtime Error:</strong>
              <div style={{ marginTop: "8px" }}>{runtimeError}</div>
            </div>
            <button
              onClick={() => setRuntimeError(null)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Landing page (has no sidebar shell) */}
          <Route
            path="/"
            element={
              <>
                <LandingPage />
                <LoginModal />
              </>
            }
          />

          {/* Main pages (wrapped in Site Header/Sidebar app shell) */}
          <Route element={<AppShellLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/anime/:id" element={<DetailsPage />} />
            <Route path="/watch/:id/:num" element={<WatchPage />} />
            <Route path="/filter" element={<FilterPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
          </Route>
          <Route path="/auth/mal/callback" element={<MalCallbackPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
