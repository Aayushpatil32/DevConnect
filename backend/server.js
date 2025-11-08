// // backend/server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const axios = require('axios');
// require('dotenv').config();

// const app = express();

// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));
// app.use(express.json());

// // Debug middleware
// app.use((req, res, next) => {
//   console.log(`📍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
//   next();
// });

// // MongoDB Connection
// const connectDB = async () => {
//   try {
//     const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/devconnect';
    
//     if (!mongoUri) {
//       console.error('❌ MongoDB URI not found in environment variables');
//       return;
//     }

//     console.log('🔗 Attempting to connect to MongoDB...');
    
//     const conn = await mongoose.connect(mongoUri, {
//       serverSelectionTimeoutMS: 10000,
//       socketTimeoutMS: 45000,
//       maxPoolSize: 10,
//     });
    
//     console.log('✅ MongoDB Connected Successfully');
    
//   } catch (error) {
//     console.error('❌ MongoDB Connection Failed:', error.message);
//     if (process.env.NODE_ENV === 'production') {
//       process.exit(1);
//     }
//   }
// };

// connectDB();

// // User Schema
// const userSchema = new mongoose.Schema({
//   username: { 
//     type: String, 
//     required: [true, 'Username is required'], 
//     unique: true,
//     trim: true,
//     minlength: [3, 'Username must be at least 3 characters'],
//     maxlength: [30, 'Username cannot exceed 30 characters']
//   },
//   email: { 
//     type: String, 
//     required: [true, 'Email is required'], 
//     unique: true,
//     trim: true,
//     lowercase: true,
//     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//   },
//   password: { 
//     type: String, 
//     required: [true, 'Password is required'],
//     minlength: [6, 'Password must be at least 6 characters']
//   },
//   name: { 
//     type: String, 
//     required: [true, 'Name is required'],
//     trim: true,
//     maxlength: [50, 'Name cannot exceed 50 characters']
//   },
//   bio: { 
//     type: String, 
//     default: '',
//     maxlength: [500, 'Bio cannot exceed 500 characters']
//   },
//   avatar: { 
//     type: String, 
//     default: '' 
//   },
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   oauth: {
//     google: { type: String, sparse: true },
//     github: { type: String, sparse: true },
//     linkedin: { type: String, sparse: true }
//   }
// }, {
//   timestamps: true
// });

// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });

// const User = mongoose.model('User', userSchema);

// // Post Schema
// const postSchema = new mongoose.Schema({
//   userId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: [true, 'User ID is required'] 
//   },
//   name: { 
//     type: String, 
//     required: [true, 'Name is required'] 
//   },
//   username: { 
//     type: String, 
//     required: [true, 'Username is required'] 
//   },
//   avatar: { 
//     type: String, 
//     default: '' 
//   },
//   message: { 
//     type: String, 
//     required: [true, 'Message is required'], 
//     maxlength: [5000, 'Message cannot exceed 1000 characters'],
//     trim: true
//   },
//   likes: { 
//     type: Number, 
//     default: 0 
//   },
//   likedBy: [{ 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User' 
//   }],
//   createdAt: { 
//     type: Date, 
//     default: Date.now 
//   },
//   updatedAt: { 
//     type: Date, 
//     default: Date.now 
//   }
// }, {
//   timestamps: true
// });

// postSchema.index({ userId: 1, createdAt: -1 });
// postSchema.index({ createdAt: -1 });
// postSchema.index({ likes: -1 });

// const Post = mongoose.model('Post', postSchema);

// // Auth Middleware
// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
    
//     if (!token) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Access denied. No token provided.' 
//       });
//     }
    
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only');
//     req.userId = decoded.userId;
//     next();
//   } catch (error) {
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Invalid token.' 
//       });
//     }
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Token expired.' 
//       });
//     }
//     res.status(500).json({ 
//       success: false,
//       error: 'Authentication failed.' 
//     });
//   }
// };

// // OAuth State Management
// const oauthStates = new Map();
// const generateState = () => crypto.randomBytes(16).toString('hex');

// // ============ AUTH ROUTES ============

// // Register
// app.post('/api/auth/register', async (req, res) => {
//   try {
//     const { username, email, password, name } = req.body;
    
//     if (!username || !email || !password || !name) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'All fields are required: username, email, password, name' 
//       });
//     }

//     const existingUser = await User.findOne({ 
//       $or: [{ email: email.toLowerCase() }, { username }] 
//     });
    
//     if (existingUser) {
//       return res.status(409).json({ 
//         success: false,
//         error: 'User with this email or username already exists' 
//       });
//     }
    
//     const hashedPassword = await bcrypt.hash(password, 12);
    
//     const user = new User({
//       username: username.trim(),
//       email: email.toLowerCase().trim(),
//       password: hashedPassword,
//       name: name.trim(),
//       avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
//     });
    
//     await user.save();
    
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only',
//       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );
    
//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         name: user.name,
//         avatar: user.avatar,
//         bio: user.bio,
//         createdAt: user.createdAt
//       }
//     });
//   } catch (error) {
//     console.error('Register error:', error);
    
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         success: false,
//         error: errors.join(', ') 
//       });
//     }
    
//     res.status(500).json({ 
//       success: false,
//       error: 'Internal server error during registration' 
//     });
//   }
// });

// // Login
// app.post('/api/auth/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
    
//     if (!username || !password) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Username and password are required' 
//       });
//     }
    
//     const user = await User.findOne({
//       $or: [
//         { username: username.trim() },
//         { email: username.toLowerCase().trim() }
//       ]
//     });
    
//     if (!user) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Invalid credentials' 
//       });
//     }
    
//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(401).json({ 
//         success: false,
//         error: 'Invalid credentials' 
//       });
//     }
    
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only',
//       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );
    
//     res.json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         name: user.name,
//         avatar: user.avatar,
//         bio: user.bio,
//         createdAt: user.createdAt
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Internal server error during login' 
//     });
//   }
// });

// // ============ GOOGLE OAUTH ROUTES ============

// app.get('/api/auth/google', (req, res) => {
//   const state = generateState();
//   oauthStates.set(state, { provider: 'google', timestamp: Date.now() });
  
//   const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
  
//   const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
//   authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
//   authUrl.searchParams.set('redirect_uri', redirectUri);
//   authUrl.searchParams.set('response_type', 'code');
//   authUrl.searchParams.set('scope', 'profile email');
//   authUrl.searchParams.set('state', state);
//   authUrl.searchParams.set('access_type', 'offline');
//   authUrl.searchParams.set('prompt', 'consent');
  
//   res.json({ success: true, url: authUrl.toString() });
// });

// app.get('/api/auth/google/callback', async (req, res) => {
//   try {
//     const { code, state } = req.query;
    
//     if (!oauthStates.has(state)) {
//       return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
//     }
    
//     oauthStates.delete(state);
    
//     const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    
//     const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET,
//       code,
//       redirect_uri: redirectUri,
//       grant_type: 'authorization_code'
//     });
    
//     const { access_token } = tokenResponse.data;
    
//     const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
//       headers: { Authorization: `Bearer ${access_token}` }
//     });
    
//     const { id, email, name, picture } = userResponse.data;
    
//     let user = await User.findOne({ 
//       $or: [
//         { email: email.toLowerCase() },
//         { 'oauth.google': id }
//       ]
//     });
    
//     if (!user) {
//       const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
      
//       user = new User({
//         username,
//         email: email.toLowerCase(),
//         password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12),
//         name,
//         avatar: picture,
//         oauth: { google: id }
//       });
      
//       await user.save();
//     } else if (!user.oauth?.google) {
//       user.oauth = { ...user.oauth, google: id };
//       if (!user.avatar) user.avatar = picture;
//       await user.save();
//     }
    
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );
    
