// Simple Express.js application for discount code demo
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files
app.use(express.static('public'));

// Global cart for demonstration
const globalCart = {
  itemName: 'Premium Product',
  originalPrice: 100,
  currentPrice: 100,
  discountsApplied: []
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// API to get cart state
app.get('/api/cart', (req, res) => {
  res.json(globalCart);
});

// API to reset cart state
app.post('/api/reset', (req, res) => {
  globalCart.itemName = 'Premium Product';
  globalCart.originalPrice = 100;
  globalCart.currentPrice = 100;
  globalCart.discountsApplied = [];
  
  res.json({ success: true, message: 'Cart reset successfully', cart: globalCart });
});

// VULNERABLE ENDPOINT - allows discount to be applied twice
app.post('/api/apply-discount', (req, res) => {
  const { discountCode } = req.body;
  
  // Validate discount code
  if (discountCode !== 'HALF50') {
    return res.status(400).json({ success: false, message: 'Invalid discount code' });
  }
  
  // Allow code to be applied up to twice (VULNERABLE BY DESIGN)
  const codeApplications = globalCart.discountsApplied.filter(code => code === 'HALF50').length;
  if (codeApplications >= 2) {
    return res.status(400).json({ success: false, message: 'Maximum discount limit reached' });
  }
  
  // Apply discount (50% off original price each time)
  const discountAmount = globalCart.originalPrice * 0.5;
  globalCart.currentPrice -= discountAmount;
  
  // Ensure price doesn't go below 0
  globalCart.currentPrice = Math.max(globalCart.currentPrice, 0);
  
  // Record that we applied this discount code
  globalCart.discountsApplied.push(discountCode);
  
  res.json({
    success: true,
    message: 'Discount applied successfully',
    cart: globalCart
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
