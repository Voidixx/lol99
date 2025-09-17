const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Initialize SQLite database
const db = new Database('gunbattle.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    coins INTEGER DEFAULT 1000,
    owned_skins TEXT DEFAULT '[]',
    equipped_skin TEXT DEFAULT 'default',
    owned_guns TEXT DEFAULT '[]',
    equipped_gun TEXT DEFAULT 'pistol',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'skin' or 'gun'
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    rarity TEXT NOT NULL, -- 'common', 'rare', 'epic', 'legendary'
    color TEXT,
    description TEXT,
    active BOOLEAN DEFAULT 1,
    expires_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS shop_rotations (
    id TEXT PRIMARY KEY,
    rotation_date DATETIME NOT NULL,
    items TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// JWT Secret
const JWT_SECRET = 'gunbattle_secret_' + Math.random().toString(36);

// Shop data - predefined items that can appear in rotation
const SHOP_ITEMS = {
  skins: [
    { name: 'Ninja', price: 500, rarity: 'common', color: '#2c3e50', description: 'Stealthy dark outfit' },
    { name: 'Warrior', price: 750, rarity: 'rare', color: '#e74c3c', description: 'Battle-hardened armor' },
    { name: 'Ghost', price: 1000, rarity: 'rare', color: '#95a5a6', description: 'Translucent phantom skin' },
    { name: 'Fire Lord', price: 1500, rarity: 'epic', color: '#f39c12', description: 'Blazing hot appearance' },
    { name: 'Ice King', price: 1500, rarity: 'epic', color: '#3498db', description: 'Frozen royal outfit' },
    { name: 'Dragon Slayer', price: 2500, rarity: 'legendary', color: '#9b59b6', description: 'Mystical dragon-scale armor' },
    { name: 'Golden Emperor', price: 5000, rarity: 'legendary', color: '#f1c40f', description: 'Shimmering gold outfit' }
  ],
  guns: [
    { name: 'SMG', price: 300, rarity: 'common', description: 'Fast-firing submachine gun' },
    { name: 'Shotgun', price: 600, rarity: 'common', description: 'Close-range devastator' },
    { name: 'Assault Rifle', price: 800, rarity: 'rare', description: 'Balanced automatic weapon' },
    { name: 'Sniper Rifle', price: 1200, rarity: 'rare', description: 'Long-range precision weapon' },
    { name: 'Rocket Launcher', price: 2000, rarity: 'epic', description: 'Explosive area damage' },
    { name: 'Plasma Cannon', price: 3000, rarity: 'epic', description: 'Energy-based weapon' },
    { name: 'Lightning Gun', price: 4000, rarity: 'legendary', description: 'Electrifying bolt weapon' }
  ]
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Shop rotation system
function generateShopRotation() {
  const rotation = [];
  const allItems = [...SHOP_ITEMS.skins, ...SHOP_ITEMS.guns];
  
  // Select 6 random items for the shop
  const shuffled = allItems.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 6);
  
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now
  
  selected.forEach(item => {
    const shopItem = {
      id: uuidv4(),
      type: SHOP_ITEMS.skins.includes(item) ? 'skin' : 'gun',
      name: item.name,
      price: item.price,
      rarity: item.rarity,
      color: item.color || null,
      description: item.description,
      active: 1,
      expires_at: expiresAt.toISOString()
    };
    
    rotation.push(shopItem);
    
    // Insert into database
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO shop_items 
      (id, type, name, price, rarity, color, description, active, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(shopItem.id, shopItem.type, shopItem.name, shopItem.price, 
             shopItem.rarity, shopItem.color, shopItem.description, 
             shopItem.active, shopItem.expires_at);
  });
  
  // Store rotation record
  const rotationStmt = db.prepare(`
    INSERT INTO shop_rotations (id, rotation_date, items)
    VALUES (?, ?, ?)
  `);
  
  rotationStmt.run(uuidv4(), new Date().toISOString(), JSON.stringify(selected));
  
  return rotation;
}

// Initialize shop rotation
generateShopRotation();

// Set up automatic rotation every 8 hours
setInterval(() => {
  console.log('Rotating shop items...');
  // Clear old items
  db.prepare('UPDATE shop_items SET active = 0').run();
  generateShopRotation();
}, 8 * 60 * 60 * 1000);

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(userId, username, email, hashedPassword);
    
    // Create JWT token
    const token = jwt.sign({ id: userId, username }, JWT_SECRET);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, username, email, coins: 1000 }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        equipped_skin: user.equipped_skin,
        equipped_gun: user.equipped_gun,
        owned_skins: JSON.parse(user.owned_skins),
        owned_guns: JSON.parse(user.owned_guns)
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current shop items
app.get('/api/shop', authenticateToken, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM shop_items WHERE active = 1').all();
    
    // Calculate time until next rotation
    const now = new Date();
    const nextRotation = new Date(Math.ceil(now.getTime() / (8 * 60 * 60 * 1000)) * (8 * 60 * 60 * 1000));
    const timeLeft = nextRotation.getTime() - now.getTime();
    
    res.json({
      items,
      timeLeft: Math.floor(timeLeft / 1000), // seconds until rotation
      nextRotation: nextRotation.toISOString()
    });
    
  } catch (error) {
    console.error('Shop fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchase item
app.post('/api/shop/purchase/:itemId', authenticateToken, (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    // Get item details
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND active = 1').get(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Get user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has enough coins
    if (user.coins < item.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Check if user already owns this item
    const ownedItems = item.type === 'skin' ? JSON.parse(user.owned_skins) : JSON.parse(user.owned_guns);
    if (ownedItems.includes(item.name)) {
      return res.status(400).json({ error: 'You already own this item' });
    }
    
    // Update user's coins and owned items
    ownedItems.push(item.name);
    const newCoins = user.coins - item.price;
    
    const updateStmt = db.prepare(`
      UPDATE users 
      SET coins = ?, ${item.type === 'skin' ? 'owned_skins' : 'owned_guns'} = ?
      WHERE id = ?
    `);
    
    updateStmt.run(newCoins, JSON.stringify(ownedItems), userId);
    
    res.json({
      message: 'Purchase successful',
      item: item.name,
      coinsLeft: newCoins,
      ownedItems
    });
    
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      coins: user.coins,
      equipped_skin: user.equipped_skin,
      equipped_gun: user.equipped_gun,
      owned_skins: JSON.parse(user.owned_skins),
      owned_guns: JSON.parse(user.owned_guns)
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gunbattle.io server running on http://0.0.0.0:${PORT}`);
});