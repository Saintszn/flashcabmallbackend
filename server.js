const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const db = require('./config/db');
const multer = require('multer');
const path  = require('path');




// Load environment variables
dotenv.config();

const settingsController = require('./controllers/settingsController');
const notificationController = require('./controllers/notificationController');
const chatController = require('./controllers/chatController');




// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const couponRoutes = require('./routes/couponRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes        = require('./routes/adminRoutes')
const statsRoutes = require('./routes/statsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const authMiddleware  = require('./middleware/authMiddleware');
const chatRoutes = require('./routes/chatRoutes');
const categoryRoutes    = require('./routes/categoryRoutes');
const cartRoutes        = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const searchController = require('./controllers/searchController');


const app = express();


// *** ADD THIS BLOCK AT THE VERY TOP ***
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} — Origin: ${req.headers.origin}`);
  next();
});


// 1) CORS: reflect any origin, allow credentials
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.options('*', cors());





app.use(bodyParser.json());
app.use(morgan('dev'));


// 1. Serve uploads/users statically
app.use(
  '/uploads/users',
  express.static(path.join(__dirname, 'uploads/users'))
);


app.get(
  '/api/user/profile',
  authMiddleware,
  (req, res) => {
    const db = require('./config/db');
    const id = req.user.id;
    const sql = 'SELECT id, name, email, phone, gender, imageUrl FROM Users WHERE id = ?';
    db.query(sql, [id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (!results.length) return res.status(404).json({ message: 'User not found' });
      res.status(200).json(results[0]);
    });
  }
);

// Healthcheck at exactly /api
app.get('/api', (req, res) => {
  res.send('FlashCab Mall Backend API Running');
});
  
// Categories (public)
app.use('/api/categories', categoryRoutes);
  
// Cart 
app.use('/api/cart', cartRoutes);
  


app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/messages', authMiddleware, chatRoutes);

// Search
app.get('/api/search/suggestions', authMiddleware, searchController.getSuggestions);
app.get('/api/search', authMiddleware, searchController.searchProducts);


// Use routes
app .use('/api/auth', authRoutes);
app .use('/api/auth/login', authRoutes);
app .use('/api/auth/signup', authRoutes);
app .use( '/api/coupons/validate', authRoutes)
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', authMiddleware, couponRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/admin', authMiddleware,  adminRoutes);  
app.use('/api/stats', authMiddleware, statsRoutes);
app.use('/api/messages', authMiddleware, chatRoutes);
app.use('/api/wishlist', authMiddleware, wishlistRoutes);




// Alias for mobile/chat clients expecting /api/chat
app.use('/api/chat', authMiddleware, chatRoutes);
app.get('/api/flashsale/current', settingsController.getFlashsale);
app.get('/api/adverts', settingsController.getAdvert);
app.use('/api/user', userRoutes);







// -- Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/images', express.static(path.join(__dirname, 'images')));


// Serve React admin‑panel build at /admin-panel
app.use(
  '/admin-panel',
  express.static(path.join(__dirname, '../admin-panel/build'))
);

// SPA fallback for admin‑panel routes
app.get('/admin-panel/*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../admin-panel/build', 'index.html')
  );
});


// -- Create HTTP & Socket.IO servers
const server = http.createServer(app);
// Allow Socket.IO from any LAN host
const io = new Server(server, {
  path: '/socket.io',                // must match client exactly
  allowEIO3: true,                   // in case client falls back to EIO3
  transports: ['polling', 'websocket'],
  pingInterval: 25000,
  pingTimeout: 60000,
  cookie: true,
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// after `const io = new Server(httpServer, …)`
io.on('connection', socket => {
  // client must immediately emit 'joinRoom' with their userId
  socket.on('joinRoom', ({ userId }) => {
    socket.join(`user_${userId}`);
  });
});

// -- Attach io to express for controllers
app.set('io', io);

// -- Start listening
const PORT = process.env.PORT || 3000;

// -- Socket.IO authentication & rooms
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// (optional) echo‐back middleware so you can inspect requests
io.use((socket, next) => {
  console.log('Incoming handshake from', socket.handshake.headers.origin);
  next();
});

io.on('connection', (socket) => {
  console.log('client connected', socket.id);

  // example emit
  socket.on('hello', (msg) => {
    console.log('got hello:', msg);
    socket.emit('welcome', { time: Date.now() });
  });
});




io.on('connection', socket => {
  const { id, role } = socket.user;

  // Admin joins 'admin' room; users join their own room
  if (role === 'admin') {
    socket.join('admin');
  } else {
    socket.join(`user_${id}`);
  }

  // Handle incoming chat messages
  socket.on('chatMessage', async ({ userId, text, fileUrl }) => {
    const db = require('./config/db');
    const fromAdmin = role === 'admin';
    const chatUserId = fromAdmin ? userId : id;

    // Save into MySQL
    const query = `
      INSERT INTO Messages (chatUserId, text, fileUrl, fromAdmin)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [chatUserId, text || null, fileUrl || null, fromAdmin], (err, result) => {
      if (err) return console.error(err);
      const newMsg = {
        id: result.insertId,
        chatUserId,
        text,
        fileUrl,
        fromAdmin,
        createdAt: new Date()
      };

      // Emit to the relevant rooms
      io.to(`user_${chatUserId}`).emit('newMessage', newMsg);
      if (fromAdmin) io.to('admin').emit('newMessage', newMsg);
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.user.id}`);
  });
});




// Basic route
app.get('/', (req, res) => {
  res.send('FlashCab Mall Backend API Running');
});


// 1️⃣ Seed categories & subcategories on startup
const builtInCategories = [
  {
    id: 1,
    name: 'Electronics',
    icon: '/icons/electronics.png',
    subcategories: [
      'Mobile Phones & Accessories',
      'Computers & Tablets',
      'TV & Home Theater',
      'Cameras & Photography',
      'Wearable Tech',
      'Audio',
      'Gaming',
      'Drones & Accessories'
    ]
  },
  {
    id: 2,
    name: 'Fashion & Apparel',
    icon: '/icons/fashion.png',
    subcategories: [
      "Women’s Clothing",
      "Men’s Clothing",
      'Shoes & Footwear',
      'Bags, Wallets & Luggage',
      'Jewelry & Watches',
      'Accessories'
    ]
  },
  {
    id: 3,
    name: 'Home & Garden',
    icon: '/icons/home-garden.png',
    subcategories: [
      'Furniture',
      'Home Décor',
      'Kitchen & Dining',
      'Bedding & Bath',
      'Lighting',
      'Garden & Outdoor',
      'Tools & Home Improvement'
    ]
  },
  {
    id: 4,
    name: 'Books, Movies & Music',
    icon: '/icons/books-movies.png',
    subcategories: [
      'Fiction',
      'Non-Fiction',
      'Children’s Books',
      'Educational',
      'Comics'
    ]
  },
  {
    id: 5,
    name: 'Beauty & Personal Care',
    icon: '/icons/BeautyPersonalCare.png',
    subcategories: [
      'Cosmetics',
      'Skincare',
      'Hair Care',
      'Fragrances',
      'Personal Grooming'
    ]
  },
  {
    id: 6,
    name: 'Sports & Outdoors',
    icon: '/icons/sports-outdoors.png',
    subcategories: [
      'Fitness Equipment',
      'Team Sports',
      'Outdoor Recreation',
      'Cycling',
      'Water Sports',
      'Winter Sports'
    ]
  },
  {
    id: 7,
    name: 'Toys, Kids & Baby',
    icon: '/icons/toys-kids.png',
    subcategories: [
      'Baby Gear',
      'Nursery',
      'Feeding & Diapering',
      "Kids’ Clothing & Shoes",
      'Toys & Games',
      "Arts & Crafts for Kids"
    ]
  },
  {
    id: 8,
    name: 'Office & School Supplies',
    icon: '/icons/office-supplies.png',
    subcategories: [
      'Office Electronics',
      'Writing & Correction',
      'Paper Products',
      'Binders & Organization',
      'Office Furniture'
    ]
  },
  {
    id: 9,
    name: 'Pet Supplies',
    icon: '/icons/pet-supplies.png',
    subcategories: [
      'Dog Supplies',
      'Cat Supplies',
      'Fish & Aquatic Pets',
      'Birds',
      'Small Animals',
      'Pet Food & Treats'
    ]
  },
  {
    id: 10,
    name: 'Automotive & Industrial',
    icon: '/icons/automotive.png',
    subcategories: [
      'Car Electronics & GPS',
      'Replacement Parts',
      'Car Care & Accessories',
      'Tools & Equipment',
      'Motorcycle & Powersports',
      'Industrial & Scientific Supplies'
    ]
  },
  {
    id: 11,
    name: 'Arts, Crafts & Sewing',
    icon: '/icons/arts-crafts.png',
    subcategories: [
      'Painting & Drawing',
      'Sewing, Knitting & Fabric',
      'Scrapbooking & Paper Crafts',
      'Craft Tools & Storage'
    ]
  },
  {
    id: 12,
    name: 'Software & Digital Goods',
    icon: '/icons/software.png',
    subcategories: [
      'Operating Systems & Productivity',
      'Security & Antivirus',
      'Creative Software',
      'Games & Virtual Goods',
      'eGift Cards & Vouchers'
    ]
  },
  {
    id: 13,
    name: 'Travel & Luggage',
    icon: '/icons/travel.png',
    subcategories: [
      'Luggage & Travel Bags',
      'Travel Accessories',
      'Outdoor & Adventure Gear'
    ]
  },
  {
    id: 14,
    name: 'Services & Experiences',
    icon: '/icons/services.png',
    subcategories: [
      'Home Services (Cleaning, Repairs)',
      'Professional Services (Consulting, Design)',
      'Event Tickets & Experiences'
    ]
  },
  {
    id: 15,
    name: 'Collectibles & Art',
    icon: '/icons/collectibles.png',
    subcategories: [
      'Fine Art',
      'Antiques',
      'Coins & Stamps',
      'Memorabilia'
    ]
  }
];


db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  } 
  console.log('Connected to MySQL Database');

  // Prepare bulk inserts for categories and subcategories
  const categoryValues = builtInCategories.map(c => [c.id, c.name, c.icon]);
  const subcategoryValues = builtInCategories.flatMap(c =>
    c.subcategories.map((name, idx) => [
      c.id * 100 + (idx + 1),
      c.id,
      name
    ])
  );

  // Insert categories
  connection.query(
    'INSERT IGNORE INTO Categories (id, name, icon) VALUES ?',
    [categoryValues],
    (err) => {
      if (err) console.error('Error seeding Categories:', err);
      else console.log('Categories seeded (if missing).');

      // Insert subcategories
      connection.query(
        'INSERT IGNORE INTO SubCategories (id, categoryId, name) VALUES ?',
        [subcategoryValues],
        (err) => {
          if (err) console.error('Error seeding SubCategories:', err);
          else console.log('SubCategories seeded (if missing).');

          // Release connection and start server
          connection.release();
          server.listen(PORT, '0.0.0.0', () => {
            console.log(`⚡️ FlashCab Mall backend running on http://0.0.0.0:${PORT}/api`);
          });
        }
      );
    }
  );
});