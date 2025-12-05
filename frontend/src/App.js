import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Login from "@/pages/Login";
import CooperativeOverview from "@/pages/CooperativeOverview";
import ManagerHome from "@/pages/ManagerHome";
import DataEntry from "@/pages/DataEntry";
import Dashboard from "@/pages/Dashboard";
import WhatIfSimulator from "@/pages/WhatIfSimulator";
import DigitalTwin from "@/pages/DigitalTwin";
import ESGReporting from "@/pages/ESGReporting";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const getHomeRoute = () => {
    if (!user) return "/login";
    return user.role === "officer" ? "/overview" : "/home";
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login setUser={setUser} api={api} /> : <Navigate to={getHomeRoute()} />} 
          />
          
          {/* Officer Routes */}
          <Route 
            path="/overview" 
            element={user?.role === "officer" ? <CooperativeOverview user={user} setUser={setUser} api={api} /> : <Navigate to="/login" />} 
          />
          
          {/* Manager Routes */}
          <Route 
            path="/home" 
            element={user?.role === "manager" ? <ManagerHome user={user} setUser={setUser} api={api} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/data-entry" 
            element={user?.role === "manager" ? <DataEntry user={user} setUser={setUser} api={api} /> : <Navigate to="/login" />} 
          />
          
          {/* Shared Routes */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} setUser={setUser} api={api} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/simulator" 
            element={user ? <WhatIfSimulator user={user} setUser={setUser} api={api} /> : <Navigate to="/login" />} 
          />
          
          <Route path="/" element={<Navigate to={getHomeRoute()} />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;