import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sbci_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('sbci_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem('sbci_token', token);
    else localStorage.removeItem('sbci_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('sbci_user', JSON.stringify(user));
    else localStorage.removeItem('sbci_user');
  }, [user]);

  const login = (t, u) => {
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
