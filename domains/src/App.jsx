import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import ClientView from "./pages/ClientView";

export default function App() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: #00ff88 !important; }
        button:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
      `}</style>
      <BrowserRouter>
        <Routes>
          <Route path="/domains" element={<AdminDashboard />} />
          <Route path="/domains/client/:token" element={<ClientView />} />
          <Route path="*" element={<Navigate to="/domains" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
