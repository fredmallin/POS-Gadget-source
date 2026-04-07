import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const POSContext = createContext();

// ─── Cloudinary config (from .env) ───────────────────────────────────────────
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const POSProvider = ({ children }) => {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  // Separate carts: one for SellProducts, one for PendingOrders
  const [sellCart, setSellCart] = useState([]);
  const [pendingCart, setPendingCart] = useState([]);

  const [loading, setLoading] = useState(true);

  const LOW_STOCK_THRESHOLD = 3;

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSales([]);
      setPendingOrders([]);
      setLoading(false);
      return;
    }

    const unsubProducts = onSnapshot(
      query(collection(db, "products"), orderBy("name")),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => console.error("Products error:", err)
    );

    const unsubSales = onSnapshot(
      query(collection(db, "sales"), orderBy("date", "desc")),
      (snap) => setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Sales error:", err)
    );

    const unsubPending = onSnapshot(
      query(collection(db, "pendingOrders"), orderBy("date", "desc")),
      (snap) =>
        setPendingOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Pending orders error:", err)
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubPending();
    };
  }, [user]);

  // ─── Image Upload to Cloudinary ───────────────────────────────────────────
  // Uploads image file to Cloudinary, returns the secure URL or "" on failure
  const uploadProductImage = async (file) => {
    if (!file) return "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "pos-products"); // organizes images in Cloudinary

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Cloudinary upload failed");

      const data = await res.json();
      return data.secure_url; // https URL saved to Firestore
    } catch (err) {
      console.error("Image upload failed:", err);
      return "";
    }
  };

  // ─── Products ─────────────────────────────────────────────────────────────
  const addProduct = async (product, imageFile = null) => {
    try {
      // Upload image to Cloudinary first if provided
      const imageUrl = imageFile ? await uploadProductImage(imageFile) : "";

      await addDoc(collection(db, "products"), {
        name: product.name || "",
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        category: product.category || "",
        sku: product.sku || "",
        imageUrl,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Add product failed:", err);
      throw err;
    }
  };

  const updateProduct = async (id, updated, imageFile = null) => {
    try {
      // Upload new image if a new file was selected
      const imageUrl = imageFile
        ? await uploadProductImage(imageFile)
        : updated.imageUrl || "";

      await updateDoc(doc(db, "products", id), {
        ...updated,
        imageUrl,
      });
    } catch (err) {
      console.error("Update product failed:", err);
      throw err;
    }
  };

  // Note: Cloudinary free plan doesn't support delete via API without signing
  // The image will remain in Cloudinary but the product is removed from Firestore
  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("Delete product failed:", err);
      throw err;
    }
  };

  // ─── Sell Cart ────────────────────────────────────────────────────────────
  const addToSellCart = (product, quantity = 1) => {
    if (!product || quantity <= 0) return;
    if (product.stock <= 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }
    setSellCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          alert(`Only ${product.stock} ${product.name} in stock!`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl || "",
          quantity,
        },
      ];
    });
  };

  const removeFromSellCart = (productId) =>
    setSellCart((prev) => prev.filter((i) => i.productId !== productId));

  const updateSellCartQty = (productId, quantity) => {
    if (quantity <= 0) return removeFromSellCart(productId);
    const product = products.find((p) => p.id === productId);
    if (product && quantity > product.stock) {
      alert(`Only ${product.stock} ${product.name} in stock!`);
      return;
    }
    setSellCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearSellCart = () => setSellCart([]);

  // ─── Pending Cart ─────────────────────────────────────────────────────────
  const addToPendingCart = (product, quantity = 1) => {
    if (!product || quantity <= 0) return;
    if (product.stock <= 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }
    setPendingCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: Number(product.price),
          quantity,
        },
      ];
    });
  };

  const removeFromPendingCart = (productId) =>
    setPendingCart((prev) => prev.filter((i) => i.productId !== productId));

  const clearPendingCart = () => setPendingCart([]);

  // ─── Checkout (Sell) ──────────────────────────────────────────────────────
  const checkout = async (paymentMethod = "Cash") => {
    if (sellCart.length === 0 || !user) return;
    const total = sellCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    try {
      await addDoc(collection(db, "sales"), {
        userEmail: user.email,
        paymentMethod,
        date: new Date().toISOString(),
        items: [...sellCart],
        total,
        status: "Paid",
      });

      for (const item of sellCart) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const newStock = Math.max(0, product.stock - item.quantity);
        await updateDoc(doc(db, "products", product.id), { stock: newStock });
      }

      setSellCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
      throw err;
    }
  };

  // ─── Pending Orders ───────────────────────────────────────────────────────
  const savePending = async (customerName, notes = "") => {
    if (pendingCart.length === 0) return;
    const total = pendingCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    try {
      await addDoc(collection(db, "pendingOrders"), {
        customerName: customerName || "Unknown",
        notes,
        date: new Date().toISOString(),
        items: [...pendingCart],
        total,
        status: "Pending",
      });
      setPendingCart([]);
    } catch (err) {
      console.error("Save pending failed:", err);
      throw err;
    }
  };

  const completePendingOrder = async (orderId, paymentMethod = "Cash") => {
    if (!user) return;
    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;

    // Guard: check stock is sufficient for all items
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stock < item.quantity) {
        alert(
          `Not enough stock for ${item.productName}. Available: ${product.stock}, Required: ${item.quantity}`
        );
        return;
      }
    }

    try {
      await addDoc(collection(db, "sales"), {
        userEmail: user.email,
        paymentMethod,
        date: new Date().toISOString(),
        items: order.items,
        total: order.total,
        status: "Paid",
        fromPending: true,
        customerName: order.customerName,
      });

      for (const item of order.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const newStock = Math.max(0, product.stock - item.quantity);
        await updateDoc(doc(db, "products", product.id), { stock: newStock });
      }

      await updateDoc(doc(db, "pendingOrders", orderId), {
        status: "Completed",
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Complete pending failed:", err);
      throw err;
    }
  };

  const cancelPendingOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, "pendingOrders", orderId), {
        status: "Cancelled",
        cancelledAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Cancel pending failed:", err);
      throw err;
    }
  };

  // ─── Clear Sales ──────────────────────────────────────────────────────────
const clearSales = async () => {
  try {
    // Delete all sales records
    for (const sale of sales) {
      await deleteDoc(doc(db, "sales", sale.id));
    }
    // Delete completed and cancelled pending orders
    for (const order of pendingOrders) {
      if (order.status === "Completed" || order.status === "Cancelled") {
        await deleteDoc(doc(db, "pendingOrders", order.id));
      }
    }
  } catch (err) {
    console.error("Clear sales failed:", err);
  }
};

  return (
    <POSContext.Provider
      value={{
        products,
        sales,
        pendingOrders,
        loading,
        lowStockThreshold: LOW_STOCK_THRESHOLD,

        // Sell cart
        sellCart,
        addToSellCart,
        removeFromSellCart,
        updateSellCartQty,
        clearSellCart,

        // Pending cart
        pendingCart,
        addToPendingCart,
        removeFromPendingCart,
        clearPendingCart,

        // Product CRUD
        addProduct,
        updateProduct,
        deleteProduct,

        // Sales
        checkout,
        clearSales,

        // Pending orders
        savePending,
        completePendingOrder,
        cancelPendingOrder,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => useContext(POSContext);
