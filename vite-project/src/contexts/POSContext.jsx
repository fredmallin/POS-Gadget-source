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

export const POSProvider = ({ children }) => {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

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
      (snap) => setPendingOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Pending orders error:", err)
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubPending();
    };
  }, [user]);

  const addProduct = async (product) => {
    try {
      await addDoc(collection(db, "products"), {
        name: product.name || "",
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        category: product.category || "",
        image: product.image || "",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Add product failed:", err);
    }
  };

  const updateProduct = async (id, updated) => {
    try {
      await updateDoc(doc(db, "products", id), updated);
    } catch (err) {
      console.error("Update product failed:", err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("Delete product failed:", err);
    }
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || quantity <= 0) return;
    if (product.stock <= 0) return alert(`${product.name} is out of stock!`);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          alert(`Only ${product.stock} ${product.name} left!`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: Number(product.price),
        quantity,
      }];
    });
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  const updateCartItemQuantity = (productId, quantity) =>
    quantity <= 0
      ? removeFromCart(productId)
      : setCart((prev) =>
          prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        );

  const clearCart = () => setCart([]);

  const checkout = async (paymentMethod = "Cash") => {
    if (cart.length === 0 || !user) return;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    try {
      await addDoc(collection(db, "sales"), {
        userEmail: user.email,
        paymentMethod,
        date: new Date().toISOString(),
        items: [...cart],
        total,
        status: "Paid",
      });
      for (const item of cart) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const newStock = Math.max(0, product.stock - item.quantity);
        await updateDoc(doc(db, "products", product.id), { stock: newStock });
      }
      setCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  const savePending = async (customerName, notes = "") => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    try {
      await addDoc(collection(db, "pendingOrders"), {
        customerName: customerName || "Unknown",
        notes,
        date: new Date().toISOString(),
        items: [...cart],
        total,
        status: "Pending",
      });
      setCart([]);
    } catch (err) {
      console.error("Save pending failed:", err);
    }
  };

  const completePendingOrder = async (orderId, paymentMethod = "Cash") => {
    if (!user) return;
    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;
    try {
      await addDoc(collection(db, "sales"), {
        userEmail: user.email,
        paymentMethod,
        date: new Date().toISOString(),
        items: order.items,
        total: order.total,
        status: "Paid",
      });
      for (const item of order.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) continue;
        const newStock = Math.max(0, product.stock - item.quantity);
        await updateDoc(doc(db, "products", product.id), { stock: newStock });
      }
      await deleteDoc(doc(db, "pendingOrders", orderId));
    } catch (err) {
      console.error("Complete pending failed:", err);
    }
  };

  const cancelPendingOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "pendingOrders", orderId));
    } catch (err) {
      console.error("Cancel pending failed:", err);
    }
  };

  const clearSales = async () => {
    try {
      for (const sale of sales) {
        await deleteDoc(doc(db, "sales", sale.id));
      }
    } catch (err) {
      console.error("Clear sales failed:", err);
    }
  };

  return (
    <POSContext.Provider value={{
      products,
      cart,
      sales,
      pendingOrders,
      loading,
      addProduct,
      updateProduct,
      deleteProduct,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      clearSales,
      checkout,
      savePending,
      completePendingOrder,
      cancelPendingOrder,
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => useContext(POSContext);