//     res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify({
//       id: user._id,
//       username: user.username,
//       email: user.email,
//       name: user.name,
//       avatar: user.avatar
//     }))}`);
    
//   } catch (error) {
//     console.error('Google OAuth error:', error);
//     res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
//   }
// });

// // ============ GITHUB OAUTH ROUTES ============

// app.get('/api/auth/github', (req, res) => {
//   try {
//     const state = generateState();
//     oauthStates.set(state, { provider: 'github', timestamp: Date.now() });
    
//     const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`;
    
//     const authUrl = new URL('https://github.com/login/oauth/authorize');
//     authUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
//     authUrl.searchParams.set('redirect_uri', redirectUri);
//     authUrl.searchParams.set('scope', 'user:email');
//     authUrl.searchParams.set('state', state);
    
//     console.log('🚀 GitHub OAuth URL:', authUrl.toString());
    
//     res.json({ success: true, url: authUrl.toString() });
//   } catch (error) {
//     console.error('❌ GitHub OAuth initiation error:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to initiate GitHub OAuth' 
//     });
//   }
// });

// app.get('/api/auth/github/callback', async (req, res) => {
//   try {
//     const { code, state } = req.query;
    
//     console.log('🔄 GitHub callback received:', { code: code ? 'Present' : 'Missing', state });
    
