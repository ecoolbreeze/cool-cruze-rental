import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.checkAuth()
      .then(() => setUser({ username: 'admin' }))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    await api.admin.login(username, password);
    setUser({ username });
  };

  const logout = async () => {
    await api.admin.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);