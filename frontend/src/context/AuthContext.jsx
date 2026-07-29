import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Persist only to sessionStorage (cleared when the tab closes) - simple
  // and enough for a class project without over-engineering token refresh.
  const [token, setToken] = useState(() => sessionStorage.getItem('medibook_token'));
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem('medibook_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) sessionStorage.setItem('medibook_token', token);
    else sessionStorage.removeItem('medibook_token');
  }, [token]);

  useEffect(() => {
    if (user) sessionStorage.setItem('medibook_user', JSON.stringify(user));
    else sessionStorage.removeItem('medibook_user');
  }, [user]);

  const login = (data) => {
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
