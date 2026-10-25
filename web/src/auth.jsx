import { createContext, useContext } from 'react';

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
);
export const useAuth = () => useContext(AuthContext);

