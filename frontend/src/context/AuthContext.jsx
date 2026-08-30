import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const readStoredUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  } catch {
    window.localStorage.removeItem("user");
    return null;
  }
};

const cleanToken = (value) =>
  String(value || "")
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^"(.*)"$/, "$1")
    .trim();

const readStoredToken = () => {
  if (typeof window === "undefined") return null;

  const cleaned = cleanToken(window.localStorage.getItem("token"));
  if (!cleaned) {
    window.localStorage.removeItem("token");
    return null;
  }
  return cleaned;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);

  const login = (userData, newToken) => {
    const cleaned = cleanToken(newToken);
    if (!userData || !cleaned) {
      throw new Error("Login response did not contain a valid session.");
    }

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", cleaned);
    setUser(userData);
    setToken(cleaned);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading: false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
