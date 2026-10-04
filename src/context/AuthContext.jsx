/**
 * DumpSentry Global Auth Context
 * Tracks admin authentication state across the entire app.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { isAuthenticated, logout as apiLogout, getAuthToken, getMe } from "../services/api";
import AdminAuthModal from "../components/AdminAuthModal";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(isAuthenticated);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [user, setUser] = useState(() => {
    // Try to restore user info from localStorage
    try {
      const stored = localStorage.getItem("dumpsentry_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Verify token validity on load
  useEffect(() => {
    if (isAdmin) {
      getMe()
        .then((userData) => {
          if (userData && userData.email) {
            setUser(userData);
          }
        })
        .catch(() => {
          console.warn("Auth token invalid or expired. Logging out.");
          logout();
        });
    }
  }, []);

  const openLoginModal = useCallback((msg = "") => {
    setAuthModalMessage(msg);
    setIsAuthModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalMessage("");
  }, []);

  const requireAdmin = useCallback((actionDescription = "", onSuccess = null) => {
    if (isAuthenticated()) {
      if (onSuccess) onSuccess();
      return true;
    }
    openLoginModal(
      actionDescription
        ? `Administrator login required to ${actionDescription}.`
        : "Administrator login required to perform this action."
    );
    return false;
  }, [openLoginModal]);

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
    <AuthContext.Provider
      value={{
        isAdmin,
        user,
        login,
        logout,
        token: getAuthToken,
        isAuthModalOpen,
        openLoginModal,
        closeLoginModal,
        requireAdmin,
      }}
    >
      {children}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={closeLoginModal}
        message={authModalMessage}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
