import React, { useState } from 'react';
import { usePOS } from '../../contexts/POSContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import '../../index.css';

const SellProducts = () => {
  const {
    products = [],
    sellCart = [],
    addToSellCart,
    removeFromSellCart,
    updateSellCartQty,
    checkout,
    clearSellCart,
  } = usePOS();

  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [checkingOut, setCheckingOut] = useState(false);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  });

  const handleAddToCart = (product) => {
    if (!product) return;
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    const cartItem = sellCart.find((i) => i.productId === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (currentQty >= product.stock) {
      toast.error(`Only ${product.stock} in stock`);
      return;
    }
    // Pass the full product object — POSContext handles the shape
    addToSellCart(product, 1);
  };

  const cartTotal = sellCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (sellCart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to checkout');
      return;
    }
    setCheckingOut(true);
    try {
      await checkout(paymentMethod);
      toast.success('Sale completed!');
      setPaymentMethod('Cash');
    } catch (err) {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
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

        {/* Products Grid */}
        <div className="products-section">
          {filteredProducts.length === 0 ? (
            <p>No products found</p>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.imageUrl || 'https://placehold.co/150x140?text=No+Image'}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '10px',
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/150x140?text=No+Image';
                  }}
                />
                <h3>{product.name}</h3>
                <p>{product.category}</p>
                {product.sku && <p>SKU: {product.sku}</p>}
                <p className="price">Ksh{Number(product.price).toFixed(2)}</p>
                <p>Stock: {product.stock}</p>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart */}
        <div className="cart-section">
          <h2>Cart ({sellCart.length})</h2>

          {sellCart.length === 0 ? (
            <p>Cart is empty</p>
          ) : (
            <>
              {sellCart.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div>
                    <strong>{item.productName}</strong>
                    <p>Ksh{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="cart-controls">
                    <button
                      onClick={() =>
                        updateSellCartQty(item.productId, item.quantity - 1)
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateSellCartQty(item.productId, item.quantity + 1)
                      }
                    >
                      <Plus size={14} />
                    </button>
                    <button onClick={() => removeFromSellCart(item.productId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <h3>Total: Ksh{cartTotal.toFixed(2)}</h3>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>Card</option>
                <option>Mobile Payment</option>
              </select>

              <button onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? 'Processing...' : 'Checkout'}
              </button>
              <button onClick={clearSellCart} disabled={checkingOut}>
                Clear Cart
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SellProducts;