//     if (!code) {
//       console.error('❌ No code in GitHub callback');
//       return res.redirect(`${process.env.FRONTEND_URL}?error=no_code&message=GitHub did not return authorization code`);
//     }
    
//     if (!oauthStates.has(state)) {
//       console.error('❌ Invalid state in GitHub callback');
//       return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state&message=Invalid OAuth state`);
//     }
    
//     oauthStates.delete(state);
    
//     // Exchange code for access token
//     console.log('🔑 Exchanging code for access token...');
//     const tokenResponse = await axios.post(
//       'https://github.com/login/oauth/access_token',
//       {
//         client_id: process.env.GITHUB_CLIENT_ID,
//         client_secret: process.env.GITHUB_CLIENT_SECRET,
//         code,
//         redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`
//       },
//       {
//         headers: {
//           Accept: 'application/json'
//         }
//       }
//     );
    
//     const { access_token } = tokenResponse.data;
    
//     if (!access_token) {
//       console.error('❌ No access token received from GitHub');
//       return res.redirect(`${process.env.FRONTEND_URL}?error=no_token&message=Failed to get access token from GitHub`);
//     }
    
//     console.log('✅ Access token received');
    
//     // Get user info from GitHub
//     console.log('👤 Fetching user info from GitHub...');
//     const userResponse = await axios.get('https://api.github.com/user', {
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//         Accept: 'application/json'
//       }
//     });
    
//     const githubUser = userResponse.data;
//     console.log('✅ GitHub user info received:', githubUser.login);
    
//     // Get user email if not public
//     let email = githubUser.email;
//     if (!email) {
//       console.log('📧 Fetching user email...');
//       const emailResponse = await axios.get('https://api.github.com/user/emails', {
//         headers: {
//           Authorization: `Bearer ${access_token}`,
//           Accept: 'application/json'
//         }
//       });
      
//       const primaryEmail = emailResponse.data.find(e => e.primary);
//       email = primaryEmail ? primaryEmail.email : emailResponse.data[0]?.email;
//     }
    
//     if (!email) {
//       console.error('❌ No email found for GitHub user');
//       return res.redirect(`${process.env.FRONTEND_URL}?error=no_email&message=No email associated with GitHub account`);
//     }
    
//     console.log('✅ Email retrieved:', email);
    
//     // Find or create user
//     let user = await User.findOne({ 
//       $or: [
//         { email: email.toLowerCase() },
//         { 'oauth.github': githubUser.id.toString() }
//       ]
//     });
    
