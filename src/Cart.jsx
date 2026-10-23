
import { useState } from "react";
import Navbar from "./Navbar";
import "./App.css";

export default function Cart() {
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  // Save cart in React state and localStorage
  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Increase or decrease food quantity
  const changeQuantity = (id, amount) => {
    const updatedCart = cart
      .map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(
                0,
                Number(item.quantity || 0) + amount
              ),
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };

  // Remove food from cart
  const removeItem = (id) => {
    saveCart(cart.filter((item) => item.id !== id));
  };

  // Calculate cart total for display
  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  // Load Razorpay Checkout script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // Start Razorpay payment
  const handlePayNow = async () => {
    if (paymentLoading) return;

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    // Validate quantities before sending them to the backend
    const invalidItem = cart.find(
      (item) =>
        !Number.isSafeInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
    );

    if (invalidItem) {
      alert("Please check the quantities in your cart.");
      return;
    }

    setPaymentLoading(true);

    try {
      // Check current availability in localStorage.
      // The backend must independently validate its trusted menu.
      let currentFoods;

      try {
        currentFoods = JSON.parse(
          localStorage.getItem("availableFoods") || "[]"
        );

        if (!Array.isArray(currentFoods)) {
          currentFoods = [];
        }
      } catch {
        currentFoods = [];
      }

      const unavailableItem = cart.find((item) => {
        const currentFood = currentFoods.find(
          (food) => String(food.id) === String(item.id)
        );

        return !currentFood || !currentFood.available;
      });

      if (unavailableItem) {
        alert(
          `${unavailableItem.name} is currently unavailable. Please remove it from your cart.`
        );
        setPaymentLoading(false);
        return;
      }

      // Load Razorpay Checkout
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error(
          "Unable to load Razorpay Checkout. Please try again."
        );
      }

      // Create order on backend.
      // Send IDs and quantities, never trust frontend prices.
      const orderResponse = await fetch(
        "http://localhost:3001/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              id: String(item.id),
              quantity: Number(item.quantity),
            })),
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message || "Unable to create payment order."
        );
      }

      // Configure Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "FoodHub",
        description: "Food order payment",
        order_id: orderData.orderId,

        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(
              "http://localhost:3001/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(response),
              }
            );

            const result = await verifyResponse.json();

            if (!verifyResponse.ok || !result.verified) {
              throw new Error(
                result.message ||
                  "Payment could not be verified."
              );
            }

            // Read existing order history safely
            let previousOrders = [];

            try {
              const savedOrders = JSON.parse(
                localStorage.getItem("orderHistory") || "[]"
              );

              if (Array.isArray(savedOrders)) {
                previousOrders = savedOrders;
              }
            } catch {
              previousOrders = [];
            }

            // Preserve food images for the kitchen UI
            const verifiedItems = result.items.map((item) => {
              const cartItem = cart.find(
                (existing) =>
                  String(existing.id) === String(item.id)
              );

              return {
                ...item,
                image: cartItem?.image || "",
              };
            });

            // Generate a four-digit demo token
            const token = Math.floor(
              1000 + Math.random() * 9000
            );

            // Create order only after server verification
            const newOrder = {
              id: token,
              createdAt: new Date().toISOString(),
              items: verifiedItems,
              total: result.total,
              status: "Pending",
              readyAt: null,
              paymentId: result.paymentId,
            };

            localStorage.setItem(
              "orderHistory",
              JSON.stringify([...previousOrders, newOrder])
            );

            // Clear cart after successful verification
            localStorage.setItem("cart", JSON.stringify([]));
            setCart([]);
            setPlacedOrder(newOrder);
          } catch (error) {
            console.error("Payment verification error:", error);

            alert(
              error.message ||
                "We couldn't confirm your payment. Check payment status before retrying."
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },

        theme: {
          color: "#3399cc",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        console.error(
          "Razorpay payment failed:",
          response.error
        );

        alert("Payment failed. Please try again.");
        setPaymentLoading(false);
      });

      checkout.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "Unable to start payment.");
      setPaymentLoading(false);
    }
  };

  const cartCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <>
      <Navbar cartCount={cartCount} />

      <main className="container">
        <h1>Your Cart 🛒</h1>

        {placedOrder ? (
          <div className="payment-success">
            <h2>✅ Order Placed Successfully!</h2>

            <p>Your order token is:</p>

            <h1 className="order-token">
              {placedOrder.id}
            </h1>

            <p>
              Please wait while the kitchen prepares your food.
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
          <p>
            Your cart is empty. Add some delicious food first!
          </p>
        ) : (
          <>
            <div className="cart-list">
              {cart.map((item) => (
                <div
                  className="kitchen-item"
                  key={item.id}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="food-thumbnail"
                  />

                  <div className="cart-details">
                    <h3>{item.name}</h3>

                    <p>₹{item.price}</p>

                    <div className="quantity-control">
                      <button
                        type="button"
                        disabled={paymentLoading}
                        onClick={() =>
                          changeQuantity(item.id, -1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        disabled={paymentLoading}
                        onClick={() =>
                          changeQuantity(item.id, 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <p>
                      Subtotal: ₹
                      {Number(item.price) *
                        Number(item.quantity)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    disabled={paymentLoading}
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Total: ₹{total}</h2>

              <button
                type="button"
                className="primary-btn"
                onClick={handlePayNow}
                disabled={
                  paymentLoading || cart.length === 0
                }
              >
                {paymentLoading
                  ? "Processing..."
                  : "Pay Now"}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
