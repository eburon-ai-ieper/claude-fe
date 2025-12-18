import { useAuthStore } from "@/stores/authStore";
import type { ReactNode } from "react";
import { Navigate } from "react-router";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: ReactNode;
}) {
  const { token, role } = useAuthStore();

  if (!token) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(role!)) return <Navigate to="/403" replace />;

  return <>{children}</>;
}
