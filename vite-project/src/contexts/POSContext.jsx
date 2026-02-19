import React, { createContext, useContext, useState, useEffect } from "react";

const POSContext = createContext();

export const POSProvider = ({ children }) => {
  const API_URL = "https://pos-gadget-source-4.onrender.com/api";

  /* ---------------- State ---------------- */
  const generateId = () => crypto.randomUUID();

  // Initialize user and token from localStorage only
const [user, setUser] = useState(() => {
  const saved = JSON.parse(localStorage.getItem("user"));
  return saved || null;   // do NOT inject a test user
});

const [token, setToken] = useState(() => localStorage.getItem("token") || "");


  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  /* ---------------- Sync token/user to localStorage ---------------- */
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  /* ---------------- Helper: fetch with auth ---------------- */
  const authFetch = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      setUser(null);
      setToken("");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      throw new Error("Session expired");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw err;
    }

    return res.json();
  };

/* ---------------- RELOGIN ---------------- */
const relogin = async (password) => {
  try {
    const res = await authFetch(`${API_URL}/relogin`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    // backend returns: { success: true, user: { id, username } }
    return { success: true, user: res.user };
  } catch (err) {
    return { success: false, error: err.error || "Incorrect password" };
  }
};

  /* ---------------- Load Data ---------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, salesData, pendingData] = await Promise.all([
          authFetch(`${API_URL}/products`),
          authFetch(`${API_URL}/sales`),
          authFetch(`${API_URL}/pending-orders`),
        ]);

        setProducts(productsData);
        setSales(salesData);
        setPendingOrders(pendingData);
      } catch (err) {
        console.error("Failed to load POS data", err);
      }
    };

    if (token) loadData();
  }, [token]);

  /* ---------------- PRODUCT MANAGEMENT ---------------- */
  const addProduct = async (product) => {
    try {
      const saved = await authFetch(`${API_URL}/products`, {
        method: "POST",
        body: JSON.stringify({
          ...product,
          id: product.id || generateId(),
          stock: Number(product.stock || 0),
          price: Number(product.price || 0),
        }),
      });
      setProducts((prev) => [...prev, saved]);
    } catch (err) {
      console.error("Add product failed", err);
    }
  };

  const updateProduct = async (id, updated) => {
    try {
      await authFetch(`${API_URL}/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updated),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error("Update product failed", err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await authFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete product failed", err);
    }
  };

  /* ---------------- CART ---------------- */
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

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  const updateCartItemQuantity = (productId, quantity) =>
    quantity <= 0
      ? removeFromCart(productId)
      : setCart((prev) =>
          prev.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          )
        );

  const clearCart = () => setCart([]);

  /* ---------------- CHECKOUT ---------------- */
  const checkout = async (paymentMethod = "Cash") => {
    if (cart.length === 0) return;

    if (!user?.id) {
      alert("No user available for checkout.");
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newSale = {
      id: generateId(),
      userId: user.id,
      userName: user.username,
      paymentMethod,
      date: new Date().toISOString(),
      items: [...cart],
      total,
      status: "Paid",
    };

    try {
      const saved = await authFetch(`${API_URL}/sales`, {
        method: "POST",
        body: JSON.stringify(newSale),
      });
      setSales((prev) => [...prev, saved]);

      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((i) => i.productId === p.id);
          if (!cartItem) return p;
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        })
      );

      setCart([]);
    } catch (err) {
      console.error("Checkout failed", err);
    }
  };

  /* ---------------- PENDING ORDERS ---------------- */
  const savePending = async (customerName, notes = "") => {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newPending = {
      id: generateId(),
      customerName: customerName || "Unknown",
      notes,
      date: new Date().toISOString(),
      items: [...cart],
      total,
      status: "Pending",
    };

    try {
      const saved = await authFetch(`${API_URL}/pending-orders`, {
        method: "POST",
        body: JSON.stringify(newPending),
      });
      setPendingOrders((prev) => [...prev, saved]);
      setCart([]);
    } catch (err) {
      console.error("Save pending failed", err);
    }
  };

  const completePendingOrder = async (orderId, paymentMethod = "Cash") => {
    if (!user?.id) {
      alert("No user available for completing order.");
      return;
    }

    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;

    const completedSale = {
      id: generateId(),
      userId: user.id,
      userName: user.username,
      paymentMethod,
      date: new Date().toISOString(),
      items: order.items,
      total: order.total,
      status: "Paid",
    };

    try {
      const saved = await authFetch(`${API_URL}/sales`, {
        method: "POST",
        body: JSON.stringify(completedSale),
      });
      setSales((prev) => [...prev, saved]);

      setProducts((prev) =>
        prev.map((p) => {
          const item = order.items.find((i) => i.productId === p.id);
          if (!item) return p;
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        })
      );

      await authFetch(`${API_URL}/pending-orders/${orderId}`, { method: "DELETE" });
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Complete pending failed", err);
    }
  };

  const cancelPendingOrder = async (orderId) => {
    try {
      await authFetch(`${API_URL}/pending-orders/${orderId}`, { method: "DELETE" });
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Cancel pending failed", err);
    }
  };

  /* ---------------- PROVIDER ---------------- */
  return (
    <POSContext.Provider
      value={{
        products,
        cart,
        sales,
        pendingOrders,
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
        user,
        setUser,
        token,
        setToken,
         relogin,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => useContext(POSContext);
