
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
}));

app.use(express.json());

if (!process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Missing Razorpay API keys in .env");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// DEMO MENU: Replace these example items with your real
// server-side/database menu. Never trust client-supplied prices.
const MENU = {
  "1": { id: "1", name: "Burger", price: 120 },
  "2": { id: "2", name: "Pizza", price: 250 },
  "3": { id: "3", name: "Sandwich", price: 100 },
};

// Demo-only memory storage. Use a database in production.
const pendingOrders = new Map();

// Create a Razorpay order
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty.",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        message: "Too many cart items.",
      });
    }

    const verifiedItems = items.map((item) => {
      const food = MENU[String(item.id)];
      const quantity = Number(item.quantity);

      if (
        !food ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        throw new Error("Invalid food item or quantity.");
      }

      return {
        id: food.id,
        name: food.name,
        price: food.price,
        quantity,
      };
    });

    const totalRupees = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const amount = totalRupees * 100; // Razorpay uses paise.

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Invalid payment amount.",
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `foodhub_${crypto.randomUUID().slice(0, 24)}`,
    });

    pendingOrders.set(order.id, {
      amount,
      items: verifiedItems,
      createdAt: Date.now(),
      verified: false,
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(400).json({
      message: error.message || "Unable to create payment order.",
    });
  }
});

// Verify payment on the server
app.post("/api/payment/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        message: "Missing payment verification details.",
      });
    }

    const pending = pendingOrders.get(razorpay_order_id);

    if (!pending) {
      return res.status(400).json({
        message: "Unknown or expired payment order.",
      });
    }

    if (pending.verified) {
      return res.status(409).json({
        message: "This payment has already been processed.",
      });
    }

    // Verify the signature using the order ID created by this server.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest();

    const receivedSignature = Buffer.from(
      razorpay_signature,
      "hex"
    );

    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        expectedSignature,
        receivedSignature
      )
    ) {
      return res.status(400).json({
        message: "Payment signature verification failed.",
      });
    }

    // Fetch payment details directly from Razorpay.
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== pending.amount ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        message:
          "Payment is not captured or its details do not match.",
      });
    }

    pending.verified = true;

    return res.json({
      verified: true,
      paymentId: payment.id,
      orderId: razorpay_order_id,
      items: pending.items,
      total: pending.amount / 100,
      status: "Pending",
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      message: "Unable to verify payment. Please check the payment status.",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "FoodHub payment server is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FoodHub backend running on port ${PORT}`);
});
