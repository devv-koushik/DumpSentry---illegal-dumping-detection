/**
 * DumpSentry Global Auth Context
 * Tracks admin authentication state across the entire app.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { isAuthenticated, logout as apiLogout, getAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(isAuthenticated);
  const [user, setUser] = useState(() => {
    // Try to restore user info from localStorage
    try {
      const stored = localStorage.getItem("dumpsentry_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    setIsAdmin(true);
    if (userData) {
      setUser(userData);
      localStorage.setItem("dumpsentry_user", JSON.stringify(userData));
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setIsAdmin(false);
    setUser(null);
    localStorage.removeItem("dumpsentry_user");
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, user, login, logout, token: getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