//     if (!user) {
//       console.log('👤 Creating new user...');
//       const username = githubUser.login + '_' + Math.random().toString(36).substr(2, 5);
      
//       user = new User({
//         username,
//         email: email.toLowerCase(),
//         password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12),
//         name: githubUser.name || githubUser.login,
//         avatar: githubUser.avatar_url,
//         bio: githubUser.bio || '',
//         oauth: { github: githubUser.id.toString() }
//       });
      
//       await user.save();
//       console.log('✅ New user created:', user.username);
//     } else if (!user.oauth?.github) {
//       console.log('🔗 Linking GitHub account to existing user...');
//       user.oauth = { ...user.oauth, github: githubUser.id.toString() };
//       if (!user.avatar) user.avatar = githubUser.avatar_url;
//       if (!user.bio && githubUser.bio) user.bio = githubUser.bio;
//       await user.save();
//       console.log('✅ GitHub account linked');
//     } else {
//       console.log('✅ Existing user found:', user.username);
//     }
    
//     // Generate JWT
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only',
//       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );
    
//     console.log('✅ JWT generated, redirecting to frontend...');
    
//     // Redirect to frontend with token
//     res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify({
//       id: user._id,
//       username: user.username,
//       email: user.email,
//       name: user.name,
//       avatar: user.avatar
//     }))}&source=github`);
    
//   } catch (error) {
//     console.error('❌ GitHub OAuth error:', error.response?.data || error.message);
//     res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
//   }
// });

// // LinkedIn OAuth (Placeholder)
// app.get('/api/auth/linkedin', (req, res) => {
//   res.status(501).json({ 
//     success: false, 
//     error: 'LinkedIn OAuth not yet implemented. Please use Google or GitHub.' 
//   });
// });

// // Clean up expired OAuth states
// setInterval(() => {
//   const now = Date.now();
//   for (const [state, data] of oauthStates.entries()) {
//     if (now - data.timestamp > 3600000) {
//       oauthStates.delete(state);
//     }
//   }
// }, 3600000);

// // ============ POST ROUTES ============

// // Get all posts
// app.get('/api/posts', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const skip = (page - 1) * limit;

//     const posts = await Post.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate('userId', 'name username avatar');

//     const totalPosts = await Post.countDocuments();

//     res.json({ 
//       success: true,
//       posts,
//       pagination: {
//         current: page,
//         pages: Math.ceil(totalPosts / limit),
//         total: totalPosts,
//         hasNext: page < Math.ceil(totalPosts / limit),
//         hasPrev: page > 1
//       }
//     });
//   } catch (error) {
//     console.error('Get posts error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to fetch posts' 
//     });
//   }
// });

// // Create post
// app.post('/api/posts', authMiddleware, async (req, res) => {
//   try {
//     const { message } = req.body;
    
//     if (!message || message.trim().length === 0) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Post message is required' 
//       });
//     }
//     if (message.trim().length > 5000) {  // CHANGED
//       return res.status(400).json({ 
//         success: false,
//         error: 'Post message cannot exceed 5000 characters'  // CHANGED
//       });
//     }
//     const user = await User.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'User not found' 
//       });
//     }
    
//     const post = new Post({
//       userId: req.userId,
//       name: user.name,
//       username: user.username,
//       avatar: user.avatar,
//       message: message.trim()
//     });
    
//     await post.save();
    
//     await post.populate('userId', 'name username avatar');
    
//     res.status(201).json({ 
//       success: true,
//       message: 'Post created successfully',
//       post 
//     });
//   } catch (error) {
//     console.error('Create post error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to create post' 
//     });
//   }
// });

// // Update post
// app.put('/api/posts/:id', authMiddleware, async (req, res) => {
//   try {
//     const { message } = req.body;
//     const postId = req.params.id;
    
//     if (!message || message.trim().length === 0) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Post message is required' 
//       });
//     }
    
