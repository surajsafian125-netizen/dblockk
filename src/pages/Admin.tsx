import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit, Eye, EyeOff, Send, Bot, Plus, Save, X, Upload, BarChart3, Newspaper, Loader2, Megaphone } from 'lucide-react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import Footer from '@/components/Footer';
import { streamChat, type Msg } from '@/lib/streamChat';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { z } from 'zod';

interface DBPost {
  id: string;
  title: string;
  content: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string;
  tags: string[] | null;
  views: number | null;
  likes_count: number | null;
  reading_time: number | null;
  engagement_score: number | null;
  is_trending: boolean | null;
  published: boolean | null;
  created_at: string | null;
  user_id: string;
}

const Admin = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Post form state
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<DBPost | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('news');
  const [formTags, setFormTags] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formViews, setFormViews] = useState('0');
  const [formEngagement, setFormEngagement] = useState('0');
  const [formTrending, setFormTrending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postSubmitError, setPostSubmitError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Analytics control state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsId, setAnalyticsId] = useState('');
  const [aTotalViews, setATotalViews] = useState('');
  const [aTotalUsers, setATotalUsers] = useState('');
  const [aEngagement, setAEngagement] = useState('');
  const [aGrowth, setAGrowth] = useState('');
  const [aViewsChange, setAViewsChange] = useState('');
  const [aUsersChange, setAUsersChange] = useState('');
  const [aEngagementChange, setAEngagementChange] = useState('');
  const [aGrowthChange, setAGrowthChange] = useState('');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
      fetchAnalytics();
    }
  }, [isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data as DBPost[]);
  };

  const fetchAnalytics = async () => {
    const { data } = await supabase.from('analytics_settings').select('*').limit(1).single();
    if (data) {
      setAnalyticsId(data.id);
      setATotalViews(data.total_views || '');
      setATotalUsers(data.total_users || '');
      setAEngagement(data.engagement_rate || '');
      setAGrowth(data.growth || '');
      setAViewsChange(data.views_change || '');
      setAUsersChange(data.users_change || '');
      setAEngagementChange(data.engagement_change || '');
      setAGrowthChange(data.growth_change || '');
    }
  };

  const analyticsSchema = z.object({
    total_views: z.string().max(20, 'Value too long'),
    total_users: z.string().max(20, 'Value too long'),
    engagement_rate: z.string().max(10, 'Value too long'),
    growth: z.string().max(10, 'Value too long'),
    views_change: z.string().max(10, 'Value too long'),
    users_change: z.string().max(10, 'Value too long'),
    engagement_change: z.string().max(10, 'Value too long'),
    growth_change: z.string().max(10, 'Value too long'),
  });

  const saveAnalytics = async () => {
    let validated;
    try {
      validated = analyticsSchema.parse({
        total_views: aTotalViews,
        total_users: aTotalUsers,
        engagement_rate: aEngagement,
        growth: aGrowth,
        views_change: aViewsChange,
        users_change: aUsersChange,
        engagement_change: aEngagementChange,
        growth_change: aGrowthChange,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
      }
      return;
    }

    const { error } = await supabase.from('analytics_settings').update({
      ...validated,
      updated_at: new Date().toISOString(),
    }).eq('id', analyticsId);

    if (error) toast.error('Failed to save analytics');
    else toast.success('Analytics saved!');
  };

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

  const togglePublish = async (post: DBPost) => {
    const { error } = await supabase.from('posts').update({ published: !post.published }).eq('id', post.id);
    if (!error) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
    }
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('post-media').upload(path, file);
    if (error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
    if (file.type.startsWith('video/')) {
      setFormVideoUrl(urlData.publicUrl);
    } else {
      setFormImageUrl(urlData.publicUrl);
    }
    setUploading(false);
    toast.success('File uploaded!');
  };

  const openEditForm = (post: DBPost) => {
    setPostSubmitError(null);
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormDescription(post.description || '');
    setFormCategory(post.category);
    setFormTags((post.tags || []).join(', '));
    setFormImageUrl(post.image_url || '');
    setFormVideoUrl(post.video_url || '');
    setFormViews(String(post.views || 0));
    setFormEngagement(String(post.engagement_score || 0));
    setFormTrending(post.is_trending || false);
    setShowForm(true);
  };

  const resetForm = () => {
    setPostSubmitError(null);
    setEditingPost(null);
    setFormTitle(''); setFormContent(''); setFormDescription('');
    setFormCategory('news'); setFormTags(''); setFormImageUrl('');
    setFormVideoUrl(''); setFormViews('0'); setFormEngagement('0');
    setFormTrending(false); setShowForm(false);
  };

  const postSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
    content: z.string().trim().min(1, 'Content is required').max(50000, 'Content is too long'),
    description: z.string().max(500, 'Description must be under 500 characters').optional(),
    category: z.string().trim().min(1, 'Category is required').max(50, 'Category too long'),
    tags: z.array(z.string().max(30, 'Tag too long')).max(10, 'Max 10 tags'),
    image_url: z.union([z.string().url('Invalid image URL'), z.literal('')]).optional(),
    video_url: z.union([z.string().url('Invalid video URL'), z.literal('')]).optional(),
    views: z.number().int().min(0).max(999999999, 'Views too high'),
    engagement_score: z.number().int().min(0).max(100, 'Engagement must be 0-100'),
    is_trending: z.boolean(),
  });

  const formatSupabaseError = (error: { code?: string; message?: string; details?: string; hint?: string }) => {
    return [error.code, error.message, error.details, error.hint]
      .filter(Boolean)
      .join(' — ');
  };

  const savePost = async () => {
    setPostSubmitError(null);
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    let validated;
    try {
      validated = postSchema.parse({
        title: formTitle,
        content: formContent,
        description: formDescription || undefined,
        category: formCategory,
        tags,
        image_url: formImageUrl || undefined,
        video_url: formVideoUrl || undefined,
        views: parseInt(formViews) || 0,
        engagement_score: parseInt(formEngagement) || 0,
        is_trending: formTrending,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        const validationMessage = e.errors[0].message;
        setPostSubmitError(validationMessage);
        toast.error(validationMessage);
      }
      return;
    }

    const readingTime = Math.max(1, Math.ceil(validated.content.split(/\s+/).length / 200));
    const postData = {
      title: validated.title,
      content: validated.content,
      description: validated.description || validated.content.slice(0, 120),
      category: validated.category,
      tags: validated.tags,
      image_url: validated.image_url || null,
      video_url: validated.video_url || null,
      views: validated.views,
      engagement_score: validated.engagement_score,
      is_trending: validated.is_trending,
      reading_time: readingTime,
    };

    if (editingPost) {
      const { error } = await supabase.from('posts').update(postData).eq('id', editingPost.id);
      if (error) {
        const fullError = formatSupabaseError(error) || 'Update failed';
        console.error('[Create/Edit Post] Update error:', error);
        setPostSubmitError(fullError);
        toast.error(fullError);
        return;
      }
      toast.success('Post updated!');
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        const authErr = userError?.message || 'Not authenticated. Please log in again.';
        setPostSubmitError(authErr);
        toast.error(authErr);
        return;
      }

      const { error } = await supabase.from('posts').insert({
        ...postData,
        user_id: userData.user.id,
        published: true,
      });

      if (error) {
        const fullError = formatSupabaseError(error) || 'Create failed';
        console.error('[Create/Edit Post] Insert error:', error);
        setPostSubmitError(fullError);
        toast.error(fullError);
        return;
      }
      toast.success('Post created!');
    }

    resetForm();
    fetchPosts();
  };

  const RSS_FEEDS = [
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://feeds.feedburner.com/TechCrunch/',
  ];

  const importNews = async () => {
    setImporting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('Not authenticated');
        setImporting(false);
        return;
      }

      const allArticles: Array<{ title: string; description: string; image: string; link: string }> = [];

      const results = await Promise.allSettled(
        RSS_FEEDS.map(async (feedUrl) => {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
          if (!res.ok) return [];
          const json = await res.json();
          return (json.items || []).slice(0, 5);
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const item of result.value) {
            allArticles.push({
              title: item.title || 'Untitled',
              description: item.description?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
              image: item.enclosure?.link || item.thumbnail || '',
              link: item.link || '',
            });
          }
        }
      }

      if (allArticles.length === 0) {
        toast.error('No articles fetched from RSS feeds');
        setImporting(false);
        return;
      }

      const rows = allArticles.map((a) => ({
        title: a.title,
        content: a.description || a.title,
        description: a.description.slice(0, 120) || null,
        category: 'News',
        image_url: a.image || null,
        tags: ['imported', 'global-news'],
        user_id: userData.user.id,
        published: true,
        views: 0,
        likes_count: 0,
        engagement_score: 0,
        reading_time: 2,
        is_trending: false,
      }));

      const { error } = await supabase.from('posts').insert(rows);
      if (error) {
        toast.error(formatSupabaseError(error));
        console.error('[Import News] Insert error:', error);
      } else {
        toast.success(`Imported ${rows.length} articles!`);
        fetchPosts();
      }
    } catch (e: any) {
      toast.error(e.message || 'Import failed');
    }
    setImporting(false);
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setBroadcasting(true);
    const { error } = await supabase.from('notifications').insert({ message: broadcastMsg.trim() });
    if (error) {
      toast.error('Failed to send broadcast');
      console.error('[Broadcast] Insert error:', error);
    } else {
      toast.success('Broadcast sent!');
      setBroadcastMsg('');
    }
    setBroadcasting(false);
  };

  const sendChat = async () => {
    if (!chatMessage.trim() || isStreaming) return;
    const userMsg: Msg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsStreaming(true);

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setChatHistory(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...chatHistory, userMsg],
        onDelta: upsertAssistant,
        onDone: () => setIsStreaming(false),
      });
    } catch (e: any) {
      const errText = e.message || 'AI request failed';
      toast.error(errText);
      // Show the error inline in the chat so it's visible
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ **Error:** ${errText}` },
      ]);
      setIsStreaming(false);
    }
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

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Post
          </button>
          <button onClick={importNews} disabled={importing} className="bg-accent text-accent-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
            {importing ? 'Importing...' : 'Import Global News'}
          </button>
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="glass rounded-xl px-4 py-2 text-sm font-medium glass-hover transition-all flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Analytics Control
          </button>
        </div>

        {/* Analytics Control Panel */}
        {showAnalytics && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Analytics Control
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Total Views</label>
                <input value={aTotalViews} onChange={e => setATotalViews(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Total Users</label>
                <input value={aTotalUsers} onChange={e => setATotalUsers(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Engagement Rate</label>
                <input value={aEngagement} onChange={e => setAEngagement(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Growth</label>
                <input value={aGrowth} onChange={e => setAGrowth(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Views Change</label>
                <input value={aViewsChange} onChange={e => setAViewsChange(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Users Change</label>
                <input value={aUsersChange} onChange={e => setAUsersChange(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Engagement Change</label>
                <input value={aEngagementChange} onChange={e => setAEngagementChange(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Growth Change</label>
                <input value={aGrowthChange} onChange={e => setAGrowthChange(e.target.value)} className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            </div>
            <button onClick={saveAnalytics} className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2">
              <Save className="h-4 w-4" /> Save Analytics
            </button>
          </motion.div>
        )}

        {/* Create/Edit Post Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">{editingPost ? 'Edit Post' : 'Create Post'}</h2>
              <button onClick={resetForm} className="p-1 hover:bg-secondary/50 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Post title..." className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
              <input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Short description..." className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
              <textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Full content..." rows={6} className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="Category (e.g. News, Hustle, Vibes)" list="category-suggestions" className="bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                <datalist id="category-suggestions">
                  <option value="News" />
                  <option value="Hustle" />
                  <option value="Vibes" />
                </datalist>
                <input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="Tags (comma sep)" className="bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                <input value={formViews} onChange={e => setFormViews(e.target.value)} placeholder="Views" type="number" className="bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <input value={formEngagement} onChange={e => setFormEngagement(e.target.value)} placeholder="Engagement %" type="number" className="bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={formImageUrl} onChange={e => setFormImageUrl(e.target.value)} placeholder="Image URL (or upload below)" className="bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
                <input value={formVideoUrl} onChange={e => setFormVideoUrl(e.target.value)} placeholder="Video URL (or upload below)" className="bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground" />
              </div>
              <div className="flex items-center gap-4">
                <label className="glass rounded-xl px-4 py-2 text-sm cursor-pointer glass-hover flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  {uploading ? 'Uploading...' : 'Upload Media'}
                  <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={formTrending} onChange={e => setFormTrending(e.target.checked)} className="rounded" />
                  Mark as Trending 🔥
                </label>
              </div>
              {formImageUrl && (
                <img src={formImageUrl} alt="Preview" className="h-32 w-auto rounded-xl object-cover" />
              )}
              {postSubmitError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {postSubmitError}
                </div>
              )}
              <button onClick={savePost} className="bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2">
                <Save className="h-4 w-4" /> {editingPost ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-xl font-semibold">Post Management</h2>
            {posts.length === 0 && (
              <p className="text-muted-foreground text-sm py-8 text-center">No posts yet. Create your first post!</p>
            )}
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
                  <p className="text-xs text-muted-foreground">{post.category} · {(post.views || 0).toLocaleString()} views</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(post)} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    {post.published ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => openEditForm(post)} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
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
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {chatHistory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Ask me anything about your content...</p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`text-sm p-3 rounded-xl ${msg.role === 'user' ? 'bg-primary/10 ml-4' : 'bg-secondary/50 mr-4'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder={isStreaming ? 'AI is thinking...' : 'Type a message...'}
                disabled={isStreaming}
                className="flex-1 bg-secondary/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button onClick={sendChat} disabled={isStreaming} className="bg-primary text-primary-foreground rounded-xl p-2 hover:opacity-90 transition-all disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
