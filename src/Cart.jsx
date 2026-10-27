import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./App.css";

export default function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(
        localStorage.getItem("cart") || "[]"
      );
      return Array.isArray(savedCart) ? savedCart : [];
    } catch {
      return [];
    }
  });

  const [placedOrder, setPlacedOrder] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Change quantity
  const changeQuantity = (id, amount) => {
    const updatedCart = cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Number(item.quantity) + amount,
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };

  // Remove item
  const removeItem = (id) => {
    saveCart(cart.filter((item) => item.id !== id));
  };

  // Calculate total
  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  // Open dummy payment popup
  const handlePayNow = () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    let currentFoods = [];

    try {
      const savedFoods = JSON.parse(
        localStorage.getItem("availableFoods") || "[]"
      );

      currentFoods = Array.isArray(savedFoods) ? savedFoods : [];
    } catch {
      currentFoods = [];
    }

    const unavailableItem = cart.find((item) => {
      const currentFood = currentFoods.find(
        (food) => String(food.id) === String(item.id)
      );

      return (
        !currentFood ||
        !currentFood.available ||
        !Number.isSafeInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      );
    });

    if (unavailableItem) {
      alert(
        `${unavailableItem.name} is unavailable or has an invalid quantity. Please update your cart.`
      );
      return;
    }

    setShowPayment(true);
  };

  // Complete payment
  const handleDummyPayment = () => {
    if (paymentLoading) return;

    setPaymentLoading(true);

    try {
      const token = Math.floor(1000 + Math.random() * 9000);

      const newOrder = {
        id: token,
        createdAt: new Date().toISOString(),
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image || "",
        })),
        total,
        status: "Pending",
        readyAt: null,
        paymentMethod: "Dummy Payment",
        paymentStatus: " Successful",
      };

      let previousOrders = [];

      try {
        const savedOrders = JSON.parse(
          localStorage.getItem("orderHistory") || "[]"
        );

        previousOrders = Array.isArray(savedOrders)
          ? savedOrders
          : [];
      } catch {
        previousOrders = [];
      }

      localStorage.setItem(
        "orderHistory",
        JSON.stringify([...previousOrders, newOrder])
      );

      localStorage.setItem("cart", JSON.stringify([]));

      setCart([]);
      setShowPayment(false);
      setPlacedOrder(newOrder);
    } catch (error) {
      console.error(" order error:", error);
      alert("Unable to place the  order.");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <Navbar cartCount={cartCount} />

      <main className="container">
        <h1>Your Cart 🛒</h1>

        {placedOrder ? (
          <div className="payment-success">
            <h2>✅ Order Placed Successfully!</h2>

            <p> payment completed successfully.</p>

            <p>Your order token is:</p>

            <h1 className="order-token">
              {placedOrder.id}
            </h1>

            <p>
              Total paid (): ₹
              {Number(placedOrder.total).toFixed(2)}
            </p>

            <div className="waiting-status">
              <span>🕒</span>

              <strong>
                Waiting for the kitchen...
              </strong>

              <p>
                Your order status is Pending. You will be
                notified when the order is ready.
              </p>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                localStorage.removeItem("currentUser");
                localStorage.removeItem("userRole");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("isAdmin");

                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="empty-cart-card">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
              alt="FoodHub delicious dishes"
              className="empty-cart-img"
            />
            <div className="empty-cart-body">
              <h2>Your FoodHub Cart is Empty 🍔</h2>
              <p>
                Delicious gourmet food is just a click away! Browse our menu and fill your cart with your favorites.
              </p>
              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate("/home")}
              >
                Browse Menu
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-grid-layout">
            <div className="cart-list">
              {cart.map((item) => (
                <div className="kitchen-item cart-item-card" key={item.id}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="food-thumbnail"
                  />

                  <div className="cart-details">
                    <div className="cart-title-row">
                      <h3>{item.name}</h3>
                      <button
                        type="button"
                        className="remove-btn icon-remove-btn"
                        onClick={() => removeItem(item.id)}
                        title="Remove dish"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="cart-item-price">₹{item.price}</p>

                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(item.id, -1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          changeQuantity(item.id, 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <p className="cart-subtotal">
                      Subtotal: ₹
                      {Number(item.price) *
                        Number(item.quantity)}
                    </p>
                  </div>

                  <div className="cart-item-fudhub-badge">
                    <span className="fudhub-tag">🍽️ FoodHub</span>
                    <span className="fudhub-pill">Fresh & Sizzling 🔥</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-sidebar">
              <div className="cart-summary">
                <h2>Total: ₹{total.toFixed(2)}</h2>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handlePayNow}
                >
                  Pay Now
                </button>
              </div>

              <div className="cart-fudhub-promo">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
                  alt="FoodHub Culinary Specials"
                  className="fudhub-promo-image"
                />
                <div className="fudhub-promo-content">
                  <h4>🍽️ FoodHub Kitchen Guarantee</h4>
                  <p>100% freshly cooked with premium ingredients. Delivered warm & delicious to your doorstep!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPayment && !placedOrder && (
          <div className="dummy-payment-overlay">
            <div className="dummy-payment-box">
              <h2>💳 FoodHub Payment</h2>

              <p> payment </p>

              <div className="dummy-payment-total">
                <span>Order total</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>

              <p className="dummy-payment-note">
                
              </p>

              <button
                type="button"
                className="primary-btn"
                disabled={paymentLoading}
                onClick={handleDummyPayment}
              >
                {paymentLoading
                  ? "Processing..."
                  : `Pay ₹${total.toFixed(2)}`}
              </button>

              <button
                type="button"
                className="remove-btn"
                disabled={paymentLoading}
                onClick={() => setShowPayment(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
