import React, { createContext, useContext, useState, useEffect } from "react";

const POSContext = createContext();

/* ---------------- Helpers ---------------- */
const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

/* ---------------- Provider ---------------- */
export const POSProvider = ({ children }) => {
  // State
  const [products, setProducts] = useState(() =>
    loadFromStorage("products", [])
  );
  const [cart, setCart] = useState(() => loadFromStorage("cart", []));
  const [sales, setSales] = useState(() => loadFromStorage("sales", []));

  // Persist state
  useEffect(() => saveToStorage("products", products), [products]);
  useEffect(() => saveToStorage("cart", cart), [cart]);
  useEffect(() => saveToStorage("sales", sales), [sales]);

  /* ---------------- Products ---------------- */
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: product.id || Date.now().toString(),
      stock: Number(product.stock || 0),
      price: Number(product.price || 0),
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (id, updated) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const reduceStock = (productId, quantity) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stock: Math.max(0, p.stock - quantity) }
          : p
      )
    );
  };

  /* ---------------- Cart ---------------- */
  const addToCart = (product, quantity = 1) => {
    if (!product || quantity <= 0) return;

    // Prevent adding if out of stock
    if (product.stock <= 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.stock) {
          alert(`Only ${product.stock} ${product.name} left in stock!`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
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

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  /* ---------------- Checkout ---------------- */
  const checkout = (userId, userName, paymentMethod = "Cash") => {
    if (cart.length === 0) return;

    // Reduce stock
    cart.forEach((item) => reduceStock(item.productId, item.quantity));

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newSale = {
      id: Date.now().toString(),
      userId,
      userName,
      paymentMethod,
      date: new Date().toISOString(),
      items: [...cart],
      total,
      status: "Paid",
    };

    setSales((prev) => [...prev, newSale]);
    setCart([]);
  };

  /* ---------------- Pending Orders ---------------- */
  const savePending = (userId, userName) => {
    if (cart.length === 0) return;

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const newPending = {
      id: Date.now().toString(),
      userId,
      userName,
      date: new Date().toISOString(),
      items: [...cart],
      total,
      status: "Pending",
    };

    setSales((prev) => [...prev, newPending]);
    setCart([]);
  };

  const completePendingOrder = (orderId) => {
    const order = sales.find((o) => o.id === orderId);
    if (!order) return;

    // Reduce stock
    order.items.forEach((item) => reduceStock(item.productId, item.quantity));

    // Update order status
    setSales((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "Paid" } : o))
    );
  };

  const cancelPendingOrder = (orderId) => {
    setSales((prev) => prev.filter((o) => o.id !== orderId));
  };

  /* ---------------- Provider ---------------- */
  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        sales,
        addProduct,
        updateProduct,
        deleteProduct,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        checkout,
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
