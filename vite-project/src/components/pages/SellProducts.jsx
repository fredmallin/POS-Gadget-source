import React, { useState } from "react";
import { usePOS } from "../../contexts/POSContext";
import { useAuth } from "../../contexts/AuthContext";
import { Search, Trash2, Plus, Minus } from "lucide-react";
import "../../index.css";

const SellProducts = () => {
  const {
    products = [],
    cart = [],
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    checkout,
    clearCart,
  } = usePOS();

  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(term) ||
      (p.sku || "").toLowerCase().includes(term) ||
      (p.category || "").toLowerCase().includes(term)
    );
  });

  const handleAddToCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      alert("Product out of stock");
      return;
    }

    const cartItem = cart.find((item) => item.productId === productId);
    const currentQty = cartItem ? cartItem.quantity : 0;

    if (currentQty >= product.stock) {
      alert("Not enough stock available");
      return;
    }

    addToCart(product, 1);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    if (!user) {
      alert("User not logged in");
      return;
    }

    checkout(paymentMethod);
    setPaymentMethod("Cash");
  };

  return (
    <div className="sell-page">
      <h1>Sell Products</h1>
      <p>Search for products and add them to cart</p>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name, SKU, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="sell-layout">

        <div className="products-section">
          {filteredProducts.length === 0 ? (
            <p>No products found</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">

      
                <img
                  src={product.imageUrl || "https://picsum.photos/150"}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "140px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://picsum.photos/150"; 
                  }}
                />


                <h3>{product.name}</h3>
                <p>{product.category}</p>
                {product.sku && <p>SKU: {product.sku}</p>}
                <p className="price">${Number(product.price).toFixed(2)}</p>
                <p>Stock: {product.stock}</p>

                <button
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-section">
          <h2>Cart ({cart.length})</h2>

          {cart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div>
                    <strong>{item.productName}</strong>
                    <p>${item.price.toFixed(2)} each</p>
                  </div>

                  <div className="cart-controls">
                    <button
                      onClick={() =>
                        updateCartItemQuantity(
                          item.productId,
                          item.quantity - 1
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateCartItemQuantity(
                          item.productId,
                          item.quantity + 1
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>

                    <button onClick={() => removeFromCart(item.productId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <h3>Total: ${cartTotal.toFixed(2)}</h3>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Mobile Payment</option>
              </select>

              <button onClick={handleCheckout}>Checkout</button>
              <button onClick={clearCart}>Clear Cart</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SellProducts;
