// Full Express.js application for race condition demo
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'race-condition-demo-secret',
  resave: false,
  saveUninitialized: true
}));

// Static files
app.use(express.static('public'));

// Initialize session variables for new sessions
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = {
      itemName: 'Premium Product',
      originalPrice: 100,
      currentPrice: 100,
      discountsApplied: []
    };
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// API to get cart state
app.get('/api/cart', (req, res) => {
  res.json(req.session.cart);
});

// API to reset cart state
app.post('/api/reset', (req, res) => {
  req.session.cart = {
    itemName: 'Premium Product',
    originalPrice: 100,
    currentPrice: 100,
    discountsApplied: []
  };
  res.json({ success: true, message: 'Cart reset successfully', cart: req.session.cart });
});

// VULNERABLE ENDPOINT - race condition in applying discount code
app.post('/api/apply-discount', (req, res) => {
  const { discountCode } = req.body;
  
  // Validate discount code
  if (discountCode !== 'HALF50') {
    return res.status(400).json({ success: false, message: 'Invalid discount code' });
  }
  
  // Check if code already applied (THIS CHECK IS VULNERABLE TO RACE CONDITIONS)
  if (req.session.cart.discountsApplied.includes(discountCode)) {
    return res.status(400).json({ success: false, message: 'Discount code already applied' });
  }
  
  // Simulate a small delay that makes the race condition more exploitable
  // In a real app, this could be a database query or external API call
  setTimeout(() => {
    // Apply discount
    req.session.cart.currentPrice -= req.session.cart.originalPrice * 0.5;
    req.session.cart.discountsApplied.push(discountCode);
    
    res.json({
      success: true,
      message: 'Discount applied successfully',
      cart: req.session.cart
    });
  }, 1000); // 1-second delay to make race condition easier to exploit
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