//     const post = await Post.findById(postId);
    
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'Post not found' 
//       });
//     }
    
//     if (post.userId.toString() !== req.userId) {
//       return res.status(403).json({ 
//         success: false,
//         error: 'Not authorized to update this post' 
//       });
//     }
    
//     post.message = message.trim();
//     post.updatedAt = Date.now();
//     await post.save();
    
//     res.json({ 
//       success: true,
//       message: 'Post updated successfully',
//       post 
//     });
//   } catch (error) {
//     console.error('Update post error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to update post' 
//     });
//   }
// });

// // Delete post
// app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const post = await Post.findById(postId);
    
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'Post not found' 
//       });
//     }
    
//     if (post.userId.toString() !== req.userId) {
//       return res.status(403).json({ 
//         success: false,
//         error: 'Not authorized to delete this post' 
//       });
//     }
    
//     await Post.findByIdAndDelete(postId);
//     res.json({ 
//       success: true,
//       message: 'Post deleted successfully' 
//     });
//   } catch (error) {
//     console.error('Delete post error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to delete post' 
//     });
//   }
// });

// // Like/Unlike post
// app.post('/api/posts/:id/like', authMiddleware, async (req, res) => {
//   try {
//     const postId = req.params.id;
//     const post = await Post.findById(postId);
    
//     if (!post) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'Post not found' 
//       });
//     }
    
//     const userIdObj = new mongoose.Types.ObjectId(req.userId);
//     const hasLiked = post.likedBy.some(id => id.equals(userIdObj));
    
//     if (hasLiked) {
//       post.likedBy = post.likedBy.filter(id => !id.equals(userIdObj));
//       post.likes = Math.max(0, post.likes - 1);
//     } else {
//       post.likedBy.push(userIdObj);
//       post.likes += 1;
//     }
    
//     await post.save();
//     res.json({ 
//       success: true,
//       message: hasLiked ? 'Post unliked successfully' : 'Post liked successfully',
//       post 
//     });
//   } catch (error) {
//     console.error('Like post error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to like/unlike post' 
//     });
//   }
// });

// // Get current user
// app.get('/api/auth/me', authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).select('-password');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false,
//         error: 'User not found' 
//       });
//     }
    
//     res.json({ 
//       success: true,
//       user 
//     });
//   } catch (error) {
//     console.error('Get current user error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Internal server error' 
//     });
//   }
// });

// // Debug route
// app.get('/api/debug/oauth', (req, res) => {
//   res.json({
//     success: true,
//     routes: {
//       google: '/api/auth/google',
//       github: '/api/auth/github', 
//       linkedin: '/api/auth/linkedin'
//     },
//     env: {
//       githubClientId: process.env.GITHUB_CLIENT_ID ? 'Set' : 'Not Set',
//       googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
//       backendUrl: process.env.BACKEND_URL || 'Not Set',
//       frontendUrl: process.env.FRONTEND_URL || 'Not Set'
//     }
//   });
// });

// // Health check
// app.get('/api/health', async (req, res) => {
//   try {
//     const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
//     res.json({ 
//       success: true,
//       status: 'Server is running',
//       timestamp: new Date().toISOString(),
//       database: dbStatus,
//       environment: process.env.NODE_ENV || 'development'
//     });
//   } catch (error) {
//     res.status(503).json({ 
//       success: false,
//       status: 'Server error',
//       database: 'error'
//     });
//   }
// });

// // Seed data route
// app.post('/api/seed', async (req, res) => {
//   try {
//     const existingUsers = await User.countDocuments();
//     if (existingUsers > 0) {
//       return res.status(400).json({ 
//         success: false,
//         error: 'Database already contains data. Seed only works on empty database.' 
//       });
//     }

