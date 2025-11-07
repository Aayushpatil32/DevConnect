'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Edit2, Trash2, LogOut, Send, Loader2, Mail, Lock, User, Github, Linkedin } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
      fetchPosts();
    } else {
      setLoading(false);
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    const source = urlParams.get('source');

    console.log('🔄 OAuth Callback Params:', { 
      token: token ? 'Present' : 'Missing', 
      user: userParam ? 'Present' : 'Missing',
      error: error || 'None',
      source: source || 'None'
    });

    if (error) {
      const errorMsg = `OAuth login failed: ${error}${message ? ` - ${message}` : ''}`;
      console.error('❌ OAuth Error:', errorMsg);
      setError(errorMsg);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ OAuth Success - User:', userData.username);
        
        localStorage.setItem('token', token);
        setUser(userData);
        setShowAuthModal(false);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Fetch posts
        await fetchPosts();
        
        // Show success message
        setError(''); // Clear any previous errors
        
      } catch (parseError) {
        console.error('❌ OAuth Parse Error:', parseError);
        setError('Failed to process login response. Please try again.');
      }
    }
  };

  handleOAuthCallback();
}, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setShowAuthModal(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError('Failed to load posts');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setPosting(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { username: authForm.username, password: authForm.password }
        : authForm;

      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setShowAuthModal(false);
      setAuthForm({ username: '', email: '', password: '', name: '' });
      fetchPosts();
    } catch (error) {
      setError(error.response?.data?.error || 'Authentication failed');
    } finally {
      setPosting(false);
    }
  };

  // Update the SSO login function
const handleSSOLogin = async (provider) => {
  setError('');
  try {
    console.log(`🚀 Starting ${provider} OAuth flow...`);
    
    const response = await axios.get(`${API_URL}/auth/${provider.toLowerCase()}`, {
      timeout: 10000
    });
    
    if (response.data.success) {
      console.log(`🔗 Redirecting to ${provider}...`, response.data.url);
      // Redirect to OAuth provider
      window.location.href = response.data.url;
    } else {
      const errorMsg = response.data.error || `${provider} login failed`;
      console.error(`❌ ${provider} OAuth Error:`, errorMsg);
      setError(errorMsg);
    }
  } catch (error) {
    console.error(`❌ ${provider} OAuth Request Error:`, error);
    const errorMsg = error.response?.data?.error || 
                    error.message || 
                    `${provider} login configuration error`;
    setError(errorMsg);
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPosts([]);
    setShowAuthModal(true);
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/posts`,
        { message: newPost },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewPost('');
      fetchPosts();
    } catch (error) {
      setError('Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const updatePost = async (postId) => {
    if (!editMessage.trim()) return;

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/posts/${postId}`,
        { message: editMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingPost(null);
      setEditMessage('');
      fetchPosts();
    } catch (error) {
      setError('Failed to update post');
    } finally {
      setPosting(false);
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (error) {
      setError('Failed to delete post');
    }
  };

  const likePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPosts();
    } catch (error) {
      setError('Failed to like post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading DevConnect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      {user && (
        <header className="bg-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
                <span className="text-black font-bold text-xl">DC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">DevConnect</h1>
                <p className="text-xs text-gray-500">Professional Developer Network</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                <div className="hidden sm:block">
                  <p className="text-white font-medium text-sm">{user.name}</p>
                  <p className="text-gray-500 text-xs">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-gray-900 hover:bg-gray-800 rounded-lg border border-gray-800 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-400 text-sm">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {user ? (
          <>
            {/* Create Post */}
            <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
              <form onSubmit={createPost}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts with the developer community..."
                  className="w-full bg-black text-white rounded-lg p-4 border border-gray-800 focus:border-gray-700 focus:outline-none resize-none placeholder-gray-600"
                  rows="4"
                  maxLength="5000"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600">{newPost.length}/5000 characters</span>
                  <button
                    type="submit"
                    disabled={!newPost.trim() || posting}
                    className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Publish
                  </button>
                </div>
              </form>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-gray-500 mb-2">No posts yet</p>
                  <p className="text-gray-600 text-sm">Be the first to share something with the community</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <img src={post.avatar} alt={post.name} className="w-12 h-12 rounded-full border-2 border-gray-800" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold">{post.name}</h3>
                            <p className="text-gray-500 text-sm">@{post.username}</p>
                          </div>
                          <span className="text-gray-600 text-xs whitespace-nowrap">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {editingPost === post._id ? (
                          <div className="mb-4">
                            <textarea
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              className="w-full bg-black text-white rounded-lg p-3 border border-gray-800 focus:border-gray-700 focus:outline-none resize-none"
                              rows="3"
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => updatePost(post._id)}
                                disabled={posting}
                                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPost(null);
                                  setEditMessage('');
                                }}
                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-300 mb-4 leading-relaxed">{post.message}</p>
                        )}

                        <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
                          <button
                            onClick={() => likePost(post._id)}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                          >
                            <Heart className={`w-5 h-5 ${post.likedBy?.includes(user?._id) ? 'fill-white text-white' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="font-medium text-sm">{post.likes}</span>
                          </button>

                          {user && post.userId === user.id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPost(post._id);
                                  setEditMessage(post.message);
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                title="Edit post"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deletePost(post._id)}
                                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* Auth Modal */}
      {showAuthModal && !user && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold text-2xl">DC</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Join DevConnect'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isLogin ? 'Sign in to continue to your account' : 'Create your professional developer profile'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full bg-black text-white rounded-lg p-3 pl-11 border border-gray-800 focus:border-gray-700 focus:outline-none placeholder-gray-600"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              {!isLogin && (
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full bg-black text-white rounded-lg p-3 pl-11 border border-gray-800 focus:border-gray-700 focus:outline-none placeholder-gray-600"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={isLogin ? "Username or email" : "johndoe"}
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    className="w-full bg-black text-white rounded-lg p-3 pl-11 border border-gray-800 focus:border-gray-700 focus:outline-none placeholder-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-black text-white rounded-lg p-3 pl-11 border border-gray-800 focus:border-gray-700 focus:outline-none placeholder-gray-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={posting}
                className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-900 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSSOLogin('Google')}
                  className="flex items-center justify-center py-3 bg-black border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Sign in with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleSSOLogin('LinkedIn')}
                  className="flex items-center justify-center py-3 bg-black border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Sign in with LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => handleSSOLogin('GitHub')}
                  className="flex items-center justify-center py-3 bg-black border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Sign in with GitHub"
                >
                  <Github className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setAuthForm({ username: '', email: '', password: '', name: '' });
                }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-white font-semibold">{isLogin ? 'Sign Up' : 'Sign In'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}