import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { mockPosts, Post } from '@/data/mockData';
import { Trash2, Edit, Eye, EyeOff, Send, Bot } from 'lucide-react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';

const Admin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAdmin) return null;

  const togglePublish = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, published: !p.published } : p));
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const sendChat = () => {
    if (!chatMessage.trim()) return;
    setChatHistory(prev => [
      ...prev,
      { role: 'user', content: chatMessage },
      { role: 'ai', content: 'This is a mock AI response. Connect a backend for real AI!' },
    ]);
    setChatMessage('');
  };

  return (
    <div className="min-h-screen gradient-bg relative">
      <ParticleBackground />
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold mb-8"
        >
          Admin <span className="text-primary text-glow">Dashboard</span>
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-xl font-semibold">Post Management</h2>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <p className="text-xs text-muted-foreground">{post.category} · {post.views.toLocaleString()} views</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(post.id)} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    {post.published ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => deletePost(post.id)} className="p-2 rounded-lg hover:bg-destructive/20 transition-colors">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glass glow rounded-2xl p-6 h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Ask Anything</h2>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {chatHistory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Ask me anything about your content...</p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`text-sm p-3 rounded-xl ${msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-secondary/50 mr-4'}`}>
                  {msg.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Type a message..."
                className="flex-1 bg-secondary/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
              <button onClick={sendChat} className="bg-primary text-primary-foreground rounded-xl p-2 hover:opacity-90 transition-all">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;