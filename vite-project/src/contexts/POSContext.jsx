import React, { createContext, useContext, useState, useEffect } from "react";

const POSContext = createContext();

export const POSProvider = ({ children }) => {
  const API_URL = "https://pos-gadget-source-4.onrender.com/api";

  /* ---------------- Helpers ---------------- */
  const generateId = () => crypto.randomUUID();

  const authFetch = async (url, options = {}) => {
    const currentToken = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      ...options.headers,
    };
    
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      // Clear session if unauthorized
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

  /* ---------------- State ---------------- */
  const [user, setUser] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("user"));
    return saved || null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [passwordMemory, setPasswordMemory] = useState("");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  /* ---------------- Sync user/token ---------------- */
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  /* ---------------- LOGIN ---------------- */
  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }).then(r => r.json());

      if (res.token) {
        setUser(res.user);
        setToken(res.token);
        setPasswordMemory(password); 
        return { success: true };
      } else {
        return { success: false, error: res.error || "Login failed" };
      }
    } catch (err) {
      return { success: false, error: "Login failed" };
    }
  };

  const unlockDashboard = async (password) => {
  try {
    const res = await authFetch(`${API_URL}/unlock-dashboard`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.error || "Unlock failed" };
  }
};


  /* ---------------- CHANGE PASSWORD ---------------- */
  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await authFetch(`${API_URL}/change-password`, {
        method: "POST",
        body: JSON.stringify({ current_password: oldPassword, new_password: newPassword }),
      });
      setPasswordMemory(newPassword);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.error || "Password change failed" };
    }
  };

  /* ---------------- LOAD DATA ---------------- */
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
      setProducts(prev => [...prev, saved]);
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
      setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
    } catch (err) {
      console.error("Update product failed", err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await authFetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete product failed", err);
    }
  };

  /* ---------------- CART ---------------- */
  const addToCart = (product, quantity = 1) => {
    if (!product || quantity <= 0) return;
    if (product.stock <= 0) return alert(`${product.name} is out of stock!`);

    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          alert(`Only ${product.stock} ${product.name} left!`);
          return prev;
        }
        return prev.map(i => (i.productId === product.id ? { ...i, quantity: newQty } : i));
      }
      return [...prev, { productId: product.id, productName: product.name, price: Number(product.price), quantity }];
    });
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));
  const updateCartItemQuantity = (productId, quantity) =>
    quantity <= 0 ? removeFromCart(productId) : setCart(prev => prev.map(i => (i.productId === productId ? { ...i, quantity } : i)));
  const clearCart = () => setCart([]);

  const checkout = async (paymentMethod = "Cash") => {
  if (cart.length === 0 || !user?.id) return;

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
    // 1️⃣ Save sale
    const saved = await authFetch(`${API_URL}/sales`, {
      method: "POST",
      body: JSON.stringify(newSale),
    });

    setSales(prev => [...prev, saved]);

    // 2️⃣ Update stock in backend
for (const item of newSale.items) {
  const product = products.find(p => p.id === item.productId);
  if (!product) continue;

  const newStock = Math.max(0, product.stock - item.quantity);

  await authFetch(`${API_URL}/products/${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ stock: newStock }),
  });
}

// Reload products from backend
const updatedProducts = await authFetch(`${API_URL}/products`);
setProducts(updatedProducts);
    setCart([]);

  } catch (err) {
    console.error("Checkout failed", err);
  }
};
  /* ---------------- PENDING ORDERS ---------------- */
  const savePending = async (customerName, notes = "") => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newPending = { id: generateId(), customerName: customerName || "Unknown", notes, date: new Date().toISOString(), items: [...cart], total, status: "Pending" };

    try {
      const saved = await authFetch(`${API_URL}/pending-orders`, { method: "POST", body: JSON.stringify(newPending) });
      setPendingOrders(prev => [...prev, saved]);
      setCart([]);
    } catch (err) {
      console.error("Save pending failed", err);
    }
  };

  const completePendingOrder = async (orderId, paymentMethod = "Cash") => {
    if (!user?.id) return;

    const order = pendingOrders.find(o => o.id === orderId);
    if (!order) return;

    const completedSale = { id: generateId(), userId: user.id, userName: user.username, paymentMethod, date: new Date().toISOString(), items: order.items, total: order.total, status: "Paid" };

    try {
      const saved = await authFetch(`${API_URL}/sales`, { method: "POST", body: JSON.stringify(completedSale) });
      setSales(prev => [...prev, saved]);

      setProducts(prev =>
        prev.map(p => {
          const item = order.items.find(i => i.productId === p.id);
          if (!item) return p;
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        })
      );

      await authFetch(`${API_URL}/pending-orders/${orderId}`, { method: "DELETE" });
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Complete pending failed", err);
    }
  };

  const cancelPendingOrder = async (orderId) => {
    try {
      await authFetch(`${API_URL}/pending-orders/${orderId}`, { method: "DELETE" });
      setPendingOrders(prev => prev.filter(o => o.id !== orderId));
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
        login,
         unlockDashboard,
        changePassword,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => useContext(POSContext);
