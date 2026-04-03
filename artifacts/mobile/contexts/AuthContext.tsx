import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface VendorInfo {
  id: string;
  businessName: string;
  email: string;
  status: string;
  plan: string;
}

type AuthMode = "user" | "vendor" | "admin";

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  vendor: VendorInfo | null;
  mode: AuthMode;
  isAuthenticated: boolean;
  loginUser: (token: string, user: UserInfo) => Promise<void>;
  loginVendor: (token: string, vendor: VendorInfo) => Promise<void>;
  loginAdmin: (token: string, user: UserInfo) => Promise<void>;
  updateUser: (updates: Partial<UserInfo>) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  vendor: null,
  mode: "user",
  isAuthenticated: false,
  loginUser: async () => {},
  loginVendor: async () => {},
  loginAdmin: async () => {},
  updateUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [mode, setMode] = useState<AuthMode>("user");

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("auth_token");
      const u = await AsyncStorage.getItem("auth_user");
      const v = await AsyncStorage.getItem("auth_vendor");
      const m = await AsyncStorage.getItem("auth_mode");
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
      if (v) setVendor(JSON.parse(v));
      if (m) setMode(m as AuthMode);
    })();
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const loginUser = useCallback(async (t: string, u: UserInfo) => {
    setToken(t);
    setUser(u);
    setVendor(null);
    setMode("user");
    await AsyncStorage.setItem("auth_token", t);
    await AsyncStorage.setItem("auth_user", JSON.stringify(u));
    await AsyncStorage.setItem("auth_mode", "user");
    await AsyncStorage.removeItem("auth_vendor");
  }, []);

  const loginVendor = useCallback(async (t: string, v: VendorInfo) => {
    setToken(t);
    setVendor(v);
    setUser(null);
    setMode("vendor");
    await AsyncStorage.setItem("auth_token", t);
    await AsyncStorage.setItem("auth_vendor", JSON.stringify(v));
    await AsyncStorage.setItem("auth_mode", "vendor");
    await AsyncStorage.removeItem("auth_user");
  }, []);

  const loginAdmin = useCallback(async (t: string, u: UserInfo) => {
    setToken(t);
    setUser(u);
    setVendor(null);
    setMode("admin");
    await AsyncStorage.setItem("auth_token", t);
    await AsyncStorage.setItem("auth_user", JSON.stringify(u));
    await AsyncStorage.setItem("auth_mode", "admin");
    await AsyncStorage.removeItem("auth_vendor");
  }, []);

  const updateUser = useCallback((updates: Partial<UserInfo>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("auth_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setVendor(null);
    setMode("user");
    await AsyncStorage.multiRemove(["auth_token", "auth_user", "auth_vendor", "auth_mode"]);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, vendor, mode, isAuthenticated: !!token, loginUser, loginVendor, loginAdmin, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
