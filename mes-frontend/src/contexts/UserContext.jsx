import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("mes_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("mes_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("mes_user");
    }
  }, [user]);

  // Login: set user info (call this after successful login)
  const login = (userInfo) => setUser(userInfo);
  // Logout: clear user info
  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 