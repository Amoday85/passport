import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) return <div style={{ padding: 24 }}>Загрузка…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