//     const demoUsers = [
//       {
//         username: 'sarah_dev',
//         email: 'sarah@devconnect.com',
//         password: await bcrypt.hash('demo123', 12),
//         name: 'Sarah Chen',
//         bio: 'Full-stack developer | React enthusiast | Coffee lover ☕',
//         avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1&color=fff'
//       },
//       {
//         username: 'demo',
//         email: 'demo@devconnect.com',
//         password: await bcrypt.hash('demo123', 12),
//         name: 'Demo User',
//         bio: 'Demo account for testing DevConnect features',
//         avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=f59e0b&color=fff'
//       }
//     ];

//     const createdUsers = await User.insertMany(demoUsers);

//     const demoPosts = [
//       {
//         userId: createdUsers[0]._id,
//         name: createdUsers[0].name,
//         username: createdUsers[0].username,
//         avatar: createdUsers[0].avatar,
//         message: '🚀 Just deployed my first Next.js 14 app with server components! The performance is incredible. Anyone else exploring the app router?',
//         likes: 12,
//         likedBy: [createdUsers[1]._id],
//         createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
//       },
//       {
//         userId: createdUsers[1]._id,
//         name: createdUsers[1].name,
//         username: createdUsers[1].username,
//         avatar: createdUsers[1].avatar,
//         message: 'Hot take: Docker containers have revolutionized development workflows more than any other tool in the past decade. Change my mind! 🐳',
//         likes: 8,
//         likedBy: [createdUsers[0]._id],
//         createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
//       }
//     ];

//     await Post.insertMany(demoPosts);

//     res.json({ 
//       success: true,
//       message: 'Database seeded successfully with demo data!',
//       data: {
//         users: createdUsers.length,
//         posts: demoPosts.length
//       },
//       demoCredentials: {
//         username: 'demo',
//         password: 'demo123'
//       }
//     });
//   } catch (error) {
//     console.error('Seed error:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Database seeding failed. Please try again.' 
//     });
//   }
// });

// // const PORT = process.env.PORT || 5000;

// // app.listen(PORT, () => {
// //   console.log(`🚀 DevConnect Server running on port ${PORT}`);
// //   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
// //   console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
// // });

// const PORT = process.env.PORT || 5000;

// // For local development
// if (process.env.NODE_ENV !== 'production') {
//   app.listen(PORT, () => {
//     console.log(`🚀 DevConnect Server running on port ${PORT}`);
//     console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
//     console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
//   });
// }

// // Export for Vercel
// module.exports = app;













// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();

// CORS Configuration - Allow multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://your-frontend.vercel.app', // Replace with your actual Vercel URL
];

// app.use(cors({
//   origin: function(origin, callback) {
//     // Allow requests with no origin (mobile apps, Postman, etc.)
//     if (!origin) return callback(null, true);
    
//     if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cors({
  origin: [
    'https://devconnectfrontend-ten.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// MongoDB Connection with proper error handling
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      dbName: 'devconnect', // Explicitly set database name
    });
    
    isConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw error;
  }
};

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
  },
  oauth: {
    google: { type: String, sparse: true },
    github: { type: String, sparse: true },
    linkedin: { type: String, sparse: true }
  }
}, {
  timestamps: true
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

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
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
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

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

// Auth Middleware
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

// OAuth State Management
const oauthStates = new Map();
const generateState = () => crypto.randomBytes(16).toString('hex');

// Middleware to ensure DB connection before each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      success: false,
      error: 'Database connection failed'
    });
  }
});

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    
    if (!username || !email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required: username, email, password, name' 
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: 'User with this email or username already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
    });
    
    await user.save();
    
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
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
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

// ============ GOOGLE OAUTH ROUTES ============

app.get('/api/auth/google', (req, res) => {
  const state = generateState();
  oauthStates.set(state, { provider: 'google', timestamp: Date.now() });
  
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'profile email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  res.json({ success: true, url: authUrl.toString() });
});

