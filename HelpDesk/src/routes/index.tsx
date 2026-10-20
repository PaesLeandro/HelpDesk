import { Loading } from "../components/Loading";
import { useAuth } from "../hooks/useAuth";
import { AdminRoutes } from "./AdminRoutes";
import { AuthRoutes } from "./AuthRoutes";
import { ClientRoutes } from "./ClientRoutes";
import { TechnicianRoutes } from "./TechnicianRoutes";

export function AppRoutes() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <Loading />;

  switch (session?.user.role) {
    case "admin":
      return <AdminRoutes />;
    case "technician":
      return <TechnicianRoutes />;
    case "client":
      return <ClientRoutes />;
    default:
      return <AuthRoutes />;
  }
}
