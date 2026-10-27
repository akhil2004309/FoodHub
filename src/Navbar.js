
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ cartCount = 0 }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");

    navigate("/", { replace: true });
  };

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    user = null;
  }

  const role = user?.role;

  return (
    <nav className="navbar">
      <Link to={role === "customer" ? "/home" : "/"} className="brand">
        🍽️ FoodHub
      </Link>

      <div className="nav-links">
        {role === "customer" && (
          <>
            <Link to="/home">Home</Link>
            <Link to="/cart">Cart ({cartCount})</Link>
          </>
        )}

        {role === "kitchen" && (
          <Link to="/kitchen">Kitchen Dashboard</Link>
        )}

        {role === "admin" && (
          <Link to="/admin">Admin Dashboard</Link>
        )}

        {role && (
          <span className="navbar-user">
            Hi, {user.name}
          </span>
        )}

        {role ? (
          <button type="button" onClick={logout} className="logout-btn">
            Logout
          </button>
        ) : (
          <Link to="/">Login</Link>
        )}
      </div>
    </nav>
  );
}
