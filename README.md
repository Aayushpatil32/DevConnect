# DevConnect - Professional Developer Social Network

## 📋 Project Overview

DevConnect is a modern, professional social networking platform designed specifically for developers. It provides a clean, minimalist interface where developers can share thoughts, insights, and connect with peers in the tech community.

## 🎯 Purpose

- **Connect Developers**: Build a community where developers can share their experiences and knowledge
- **Professional Networking**: Create meaningful connections in a distraction-free environment
- **Knowledge Sharing**: Enable developers to post updates, insights, and engage with content
- **Modern Authentication**: Secure login with support for traditional credentials and Single Sign-On (SSO)

## ✨ Key Features

- 🔐 **Secure Authentication**: Email/password and SSO (Google, LinkedIn, GitHub)
- 📝 **Post Creation & Management**: Share thoughts with edit and delete capabilities
- ❤️ **Engagement**: Like posts and interact with the community
- 👤 **User Profiles**: Personalized avatars and profile information
- ⚡ **Real-time Updates**: Instant post updates and interactions
- 🎨 **Professional UI**: Clean black and white design focused on content
- 📱 **Responsive Design**: Works seamlessly on all devices

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Date Formatting**: date-fns

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **CORS**: Enabled for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd devconnect
```

### 2. Backend Setup

```bash
# Navigate to backend directory (if separate)
cd backend

# Install dependencies
npm install

# Create .env file
touch .env
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/devconnect
# Or use MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/devconnect

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# OAuth Configuration (Optional - for SSO)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
touch .env.local
```

Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Start the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

## 🚀 Running in Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## 📝 Usage Guide

### First Time Setup
1. Access the application at `http://localhost:3000`
2. Click on "Sign In" to access the login page
3. Create a new account using the "Sign Up" tab
4. Or use Single Sign-On with Google, LinkedIn, or GitHub

### Creating Posts
1. After logging in, you'll see the post creation area at the top
2. Type your message (max 500 characters)
3. Click "Post" to share with the community

### Interacting with Posts
- **Like**: Click the heart icon to like a post
- **Edit**: Click the edit icon on your own posts to modify them
- **Delete**: Click the trash icon to remove your posts

### Authentication Options
- **Email/Password**: Traditional signup and login
- **Google SSO**: Quick login with your Google account
- **LinkedIn SSO**: Professional login with LinkedIn
- **GitHub SSO**: Developer-friendly login with GitHub

## 🗂️ Project Structure

```
devconnect/
├── backend/
│   ├── server.js          # Main Express server
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js    # Main application page
│   │   │   ├── layout.js  # Root layout
│   │   │   └── globals.css # Global styles
│   │   └── components/    # React components (if any)
│   ├── package.json       # Frontend dependencies
│   └── .env.local        # Frontend environment variables
│
└── README.md             # This file
```

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication
- Protected API routes with middleware
- Input validation and sanitization
- CORS configuration
- Secure environment variable management

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts (with pagination)
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/posts/:id/like` - Like/unlike post (protected)

### System
- `GET /api/health` - Health check endpoint

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running locally or Atlas connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📧 Support

For issues, questions, or suggestions, please open an issue in the repository.

## 📜 License

ISC License

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the database solution
- The open-source community for various packages used

---

**Built with ❤️ by developers, for developers**