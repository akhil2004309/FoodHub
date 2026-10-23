
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Auth from "./Auth";
import ProtectedRoute from "./ProtectedRoute";
import Home from "./Home";
import Cart from "./Cart";
import Kitchen from "./Kitchen";
import Admin from "./Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route
          path="/"
          element={<Auth mode="login" role="customer" />}
        />
        <Route
          path="/signup"
          element={<Auth mode="signup" role="customer" />}
        />

        
        <Route
          path="/admin-login"
          element={<Auth mode="login" role="admin" />}
        />
        <Route
          path="/admin-signup"
          element={<Auth mode="signup" role="admin" />}
        />

        
        <Route
          path="/kitchen-login"
          element={<Auth mode="login" role="kitchen" />}
        />
        <Route
          path="/kitchen-signup"
          element={<Auth mode="signup" role="kitchen" />}
        />

        
        <Route
          path="/home"
          element={
            <ProtectedRoute role="customer">
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute role="customer">
              <Cart />
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute role="kitchen">
              <Kitchen />
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
