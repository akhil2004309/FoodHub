
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const roleConfig = {
  customer: {
    title: "Customer",
    key: "customerAccounts",
    dashboard: "/home",
    login: "/",
    signup: "/signup",
  },
  admin: {
    title: "Admin",
    key: "adminAccounts",
    dashboard: "/admin",
    login: "/admin-login",
    signup: "/admin-signup",
  },
  kitchen: {
    title: "Kitchen",
    key: "kitchenAccounts",
    dashboard: "/kitchen",
    login: "/kitchen-login",
    signup: "/kitchen-signup",
  },
};

export default function Auth({
  mode = "login",
  role: initialRole = "customer",
}) {
  const navigate = useNavigate();

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const config = roleConfig[role];
  const isSignup = mode === "signup";

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();

    
    

    if (isSignup && password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    let accounts = [];

    try {
      accounts = JSON.parse(
        localStorage.getItem(config.key) || "[]"
      );

    } catch {
      accounts = [];
    }

  
    if (isSignup) {
      if (!name.trim()) {
        alert("Please enter your full name.");
        return;
      }

      const alreadyExists = accounts.some((account) =>
        role === "customer"
          ? account.phone === normalizedPhone
          : account.email.toLowerCase() === normalizedEmail
      );

      if (alreadyExists) {
        alert(
          role === "customer"
            ? "This phone number is already registered."
            : "This email is already registered."
        );
        return;
      }

      const newAccount = {
        id: Date.now(),
        name: name.trim(),
        password,
        role,
        ...(role === "customer"
          ? { phone: normalizedPhone }
          : { email: normalizedEmail }),
      };

      accounts.push(newAccount);

      localStorage.setItem(
        config.key,
        JSON.stringify(accounts)
      );

      alert(`${config.title} signup successful! Please log in.`);

      setName("");
      setPhone("");
      setEmail("");
      setPassword("");

      navigate(config.login);
      return;
    }

    
    const account = accounts.find((item) => {
      const identifierMatches =
        role === "customer"
          ? item.phone === normalizedPhone
          : item.email?.trim().toLowerCase() === normalizedEmail;

      return (
        identifierMatches &&
        item.password === password &&
        (!item.role || item.role === role)
      );
    });

    if (!account) {
      alert(`Invalid ${config.title} credentials.`);
      return;
    }

   
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: account.id,
        name: account.name,
        phone: account.phone || "",
        email: account.email || "",
        role,
      })
    );

    localStorage.setItem("userRole", role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem(
      "isAdmin",
      String(role === "admin")
    );

    alert(`Welcome, ${account.name}!`);

    navigate(config.dashboard);
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>FoodHub 🍔</h1>

        <h2>
          {isSignup ? "Create Account" : "Login"}
        </h2>

        <label htmlFor="role">Select Account Type</label>

        <select
          id="role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setName("");
            setPhone("");
            setEmail("");
            setPassword("");
          }}
          className="auth-select"
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="kitchen">Kitchen</option>
        </select>

        {isSignup && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        {role === "customer" ? (
          <input
            type="tel"
            placeholder="10-digit Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            pattern="[6-9][0-9]{9}"
            title="Enter a valid 10-digit Indian mobile number"
            maxLength={10}
            required
          />
        ) : (
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}

        <input
          type="password"
          placeholder="Password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={isSignup ? 6 : undefined}
          required
        />

        <button
          type="submit"
          className="primary-btn auth-submit"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <p className="auth-switch">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}{" "}

          <Link to={config[isSignup ? "login" : "signup"]}>
            {isSignup ? "Login" : "Sign Up"}
          </Link>
        </p>
      </form>
    </div>
  );
}
