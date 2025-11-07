// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/devconnect';
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.log('💡 Please add MONGODB_URI to your .env file');
      return;
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Maximum number of connections in the pool
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    console.log(`🏠 Host: ${conn.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected from DB');
    });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Check your MONGODB_URI in .env file');
    console.log('   2. Verify MongoDB Atlas credentials');
    console.log('   3. Ensure IP is whitelisted in MongoDB Atlas');
    console.log('   4. Check your internet connection');
    
    // Graceful shutdown in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'], 
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  bio: { 
    type: String, 
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

// Post Schema
const postSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'] 
  },
  username: { 
    type: String, 
    required: [true, 'Username is required'] 
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  message: { 
    type: String, 
    required: [true, 'Message is required'], 
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  likedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add indexes for better performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: -1 });

const Post = mongoose.model('Post', postSchema);

// Enhanced Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired.' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed.' 
    });
  }
};

// ============ ENHANCED AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    
    // Validation
    if (!username || !email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required: username, email, password, name' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User with this email or username already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: errors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during registration' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username and password are required' 
      });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: username.toLowerCase().trim() }
      ]
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during login' 
    });
  }
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ============ ENHANCED POST ROUTES ============

// Get all posts with pagination
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name username avatar');

    const totalPosts = await Post.countDocuments();

    res.json({ 
      success: true,
      posts,
      pagination: {
        current: page,
        pages: Math.ceil(totalPosts / limit),
        total: totalPosts,
        hasNext: page < Math.ceil(totalPosts / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch posts' 
    });
  }
});

// Create post
app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Post message is required' 
      });
    }
    
    if (message.trim().length > 500) {
      return res.status(400).json({ 
        success: false,
        error: 'Post message cannot exceed 500 characters' 
      });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const post = new Post({
      userId: req.userId,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      message: message.trim()
    });
    
    await post.save();
    
    // Populate the post with user data
    await post.populate('userId', 'name username avatar');
    
    res.status(201).json({ 
      success: true,
      message: 'Post created successfully',
      post 
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create post' 
    });
  }
});

// Update post
app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const postId = req.params.id;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Post message is required' 
      });
    }
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to update this post' 
      });
    }
    
    post.message = message.trim();
    post.updatedAt = Date.now();
    await post.save();
    
    res.json({ 
      success: true,
      message: 'Post updated successfully',
      post 
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update post' 
    });
  }
});

// Delete post
app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to delete this post' 
      });
    }
    
    await Post.findByIdAndDelete(postId);
    res.json({ 
      success: true,
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete post' 
    });
  }
});

// Like/Unlike post
app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found' 
      });
    }
    
    const userIdObj = new mongoose.Types.ObjectId(req.userId);
    const hasLiked = post.likedBy.some(id => id.equals(userIdObj));
    
    if (hasLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => !id.equals(userIdObj));
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(userIdObj);
      post.likes += 1;
    }
    
    await post.save();
    res.json({ 
      success: true,
      message: hasLiked ? 'Post unliked successfully' : 'Post liked successfully',
      post 
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to like/unlike post' 
    });
  }
});

// ============ ENHANCED SEED DATA ROUTE ============
app.post('/api/seed', async (req, res) => {
  try {
    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Database already contains data. Seed only works on empty database.' 
      });
    }

    // Create demo users
    const demoUsers = [
      {
        username: 'sarah_dev',
        email: 'sarah@devconnect.com',
        password: await bcrypt.hash('demo123', 12),
        name: 'Sarah Chen',
        bio: 'Full-stack developer | React enthusiast | Coffee lover ☕',
        avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1&color=fff'
      },
      {
        username: 'alex_codes',
        email: 'alex@devconnect.com',
        password: await bcrypt.hash('demo123', 12),
        name: 'Alex Kumar',
        bio: 'Backend wizard | Node.js | Docker expert 🐳',
        avatar: 'https://ui-avatars.com/api/?name=Alex+Kumar&background=8b5cf6&color=fff'
      },
      {
        username: 'emily_tech',
        email: 'emily@devconnect.com',
        password: await bcrypt.hash('demo123', 12),
        name: 'Emily Rodriguez',
        bio: 'UI/UX Developer | Design systems | Accessibility advocate',
        avatar: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=ec4899&color=fff'
      },
      {
        username: 'david_js',
        email: 'david@devconnect.com',
        password: await bcrypt.hash('demo123', 12),
        name: 'David Thompson',
        bio: 'JavaScript ninja | TypeScript lover | Open source contributor',
        avatar: 'https://ui-avatars.com/api/?name=David+Thompson&background=10b981&color=fff'
      },
      {
        username: 'demo',
        email: 'demo@devconnect.com',
        password: await bcrypt.hash('demo123', 12),
        name: 'Demo User',
        bio: 'Demo account for testing DevConnect features',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=f59e0b&color=fff'
      }
    ];

    const createdUsers = await User.insertMany(demoUsers);

    // Create demo posts
    const demoPosts = [
      {
        userId: createdUsers[0]._id,
        name: createdUsers[0].name,
        username: createdUsers[0].username,
        avatar: createdUsers[0].avatar,
        message: '🚀 Just deployed my first Next.js 14 app with server components! The performance is incredible. Anyone else exploring the app router?',
        likes: 12,
        likedBy: [createdUsers[1]._id, createdUsers[2]._id],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        userId: createdUsers[1]._id,
        name: createdUsers[1].name,
        username: createdUsers[1].username,
        avatar: createdUsers[1].avatar,
        message: 'Hot take: Docker containers have revolutionized development workflows more than any other tool in the past decade. Change my mind! 🐳',
        likes: 8,
        likedBy: [createdUsers[0]._id],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        userId: createdUsers[2]._id,
        name: createdUsers[2].name,
        username: createdUsers[2].username,
        avatar: createdUsers[2].avatar,
        message: 'Working on accessibility features today. Remember: semantic HTML is your friend! <button> over <div> with onClick every time. 🎯',
        likes: 15,
        likedBy: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[3]._id],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    await Post.insertMany(demoPosts);

    res.json({ 
      success: true,
      message: 'Database seeded successfully with demo data!',
      data: {
        users: createdUsers.length,
        posts: demoPosts.length
      },
      demoCredentials: {
        username: 'demo',
        password: 'demo123'
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Database seeding failed. Please try again.' 
    });
  }
});

// Enhanced Health check with DB status
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      success: true,
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({ 
      success: false,
      status: 'Server error',
      database: 'error'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 DevConnect Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});