app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!oauthStates.has(state)) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
    }
    
    oauthStates.delete(state);
    
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    const { access_token } = tokenResponse.data;
    
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { id, email, name, picture } = userResponse.data;
    
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { 'oauth.google': id }
      ]
    });
    
    if (!user) {
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
      
      user = new User({
        username,
        email: email.toLowerCase(),
        password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12),
        name,
        avatar: picture,
        oauth: { google: id }
      });
      
      await user.save();
    } else if (!user.oauth?.google) {
      user.oauth = { ...user.oauth, google: id };
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    }))}`);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

// ============ GITHUB OAUTH ROUTES ============

app.get('/api/auth/github', (req, res) => {
  try {
    const state = generateState();
    oauthStates.set(state, { provider: 'github', timestamp: Date.now() });
    
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`;
    
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'user:email');
    authUrl.searchParams.set('state', state);
    
    res.json({ success: true, url: authUrl.toString() });
  } catch (error) {
    console.error('❌ GitHub OAuth initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate GitHub OAuth' 
    });
  }
});

app.get('/api/auth/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code&message=GitHub did not return authorization code`);
    }
    
    if (!oauthStates.has(state)) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state&message=Invalid OAuth state`);
    }
    
    oauthStates.delete(state);
    
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/github/callback`
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_token&message=Failed to get access token from GitHub`);
    }
    
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json'
      }
    });
    
    const githubUser = userResponse.data;
    
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json'
        }
      });
      
      const primaryEmail = emailResponse.data.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : emailResponse.data[0]?.email;
    }
    
    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_email&message=No email associated with GitHub account`);
    }
    
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { 'oauth.github': githubUser.id.toString() }
      ]
    });
    
    if (!user) {
      const username = githubUser.login + '_' + Math.random().toString(36).substr(2, 5);
      
      user = new User({
        username,
        email: email.toLowerCase(),
        password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12),
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        bio: githubUser.bio || '',
        oauth: { github: githubUser.id.toString() }
      });
      
      await user.save();
    } else if (!user.oauth?.github) {
      user.oauth = { ...user.oauth, github: githubUser.id.toString() };
      if (!user.avatar) user.avatar = githubUser.avatar_url;
      if (!user.bio && githubUser.bio) user.bio = githubUser.bio;
      await user.save();
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    }))}&source=github`);
    
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

// LinkedIn OAuth (Placeholder)
app.get('/api/auth/linkedin', (req, res) => {
  res.status(501).json({ 
    success: false, 
    error: 'LinkedIn OAuth not yet implemented. Please use Google or GitHub.' 
  });
});

// Clean up expired OAuth states
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.timestamp > 3600000) {
      oauthStates.delete(state);
    }
  }
}, 3600000);

// ============ POST ROUTES ============

// Get all posts
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
    if (message.trim().length > 5000) {
      return res.status(400).json({ 
        success: false,
        error: 'Post message cannot exceed 5000 characters'
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
      post.likedBy = post.likedBy.filter(id => !id.equals(userIdObj));
      post.likes = Math.max(0, post.likes - 1);
    } else {
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

// Get current user
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

// Health check
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

// Seed data route (disabled in production)
app.post('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ 
      success: false,
      error: 'Seed route is disabled in production' 
    });
  }

  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Database already contains data. Seed only works on empty database.' 
      });
    }

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
        username: 'demo',
        email: 'demo@devconnect.com',
        password: await bcrypt.hash('demo123', 12),
        name: 'Demo User',
        bio: 'Demo account for testing DevConnect features',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=f59e0b&color=fff'
      }
    ];

    const createdUsers = await User.insertMany(demoUsers);

    const demoPosts = [
      {
        userId: createdUsers[0]._id,
        name: createdUsers[0].name,
        username: createdUsers[0].username,
        avatar: createdUsers[0].avatar,
        message: '🚀 Just deployed my first Next.js 14 app with server components! The performance is incredible. Anyone else exploring the app router?',
        likes: 12,
        likedBy: [createdUsers[1]._id],
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

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 DevConnect Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for Vercel
module.exports = app;