
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function Home() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      setFoods(
        JSON.parse(localStorage.getItem("availableFoods") || "[]")
      );
    } catch {
      setFoods([]);
    }
  }, []);

  const changeQuantity = (id, amount) => {
    setQuantities((previous) => ({
      ...previous,
      [id]: Math.max(1, (previous[id] || 1) + amount),
    }));
  };

  const addToCart = (food) => {
    if (!food.available) {
      alert("This food is currently unavailable.");
      return;
    }

    const quantity = quantities[food.id] || 1;

    const updatedCart = [...cart];
    const existingIndex = updatedCart.findIndex(
      (item) => item.id === food.id
    );

    if (existingIndex !== -1) {
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: updatedCart[existingIndex].quantity + quantity,
      };
    } else {
      updatedCart.push({ ...food, quantity });
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

   
    setQuantities((previous) => ({
      ...previous,
      [food.id]: 1,
    }));


  };

  const cartCount = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  return (
    <>
      <Navbar cartCount={cartCount} />

      <main className="container">
        <h1>Welcome to FoodHub 🍔</h1>
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate("/cart")}
        >
          Go to Cart ({cartCount})
        </button>

        {foods.length === 0 ? (
          <p>No food items available yet.</p>
        ) : (
          <div className="food-grid">
            {foods.map((food) => {
              const quantity = quantities[food.id] || 1;

              return (
                <div className="food-card" key={food.id}>
                  <img
                    src={food.image}
                    alt={food.name}
                    className="home-food-image"
                  />

                  <div className="home-food-details">
                    <h3>{food.name}</h3>

                    <p className="price">₹{food.price}</p>

                    <p className={
                      food.available ? "available" : "unavailable"
                    }>
                      {food.available
                        ? "● Available"
                        : "● Unavailable"}
                    </p>

                    <div className="quantity-control">
                      <button
                        type="button"
                        disabled={!food.available || quantity <= 1}
                        onClick={() => changeQuantity(food.id, -1)}
                      >
                        −
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        disabled={!food.available}
                        onClick={() => changeQuantity(food.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <p className="item-total">
                      Total: ₹{Number(food.price) * quantity}
                    </p>

                    <button
                      type="button"
                      className="primary-btn home-action"
                      disabled={!food.available}
                      onClick={() => addToCart(food)}
                    >
                      Add +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

    
      </main>
    </>
  );
}
