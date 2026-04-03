import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("chowhub_token"));
  const [user, setUser] = useState<User | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem("chowhub_token", token);
    } else {
      localStorage.removeItem("chowhub_token");
    }
  }, [token]);

  const loginUser = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setVendor(null);
    setIsAdmin(false);
  };

  const loginVendor = (newToken: string, newVendor: Vendor) => {
    setToken(newToken);
    setVendor(newVendor);
    setUser(null);
    setIsAdmin(false);
  };

  const loginAdmin = (newToken: string) => {
    setToken(newToken);
    setIsAdmin(true);
    setUser(null);
    setVendor(null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setVendor(null);
    setIsAdmin(false);
  };

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
        logout,
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
