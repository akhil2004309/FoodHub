import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, children }) {
  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );
  } catch {
    currentUser = null;
  }

  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true";

  
  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== role) {
    const dashboards = {
      customer: "/home",
      admin: "/admin",
      kitchen: "/kitchen",
    };

    return (
      <Navigate
        to={dashboards[currentUser.role] || "/"}
        replace
      />
    );
  }

  return children;
}