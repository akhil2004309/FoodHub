
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "./App.css";

export default function Admin() {
  const [foods, setFoods] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    try {
      const savedFoods = JSON.parse(
        localStorage.getItem("availableFoods") || "[]"
      );
      setFoods(Array.isArray(savedFoods) ? savedFoods : []);
    } catch {
      setFoods([]);
    }
  }, []);

  const saveFoods = (updatedFoods) => {
    setFoods(updatedFoods);
    localStorage.setItem("availableFoods", JSON.stringify(updatedFoods));
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setImage("");
    setEditingId(null);

    const fileInput = document.getElementById("food-image");
    if (fileInput) fileInput.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || price === "" || Number(price) < 0) {
      alert("Enter a valid dish name and price.");
      return;
    }

    if (editingId !== null) {
      const updatedFoods = foods.map((food) =>
        food.id === editingId
          ? {
              ...food,
              name: name.trim(),
              price: Number(price),
              image: image || food.image,
            }
          : food
      );

      saveFoods(updatedFoods);
      alert("Dish updated successfully!");
    } else {
      const newFood = {
        id: Date.now(),
        name: name.trim(),
        price: Number(price),
        image,
        available: true,
      };

      saveFoods([...foods, newFood]);
      alert("Dish added successfully!");
    }

    resetForm();
  };

  const handleEdit = (food) => {
    setEditingId(food.id);
    setName(food.name);
    setPrice(String(food.price));
    setImage(food.image || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAvailability = (id) => {
    const updatedFoods = foods.map((food) =>
      food.id === id
        ? { ...food, available: food.available === false }
        : food
    );

    saveFoods(updatedFoods);
  };

  const removeFood = (id) => {
    if (!window.confirm("Are you sure you want to remove this dish?")) {
      return;
    }

    saveFoods(foods.filter((food) => food.id !== id));

    
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = cart.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    if (editingId === id) resetForm();

    alert("Dish removed successfully!");
  };

  return (
    <>
      <Navbar />

      <main className="container">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Manage your FoodHub menu.</p>

        <form className="food-form" onSubmit={handleSubmit}>
          <h2>{editingId !== null ? "Edit Dish" : "Add New Dish"}</h2>

          <label htmlFor="food-name">Dish Name</label>
          <input
            id="food-name"
            type="text"
            placeholder="Enter dish name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="food-price">Price (₹)</label>
          <input
            id="food-price"
            type="number"
            placeholder="Enter price"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <label htmlFor="food-image">
            Dish Image {editingId !== null && "(Choose only to replace the image)"}
          </label>
          <input
            id="food-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required={editingId === null}
          />

          {image && (
            <img
              src={image}
              alt="Dish preview"
              className="admin-image-preview"
            />
          )}

          <button type="submit" className="primary-btn">
            {editingId !== null ? "Update Dish" : "Add Dish"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-edit-btn"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>

        <h2 className="kitchen-heading">Manage Dishes ({foods.length})</h2>

        {foods.length === 0 ? (
          <div className="empty-orders">
            No dishes added yet. Add your first dish above!
          </div>
        ) : (
          <div className="kitchen-list">
            {foods.map((food) => (
              <div className="kitchen-item admin-food-item" key={food.id}>
                {food.image ? (
                  <img
                    src={food.image}
                    alt={food.name}
                    className="admin-food-image"
                  />
                ) : (
                  <div className="cart-emoji">🍽️</div>
                )}

                <div className="cart-details">
                  <h3>{food.name}</h3>
                  <p>₹{Number(food.price).toFixed(2)}</p>
                  <span
                    className={
                      food.available === false ? "unavailable" : "available"
                    }
                  >
                    {food.available === false ? "Unavailable" : "Available"}
                  </span>
                </div>

                <div className="admin-food-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => handleEdit(food)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => toggleAvailability(food.id)}
                  >
                    {food.available === false ? "Enable" : "Disable"}
                  </button>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFood(food.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
