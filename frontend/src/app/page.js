// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.js file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }



'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Edit2, Trash2, LogOut, User, Send, Loader2 } from 'lucide-react';

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
    } else {
      setLoading(false);
    }
    fetchPosts();
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

  const handleDemoLogin = async () => {
    setPosting(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: 'demo',
        password: 'demo123'
      });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setShowAuthModal(false);
      fetchPosts();
    } catch (error) {
      setError('Demo login failed');
    } finally {
      setPosting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-lg border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">DC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">DevConnect</h1>
              <p className="text-xs text-purple-300">Developer Social Feed</p>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2 border border-purple-500/30">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                <span className="text-white font-medium text-sm hidden sm:block">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-all"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Create Post */}
        {user && (
          <div className="mb-8 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20">
            <form onSubmit={createPost}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your tech thoughts..."
                className="w-full bg-slate-900/50 text-white rounded-lg p-4 border border-purple-500/30 focus:border-purple-500 focus:outline-none resize-none"
                rows="3"
                maxLength="500"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-purple-300">{newPost.length}/500</span>
                <button
                  type="submit"
                  disabled={!newPost.trim() || posting}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-purple-500/20">
              <p className="text-purple-300">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <img src={post.avatar} alt={post.name} className="w-12 h-12 rounded-full border-2 border-purple-500/30" />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{post.name}</h3>
                        <p className="text-purple-300 text-sm">@{post.username}</p>
                      </div>
                      <span className="text-purple-400 text-sm">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {editingPost === post._id ? (
                      <div className="mb-3">
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          className="w-full bg-slate-900/50 text-white rounded-lg p-3 border border-purple-500/30 focus:border-purple-500 focus:outline-none resize-none"
                          rows="3"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => updatePost(post._id)}
                            disabled={posting}
                            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingPost(null);
                              setEditMessage('');
                            }}
                            className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg border border-slate-600/30 hover:bg-slate-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-white mb-4 leading-relaxed">{post.message}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => user && likePost(post._id)}
                        disabled={!user}
                        className="flex items-center gap-2 text-purple-400 hover:text-pink-400 transition-colors disabled:opacity-50"
                      >
                        <Heart className={`w-5 h-5 ${post.likedBy?.includes(user?._id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                        <span className="font-medium">{post.likes}</span>
                      </button>

                      {user && post.userId === user.id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingPost(post._id);
                              setEditMessage(post.message);
                            }}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePost(post._id)}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
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
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-slate-900/50 text-white rounded-lg p-3 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    required={!isLogin}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-slate-900/50 text-white rounded-lg p-3 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    required={!isLogin}
                  />
                </>
              )}
              <input
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                className="w-full bg-slate-900/50 text-white rounded-lg p-3 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full bg-slate-900/50 text-white rounded-lg p-3 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                required
              />

              <button
                type="submit"
                disabled={posting}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
              >
                {posting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={handleDemoLogin}
                disabled={posting}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Try Demo Account
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowAuthModal(false);
                setError('');
              }}
              className="mt-4 w-full py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}