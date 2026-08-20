import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

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

// ─── Cloudinary config ───────────────────────────────────────────────

const CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// =====================================================================
// POS PROVIDER
// =====================================================================

export const POSProvider = ({ children }) => {
  const { user } = useAuth();

  // ===================================================================
  // STATE
  // ===================================================================

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [pendingOrders, setPendingOrders] =
    useState([]);

  // Separate carts
  const [sellCart, setSellCart] = useState([]);
  const [pendingCart, setPendingCart] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const LOW_STOCK_THRESHOLD = 3;

  // ===================================================================
  // FIRESTORE LISTENERS
  // ===================================================================

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSales([]);
      setPendingOrders([]);
      setLoading(false);
      return;
    }

    // ---------------------------------------------------------------
    // PRODUCTS
    // ---------------------------------------------------------------

    const unsubProducts = onSnapshot(
      query(
        collection(db, "products"),
        orderBy("name")
      ),
      (snap) => {
        setProducts(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );

        setLoading(false);
      },
      (err) => {
        console.error(
          "Products error:",
          err
        );

        setLoading(false);
      }
    );

    // ---------------------------------------------------------------
    // SALES
    // ---------------------------------------------------------------

    const unsubSales = onSnapshot(
      query(
        collection(db, "sales"),
        orderBy("date", "desc")
      ),
      (snap) => {
        setSales(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      },
      (err) => {
        console.error(
          "Sales error:",
          err
        );
      }
    );

    // ---------------------------------------------------------------
    // PENDING ORDERS
    // ---------------------------------------------------------------

    const unsubPending = onSnapshot(
      query(
        collection(db, "pendingOrders"),
        orderBy("date", "desc")
      ),
      (snap) => {
        setPendingOrders(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      },
      (err) => {
        console.error(
          "Pending orders error:",
          err
        );
      }
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubPending();
    };
  }, [user]);

  // ===================================================================
  // CLOUDINARY IMAGE UPLOAD
  // ===================================================================

  const uploadProductImage = async (file) => {
    if (!file) return "";

    try {
      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "upload_preset",
        UPLOAD_PRESET
      );

      formData.append(
        "folder",
        "pos-products"
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error(
          "Cloudinary upload failed"
        );
      }

      const data = await res.json();

      return data.secure_url;
    } catch (err) {
      console.error(
        "Image upload failed:",
        err
      );

      return "";
    }
  };

  // ===================================================================
  // PRODUCTS
  // ===================================================================

  const addProduct = async (
    product,
    imageFile = null
  ) => {
    try {
      const imageUrl = imageFile
        ? await uploadProductImage(
            imageFile
          )
        : "";

      await addDoc(
        collection(db, "products"),
        {
          name: product.name || "",
          price: Number(
            product.price || 0
          ),
          stock: Number(
            product.stock || 0
          ),
          category:
            product.category || "",
          sku: product.sku || "",
          imageUrl,
          createdAt:
            serverTimestamp(),
        }
      );
    } catch (err) {
      console.error(
        "Add product failed:",
        err
      );

      throw err;
    }
  };

  const updateProduct = async (
    id,
    updated,
    imageFile = null
  ) => {
    try {
      const imageUrl = imageFile
        ? await uploadProductImage(
            imageFile
          )
        : updated.imageUrl || "";

      await updateDoc(
        doc(db, "products", id),
        {
          ...updated,
          imageUrl,
        }
      );
    } catch (err) {
      console.error(
        "Update product failed:",
        err
      );

      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteDoc(
        doc(db, "products", id)
      );
    } catch (err) {
      console.error(
        "Delete product failed:",
        err
      );

      throw err;
    }
  };

  // ===================================================================
  // SELL CART
  // ===================================================================

  const addToSellCart = (
    product,
    quantity = 1
  ) => {
    if (
      !product ||
      quantity <= 0
    ) {
      return;
    }

    if (product.stock <= 0) {
      alert(
        `${product.name} is out of stock!`
      );

      return;
    }

    setSellCart((prev) => {
      const existing =
        prev.find(
          (i) =>
            i.productId ===
            product.id
        );

      if (existing) {
        const newQty =
          existing.quantity +
          quantity;

        if (
          newQty >
          product.stock
        ) {
          alert(
            `Only ${product.stock} ${product.name} in stock!`
          );

          return prev;
        }

        return prev.map((i) =>
          i.productId ===
          product.id
            ? {
                ...i,
                quantity:
                  newQty,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          productId:
            product.id,
          productName:
            product.name,
          price: Number(
            product.price
          ),
          imageUrl:
            product.imageUrl ||
            "",
          quantity,
        },
      ];
    });
  };

  const removeFromSellCart = (
    productId
  ) =>
    setSellCart((prev) =>
      prev.filter(
        (i) =>
          i.productId !==
          productId
      )
    );

  const updateSellCartQty = (
    productId,
    quantity
  ) => {
    if (quantity <= 0) {
      return removeFromSellCart(
        productId
      );
    }

    const product =
      products.find(
        (p) =>
          p.id === productId
      );

    if (
      product &&
      quantity > product.stock
    ) {
      alert(
        `Only ${product.stock} ${product.name} in stock!`
      );

      return;
    }

    setSellCart((prev) =>
      prev.map((i) =>
        i.productId ===
        productId
          ? {
              ...i,
              quantity,
            }
          : i
      )
    );
  };

  const clearSellCart = () =>
    setSellCart([]);

  // ===================================================================
  // PENDING CART
  // ===================================================================

  const addToPendingCart = (
    product,
    quantity = 1
  ) => {
    if (
      !product ||
      quantity <= 0
    ) {
      return;
    }

    if (product.stock <= 0) {
      alert(
        `${product.name} is out of stock!`
      );

      return;
    }

    setPendingCart((prev) => {
      const existing =
        prev.find(
          (i) =>
            i.productId ===
            product.id
        );

      if (existing) {
        const newQty =
          existing.quantity +
          quantity;

        return prev.map((i) =>
          i.productId ===
          product.id
            ? {
                ...i,
                quantity:
                  newQty,
              }
            : i
        );
      }

      return [
        ...prev,
        {
          productId:
            product.id,
          productName:
            product.name,
          price: Number(
            product.price
          ),
          quantity,
        },
      ];
    });
  };

  const removeFromPendingCart = (
    productId
  ) =>
    setPendingCart((prev) =>
      prev.filter(
        (i) =>
          i.productId !==
          productId
      )
    );

  const clearPendingCart = () =>
    setPendingCart([]);

  // ===================================================================
  // NORMAL CHECKOUT
  // ===================================================================

  const checkout = async (
    paymentMethod = "Cash"
  ) => {
    if (
      sellCart.length === 0 ||
      !user
    ) {
      return;
    }

    const total =
      sellCart.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      );

    try {
      await addDoc(
        collection(db, "sales"),
        {
          userEmail:
            user.email,
          paymentMethod,
          date: new Date().toISOString(),
          items: [
            ...sellCart,
          ],
          total,
          status: "Paid",
        }
      );

      for (const item of sellCart) {
        const product =
          products.find(
            (p) =>
              p.id ===
              item.productId
          );

        if (!product) continue;

        const newStock =
          Math.max(
            0,
            product.stock -
              item.quantity
          );

        await updateDoc(
          doc(
            db,
            "products",
            product.id
          ),
          {
            stock: newStock,
          }
        );
      }

      setSellCart([]);
    } catch (err) {
      console.error(
        "Checkout failed:",
        err
      );

      throw err;
    }
  };

  // ===================================================================
  // SAVE PENDING ORDER
  // ===================================================================

  const savePending = async (
    customerName,
    notes = ""
  ) => {
    if (
      pendingCart.length === 0
    ) {
      return;
    }

    const total =
      pendingCart.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      );

    try {
      await addDoc(
        collection(
          db,
          "pendingOrders"
        ),
        {
          customerName:
            customerName ||
            "Unknown",

          notes,

          date: new Date().toISOString(),

          items: [
            ...pendingCart,
          ],

          total,

          status: "Pending",
        }
      );

      setPendingCart([]);
    } catch (err) {
      console.error(
        "Save pending failed:",
        err
      );

      throw err;
    }
  };

  // ===================================================================
  // COMPLETE ENTIRE PENDING ORDER
  // ===================================================================

  const completePendingOrder =
    async (
      orderId,
      paymentMethod = "Cash"
    ) => {
      if (!user) return;

      const order =
        pendingOrders.find(
          (o) =>
            o.id === orderId
        );

      if (!order) return;

      // Check stock for all items
      for (const item of order.items ||
        []) {
        const product =
          products.find(
            (p) =>
              p.id ===
              item.productId
          );

        if (
          product &&
          product.stock <
            item.quantity
        ) {
          alert(
            `Not enough stock for ${item.productName}. Available: ${product.stock}, Required: ${item.quantity}`
          );

          return;
        }
      }

      try {
        // Record sale
        await addDoc(
          collection(db, "sales"),
          {
            userEmail:
              user.email,

            paymentMethod,

            date: new Date().toISOString(),

            items:
              order.items,

            total:
              order.total,

            status: "Paid",

            fromPending: true,

            customerName:
              order.customerName,
          }
        );

        // Reduce stock
        for (const item of order.items ||
          []) {
          const product =
            products.find(
              (p) =>
                p.id ===
                item.productId
            );

          if (!product)
            continue;

          const newStock =
            Math.max(
              0,
              product.stock -
                item.quantity
            );

          await updateDoc(
            doc(
              db,
              "products",
              product.id
            ),
            {
              stock: newStock,
            }
          );
        }

        // Mark entire order completed
        await updateDoc(
          doc(
            db,
            "pendingOrders",
            orderId
          ),
          {
            status:
              "Completed",

            completedAt:
              new Date().toISOString(),
          }
        );
      } catch (err) {
        console.error(
          "Complete pending failed:",
          err
        );

        throw err;
      }
    };

  // ===================================================================
  // CANCEL ENTIRE PENDING ORDER
  // ===================================================================

  const cancelPendingOrder =
    async (orderId) => {
      try {
        await updateDoc(
          doc(
            db,
            "pendingOrders",
            orderId
          ),
          {
            status:
              "Cancelled",

            cancelledAt:
              new Date().toISOString(),
          }
        );
      } catch (err) {
        console.error(
          "Cancel pending failed:",
          err
        );

        throw err;
      }
    };

  // ===================================================================
  // COMPLETE ONE ITEM ONLY
  // ===================================================================

  const completePendingItem =
    async (
      orderId,
      itemId,
      paymentMethod = "Cash"
    ) => {
      if (!user) {
        throw new Error(
          "User is not authenticated"
        );
      }

      const order =
        pendingOrders.find(
          (o) =>
            o.id === orderId
        );

      if (!order) {
        throw new Error(
          "Pending order not found"
        );
      }

      const items =
        order.items || [];

      /*
       * We support item.id, item.itemId
       * or productId because your older
       * pending records may not have an
       * explicit item ID.
       */

      const itemIndex =
        items.findIndex(
          (item) =>
            item.id === itemId ||
            item.itemId ===
              itemId ||
            item.productId ===
              itemId
        );

      if (
        itemIndex === -1
      ) {
        throw new Error(
          "Pending item not found"
        );
      }

      const item =
        items[itemIndex];

      const product =
        products.find(
          (p) =>
            p.id ===
            item.productId
        );

      if (!product) {
        throw new Error(
          `Product ${item.productName} not found`
        );
      }

      // ---------------------------------------------------------------
      // CHECK STOCK
      // ---------------------------------------------------------------

      if (
        product.stock <
        item.quantity
      ) {
        throw new Error(
          `Not enough stock for ${item.productName}. Available: ${product.stock}, Required: ${item.quantity}`
        );
      }

      const itemTotal =
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 0
        );

      try {
        // -------------------------------------------------------------
        // RECORD THIS ITEM AS A SALE
        // -------------------------------------------------------------

        await addDoc(
          collection(db, "sales"),
          {
            userEmail:
              user.email,

            paymentMethod,

            date: new Date().toISOString(),

            items: [
              {
                ...item,
              },
            ],

            total: itemTotal,

            status: "Paid",

            fromPending: true,

            customerName:
              order.customerName,

            pendingOrderId:
              orderId,

            pendingItemId:
              itemId,
          }
        );

        // -------------------------------------------------------------
        // REDUCE STOCK FOR THIS ITEM ONLY
        // -------------------------------------------------------------

        const newStock =
          Math.max(
            0,
            product.stock -
              item.quantity
          );

        await updateDoc(
          doc(
            db,
            "products",
            product.id
          ),
          {
            stock: newStock,
          }
        );

        // -------------------------------------------------------------
        // CREATE A SEPARATE COMPLETED RECORD
        //
        // This allows Honda to be completed while
        // Prado remains pending.
        // -------------------------------------------------------------

        await addDoc(
          collection(
            db,
            "pendingOrders"
          ),
          {
            customerName:
              order.customerName,

            notes:
              order.notes || "",

            date:
              order.date ||
              new Date().toISOString(),

            items: [
              {
                ...item,
              },
            ],

            total: itemTotal,

            status:
              "Completed",

            completedAt:
              new Date().toISOString(),

            fromPendingItem:
              true,

            originalOrderId:
              orderId,

            originalItemId:
              itemId,
          }
        );

        // -------------------------------------------------------------
        // REMOVE THE COMPLETED ITEM FROM THE ORIGINAL PENDING ORDER
        // -------------------------------------------------------------

        const remainingItems =
          items.filter(
            (_, index) =>
              index !==
              itemIndex
          );

        if (
          remainingItems.length ===
          0
        ) {
          // No pending items remain.
          // Remove the original pending order.
          await deleteDoc(
            doc(
              db,
              "pendingOrders",
              orderId
            )
          );
        } else {
          // Recalculate remaining total
          const remainingTotal =
            remainingItems.reduce(
              (sum, remainingItem) =>
                sum +
                Number(
                  remainingItem.price ||
                    0
                ) *
                  Number(
                    remainingItem.quantity ||
                      0
                  ),
              0
            );

          await updateDoc(
            doc(
              db,
              "pendingOrders",
              orderId
            ),
            {
              items:
                remainingItems,

              total:
                remainingTotal,

              status:
                "Pending",
            }
          );
        }
      } catch (err) {
        console.error(
          "Complete pending item failed:",
          err
        );

        throw err;
      }
    };

  // ===================================================================
  // CANCEL ONE ITEM ONLY
  // ===================================================================

  const cancelPendingItem =
    async (
      orderId,
      itemId
    ) => {
      const order =
        pendingOrders.find(
          (o) =>
            o.id === orderId
        );

      if (!order) {
        throw new Error(
          "Pending order not found"
        );
      }

      const items =
        order.items || [];

      const itemIndex =
        items.findIndex(
          (item) =>
            item.id === itemId ||
            item.itemId ===
              itemId ||
            item.productId ===
              itemId
        );

      if (
        itemIndex === -1
      ) {
        throw new Error(
          "Pending item not found"
        );
      }

      const item =
        items[itemIndex];

      const itemTotal =
        Number(
          item.price || 0
        ) *
        Number(
          item.quantity || 0
        );

      try {
        // -------------------------------------------------------------
        // CREATE SEPARATE CANCELLED RECORD
        // -------------------------------------------------------------

        await addDoc(
          collection(
            db,
            "pendingOrders"
          ),
          {
            customerName:
              order.customerName,

            notes:
              order.notes || "",

            date:
              order.date ||
              new Date().toISOString(),

            items: [
              {
                ...item,
              },
            ],

            total: itemTotal,

            status:
              "Cancelled",

            cancelledAt:
              new Date().toISOString(),

            fromPendingItem:
              true,

            originalOrderId:
              orderId,

            originalItemId:
              itemId,
          }
        );

        // -------------------------------------------------------------
        // REMOVE THIS ITEM FROM PENDING ORDER
        // -------------------------------------------------------------

        const remainingItems =
          items.filter(
            (_, index) =>
              index !==
              itemIndex
          );

        if (
          remainingItems.length ===
          0
        ) {
          // No items left
          await deleteDoc(
            doc(
              db,
              "pendingOrders",
              orderId
            )
          );
        } else {
          const remainingTotal =
            remainingItems.reduce(
              (sum, remainingItem) =>
                sum +
                Number(
                  remainingItem.price ||
                    0
                ) *
                  Number(
                    remainingItem.quantity ||
                      0
                  ),
              0
            );

          await updateDoc(
            doc(
              db,
              "pendingOrders",
              orderId
            ),
            {
              items:
                remainingItems,

              total:
                remainingTotal,

              status:
                "Pending",
            }
          );
        }
      } catch (err) {
        console.error(
          "Cancel pending item failed:",
          err
        );

        throw err;
      }
    };

  // ===================================================================
  // DELETE ONE COMPLETED / CANCELLED RECORD
  // ===================================================================

  const deletePendingOrder =
    async (orderId) => {
      if (!orderId) {
        throw new Error(
          "Invalid pending order ID"
        );
      }

      try {
        await deleteDoc(
          doc(
            db,
            "pendingOrders",
            orderId
          )
        );
      } catch (err) {
        console.error(
          "Delete pending order failed:",
          err
        );

        throw err;
      }
    };

  // ===================================================================
  // CLEAR SALES
  // ===================================================================

  const clearSales = async () => {
    try {
      // Delete all sales
      for (const sale of sales) {
        await deleteDoc(
          doc(
            db,
            "sales",
            sale.id
          )
        );
      }

      // Delete completed/cancelled
      // pending history
      for (const order of pendingOrders) {
        if (
          order.status ===
            "Completed" ||
          order.status ===
            "Cancelled"
        ) {
          await deleteDoc(
            doc(
              db,
              "pendingOrders",
              order.id
            )
          );
        }
      }
    } catch (err) {
      console.error(
        "Clear sales failed:",
        err
      );

      throw err;
    }
  };

  // ===================================================================
  // PROVIDER
  // ===================================================================

  return (
    <POSContext.Provider
      value={{
        // -------------------------------------------------------------
        // General
        // -------------------------------------------------------------

        products,
        sales,
        pendingOrders,
        loading,

        lowStockThreshold:
          LOW_STOCK_THRESHOLD,

        // -------------------------------------------------------------
        // Sell cart
        // -------------------------------------------------------------

        sellCart,

        addToSellCart,

        removeFromSellCart,

        updateSellCartQty,

        clearSellCart,

        // -------------------------------------------------------------
        // Pending cart
        // -------------------------------------------------------------

        pendingCart,

        addToPendingCart,

        removeFromPendingCart,

        clearPendingCart,

        // -------------------------------------------------------------
        // Products
        // -------------------------------------------------------------

        addProduct,

        updateProduct,

        deleteProduct,

        // -------------------------------------------------------------
        // Sales
        // -------------------------------------------------------------

        checkout,

        clearSales,

        // -------------------------------------------------------------
        // Pending orders
        // -------------------------------------------------------------

        savePending,

        // Whole order actions
        completePendingOrder,

        cancelPendingOrder,

        // Individual item actions
        completePendingItem,

        cancelPendingItem,

        // Delete completed/cancelled record
        deletePendingOrder,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

// =====================================================================
// usePOS HOOK
// =====================================================================

export const usePOS = () =>
  useContext(POSContext);