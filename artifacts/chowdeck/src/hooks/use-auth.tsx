import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, Vendor } from "@workspace/api-client-react";

interface AuthState {
  token: string | null;
  user: User | null;
  vendor: Vendor | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isVendorAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  loginUser: (token: string, user: User) => void;
  loginVendor: (token: string, vendor: Vendor) => void;
  loginAdmin: (token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  isRestoring: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function safeJsonParse<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("chowhub_token"));
  const [user, setUser] = useState<User | null>(() => safeJsonParse<User>("chowhub_user"));
  const [vendor, setVendor] = useState<Vendor | null>(() => safeJsonParse<Vendor>("chowhub_vendor"));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem("chowhub_role") === "admin");
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("chowhub_token");
    if (storedToken) {
      const storedRole = localStorage.getItem("chowhub_role");
      if (storedRole === "admin") {
        setIsAdmin(true);
      } else if (storedRole === "vendor") {
        const v = safeJsonParse<Vendor>("chowhub_vendor");
        if (v) setVendor(v);
      } else {
        const u = safeJsonParse<User>("chowhub_user");
        if (u) setUser(u);
      }
    }
    setIsRestoring(false);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("chowhub_token", token);
    } else {
      localStorage.removeItem("chowhub_token");
      localStorage.removeItem("chowhub_user");
      localStorage.removeItem("chowhub_vendor");
      localStorage.removeItem("chowhub_role");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("chowhub_user", JSON.stringify(user));
      localStorage.setItem("chowhub_role", "user");
    }
  }, [user]);

  useEffect(() => {
    if (vendor) {
      localStorage.setItem("chowhub_vendor", JSON.stringify(vendor));
      localStorage.setItem("chowhub_role", "vendor");
    }
  }, [vendor]);

  useEffect(() => {
    if (isAdmin && token) {
      localStorage.setItem("chowhub_role", "admin");
    }
  }, [isAdmin, token]);

  const loginUser = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setVendor(null);
    setIsAdmin(false);
    localStorage.removeItem("chowhub_vendor");
  }, []);

  const loginVendor = useCallback((newToken: string, newVendor: Vendor) => {
    setToken(newToken);
    setVendor(newVendor);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("chowhub_user");
  }, []);

  const loginAdmin = useCallback((newToken: string) => {
    setToken(newToken);
    setIsAdmin(true);
    setUser(null);
    setVendor(null);
    localStorage.removeItem("chowhub_user");
    localStorage.removeItem("chowhub_vendor");
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setVendor(null);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        vendor,
        isAdmin,
        isAuthenticated: !!user && !!token,
        isVendorAuthenticated: !!vendor && !!token,
        isAdminAuthenticated: isAdmin && !!token,
        loginUser,
        loginVendor,
        loginAdmin,
        updateUser,
        logout,
        isRestoring,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
