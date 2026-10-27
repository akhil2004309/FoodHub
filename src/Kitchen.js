
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "./App.css";

export default function Kitchen() {
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("orderHistory") || "[]");
    } catch {
      return [];
    }
  });


  useEffect(() => {
    const loadOrders = () => {
      try {
        setOrders(
          JSON.parse(localStorage.getItem("orderHistory") || "[]")
        );
      } catch {
        setOrders([]);
      }
    };

    
    window.addEventListener("storage", loadOrders);

    return () => {
      window.removeEventListener("storage", loadOrders);
    };
  }, []);


  const markReady = (orderId) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            status: "Ready",
            readyAt: new Date().toISOString(),
          }
        : order
    );

    localStorage.setItem(
      "orderHistory",
      JSON.stringify(updatedOrders)
    );

    setOrders(updatedOrders);
  };

  const pendingOrders = orders.filter(
    (order) => order.status !== "Ready"
  );

  const readyOrders = orders.filter(
    (order) => order.status === "Ready"
  );

  return (
    <>
      <Navbar />

      <main className="container kitchen-page">
        <h1>Kitchen Dashboard 👨‍🍳</h1>

        <p className="subtitle">
          Manage incoming orders and notify customers when food is ready.
        </p>

        <div className="kitchen-stats">
          <div className="kitchen-stat">
            <h2>{orders.length}</h2>
            <p>Total Orders</p>
          </div>

          <div className="kitchen-stat">
            <h2>{pendingOrders.length}</h2>
            <p>Pending Orders</p>
          </div>

          <div className="kitchen-stat">
            <h2>{readyOrders.length}</h2>
            <p>Ready Orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders">
            <h2>No orders yet 🍽️</h2>
            <p>
              Orders placed by customers will appear here.
            </p>
          </div>
        ) : (
          <>
            <h2 className="kitchen-heading">
              Incoming Orders
            </h2>

            <div className="kitchen-orders">
              {[...pendingOrders, ...readyOrders].map(
                (order) => (
                  <div className="order-card" key={order.id}>
                    <div className="order-header">
                      <div>
                        <h3>Order #{order.id}</h3>

                        <p className="order-date">
                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleString()
                            : "Date unavailable"}
                        </p>
                      </div>

                      <span
                        className={
                          order.status === "Ready"
                            ? "order-status ready-status"
                            : "order-status pending-status"
                        }
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>

                    <div className="order-items">
                      {(order.items || []).map(
                        (item, index) => (
                          <div
                            className="order-item"
                            key={`${item.id}-${index}`}
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                              />
                            )}

                            <div className="order-item-info">
                              <h4>{item.name}</h4>
                              <p>
                                Quantity: {item.quantity}
                              </p>
                              <p>
                                ₹{Number(item.price) *
                                  Number(item.quantity)}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="order-footer">
                      <h3>
                        Total: ₹{order.total}
                      </h3>

                      {order.status === "Ready" ? (
                        <p className="ready-message">
                          ✅ Order is ready!
                        </p>
                      ) : (
                        <button
                          className="ready-btn"
                          onClick={() => markReady(order.id)}
                        >
                          ✓ Mark Ready
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
