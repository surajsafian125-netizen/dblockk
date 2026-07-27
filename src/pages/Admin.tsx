import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit, Eye, EyeOff, Send, Bot, Plus, Save, X, Upload, BarChart3, Newspaper, Loader2, Megaphone, Rss, Users, CheckCircle2, Briefcase, Check, XCircle, Shield, FileText, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/Header';
import SecurityTerminal from '@/components/SecurityTerminal';
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
  status?: string | null;
  news_category?: string | null;
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

  // Leads state
  interface Lead {
    id: string;
    company_name: string;
    email: string;
    service: string;
    budget_range: string | null;
    project_details: string | null;
    status: string;
    created_at: string;
  }
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showLeads, setShowLeads] = useState(false);

  // Gig moderation state
  interface PendingGig {
    id: string;
    title: string;
    description: string;
    contact_info: string;
    category: string;
    created_at: string;
    user_id: string;
  }
  const [pendingGigs, setPendingGigs] = useState<PendingGig[]>([]);
  const [showGigMod, setShowGigMod] = useState(false);

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
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [fetchingLocal, setFetchingLocal] = useState(false);
  const [draftTab, setDraftTab] = useState<'global' | 'local'>('global');

  const fetchLocalNews = async () => {
    setFetchingLocal(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-local-news');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.inserted > 0) {
        toast.success(`${data.inserted} local Ghanaian article${data.inserted === 1 ? '' : 's'} saved as drafts`);
        setDraftTab('local');
      } else {
        toast.info(data?.message || 'No new local articles found');
      }
      fetchPosts();
    } catch (e: any) {
      console.error('[Local News] error', e);
      toast.error(e?.message || 'Failed to fetch local news');
    } finally {
      setFetchingLocal(false);
    }
  };

  const publishDraftArticle = async (id: string) => {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'published', published: true })
      .eq('id', id);
    if (error) {
      toast.error(formatSupabaseError(error));
      return;
    }
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, status: 'published', published: true } : p)));
    toast.success('Published to Home 🚀');
  };

  const discardDraftArticle = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      toast.error(formatSupabaseError(error));
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Draft discarded');
  };


  const sendWeeklyDigest = async () => {
    setSendingDigest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-digest');
      if (error) throw error;
      toast.success(`Digest sent to ${data?.sent ?? 0} subscriber${data?.sent === 1 ? '' : 's'}`);
    } catch (e: any) {
      console.error('[Digest] error', e);
      toast.error(e?.message || 'Failed to send digest');
    } finally {
      setSendingDigest(false);
    }
  };

  // AI Draft Editor state
  const [draft, setDraft] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState('News');
  const [draftTags, setDraftTags] = useState('AI, trending');
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  const [publishingDraft, setPublishingDraft] = useState(false);
  // Feed settings state
  const [feedEnabled, setFeedEnabled] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [feedSaving, setFeedSaving] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

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
      fetchFeedSettings();
      fetchLeads();
      fetchPendingGigs();
    }
  }, [isAdmin]);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('client_leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLeads(data as Lead[]);
  };

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from('client_leads').update({ status }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const fetchPendingGigs = async () => {
    const { data } = await supabase
      .from('community_gigs')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (data) setPendingGigs(data as PendingGig[]);
  };

  const approveGig = async (id: string) => {
    await supabase.from('community_gigs').update({ is_approved: true }).eq('id', id);
    setPendingGigs(prev => prev.filter(g => g.id !== id));
    toast.success('Gig approved!');
  };

  const rejectGig = async (id: string) => {
    await supabase.from('community_gigs').delete().eq('id', id);
    setPendingGigs(prev => prev.filter(g => g.id !== id));
    toast.success('Gig rejected and removed');
  };

  const fetchFeedSettings = async () => {
    const { data: enabledRow } = await supabase.from('admin_config').select('value').eq('key', 'feed_enabled').single();
    const { data: urlRow } = await supabase.from('admin_config').select('value').eq('key', 'feed_rss_url').single();
    if (enabledRow) setFeedEnabled(enabledRow.value === 'true');
    if (urlRow) setFeedUrl(urlRow.value);
  };

  const saveFeedSettings = async () => {
    setFeedSaving(true);
    const upsertRow = async (key: string, value: string) => {
      const { data: existing } = await supabase.from('admin_config').select('key').eq('key', key).single();
      if (existing) {
        await supabase.from('admin_config').update({ value }).eq('key', key);
      } else {
        await supabase.from('admin_config').insert({ key, value });
      }
    };
    await upsertRow('feed_enabled', feedEnabled ? 'true' : 'false');
    await upsertRow('feed_rss_url', feedUrl.trim());
    setFeedSaving(false);
    toast.success('Feed settings saved!');
  };

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

  const handleDelete = async (post: DBPost) => {
    const confirmed = window.confirm(`Delete "${post.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase.from('posts').delete().eq('id', post.id);

    if (error) {
      const fullError = formatSupabaseError(error) || 'Delete failed';
      toast.error(fullError);
      console.error('[Delete Post] Delete error:', error);
      return;
    }

    setPosts(prev => prev.filter(p => p.id !== post.id));
    toast.success('Post deleted');
  };

  const handleDeleteAll = async () => {
    const confirmed = window.confirm('Are you sure you want to permanently delete all articles? This cannot be undone.');
    if (!confirmed) return;

    const { error } = await supabase.from('posts').delete().not('id', 'is', null);

    if (error) {
      const fullError = formatSupabaseError(error) || 'Delete all failed';
      toast.error(fullError);
      console.error('[Delete All Posts] Error:', error);
      return;
    }

    setPosts([]);
    toast.success('All articles deleted');
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

      for (const feedUrl of RSS_FEEDS) {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
          if (!res.ok) continue;
          const json = await res.json();
          const feedItems = (json.items || []).slice(0, 5);

          for (const item of feedItems) {
            allArticles.push({
              title: item.title || 'Untitled',
              description: item.description?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
              image: item.enclosure?.link || item.thumbnail || '',
              link: item.link || '',
            });
          }
        } catch (err) {
          console.error('[Import News] RSS fetch failed for:', feedUrl, err);
        }
      }

      if (allArticles.length === 0) {
        toast.error('No articles fetched from RSS feeds');
        setImporting(false);
        return;
      }

      const articlesToProcess = allArticles.slice(0, 5);

      toast.info(`Processing article 1 of 5... Please wait to prevent API limits.`, {
        id: 'news-import-progress',
      });

      // Pass each raw article through the AI chat function so it gets
      // restructured into the strict 4-section markdown layout enforced
      // by the chat edge function's system prompt.
      const formatArticle = async (a: { title: string; description: string; link: string }): Promise<string> => {
        const prompt = `Rewrite and restructure the following news article into a dense, rich editorial piece using the required four-section Markdown layout (## The Hook, ## Introduction, ## The Deep Dive, ## The Takeaway). Use ONLY the facts provided — do not invent details.\n\nTITLE: ${a.title}\n\nSOURCE URL: ${a.link}\n\nRAW CONTENT:\n${a.description || a.title}`;
        let out = '';
        try {
          await streamChat({
            messages: [{ role: 'user', content: prompt }] as Msg[],
            onDelta: (d) => { out += d; },
            onDone: () => {},
          });
        } catch (err) {
          console.error('[Import News] AI format failed for:', a.title, err);
        }
        return out.trim();
      };

      // Process sequentially with an 8s frontend delay after every Gemini call to respect free-tier rate limits.
      const formattedArticles: Array<{ article: { title: string; description: string; image: string; link: string }; content: string }> = [];
      let articleIndex = 0;
      for (const article of articlesToProcess) {
        articleIndex += 1;
        setImportProgress({ current: articleIndex, total: 5 });
        toast.loading(`Processing article ${articleIndex} of 5... Please wait to prevent API limits.`, {
          id: 'news-import-progress',
        });
        const content = await formatArticle(article);
        formattedArticles.push({ article, content });
        await new Promise((r) => setTimeout(r, 25000));
      }

      const rows = [];
      for (const formattedArticle of formattedArticles) {
        if (!formattedArticle.content || formattedArticle.content.length <= 100) continue;
        rows.push({
          title: formattedArticle.article.title,
          content: formattedArticle.content,
          description: formattedArticle.article.description.slice(0, 120) || null,
          category: 'News',
          news_category: 'global',
          status: 'draft',
          image_url: formattedArticle.article.image || null,
          tags: ['imported', 'global-news'],
          user_id: userData.user.id,
          published: false,
          views: 0,
          likes_count: 0,
          engagement_score: 0,
          reading_time: 4,
          is_trending: false,
        });
      }

      if (rows.length === 0) {
        toast.error('AI formatting failed for all articles', {
          id: 'news-import-progress',
        });
        setImporting(false);
        setImportProgress(null);
        return;
      }

      const { error } = await supabase.from('posts').insert(rows);
      if (error) {
        toast.error(formatSupabaseError(error), {
          id: 'news-import-progress',
        });
        console.error('[Import News] Insert error:', error);
      } else {
        setDraftTab('global');
        toast.success(`${rows.length} global drafts ready for review!`, {
          id: 'news-import-progress',
        });
        fetchPosts();
      }
    } catch (e: any) {
      toast.error(e.message || 'Import failed', {
        id: 'news-import-progress',
      });
    }
    setImporting(false);
    setImportProgress(null);
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
    setShowDraftEditor(true);
    setDraft('');

    let assistantSoFar = '';
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      updateDraft(assistantSoFar);
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

  // Extract title from Markdown content (first H1)
  const extractTitleFromMarkdown = (md: string): string => {
    const match = md.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
  };

  // Extract first image URL from Markdown
  const extractImageFromMarkdown = (md: string): string => {
    const match = md.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    return match ? match[1] : '';
  };

  const updateDraft = (nextDraft: string) => {
    const preservedDraft = nextDraft.replace(/\r\n/g, '\n');
    setDraft(preservedDraft);
    const title = extractTitleFromMarkdown(preservedDraft);
    if (title) setDraftTitle(title);
  };

  const useAsDraft = (content: string) => {
    updateDraft(content);
    setShowDraftEditor(true);
    toast.success('Article loaded into draft editor!');
  };

  const publishDraft = async () => {
    const finalDraft = draft.trim();
    const finalTitle = extractTitleFromMarkdown(finalDraft) || draftTitle.trim();

    if (!finalDraft || !finalTitle) {
      toast.error('Title and content are required');
      return;
    }
    setPublishingDraft(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('Not authenticated');
        setPublishingDraft(false);
        return;
      }

      const tags = draftTags.split(',').map(t => t.trim()).filter(Boolean);
      const imageUrl = extractImageFromMarkdown(finalDraft);
      const readingTime = Math.max(1, Math.ceil(finalDraft.split(/\s+/).length / 200));
      const bodyContent = finalDraft.replace(/^#\s+.+\n*/m, '').trim();

      const { error } = await supabase.from('posts').insert({
        title: finalTitle,
        content: bodyContent,
        description: bodyContent.replace(/[#*!\[\]()]/g, '').slice(0, 120),
        category: draftCategory,
        tags,
        image_url: imageUrl || null,
        user_id: userData.user.id,
        published: true,
        views: 0,
        likes_count: 0,
        engagement_score: 0,
        reading_time: readingTime,
        is_trending: false,
      });

      if (error) {
        toast.error(formatSupabaseError(error));
        console.error('[Publish Draft] Insert error:', error);
      } else {
        toast.success('Article published to the live feed! 🚀');
        setShowDraftEditor(false);
        setDraft('');
        setDraftTitle('');
        fetchPosts();
      }
    } catch (e: any) {
      toast.error(e.message || 'Publish failed');
    }
    setPublishingDraft(false);
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
          <button onClick={handleDeleteAll} className="border border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/15 rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete All Articles
          </button>
          <button onClick={importNews} disabled={importing} className="bg-accent text-accent-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
            {importing
              ? importProgress
                ? `Processing article ${importProgress.current} of ${importProgress.total}... Please wait to prevent API limits.`
                : 'Processing articles... Please wait to prevent API limits.'
              : 'Import Global News'}
          </button>
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="glass rounded-xl px-4 py-2 text-sm font-medium glass-hover transition-all flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Analytics Control
          </button>
          <button onClick={() => setShowLeads(!showLeads)} className="glass rounded-xl px-4 py-2 text-sm font-medium glass-hover transition-all flex items-center gap-2 relative">
            <Users className="h-4 w-4 text-primary" /> Client Leads
            {leads.filter(l => l.status === 'new').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {leads.filter(l => l.status === 'new').length}
              </span>
            )}
          </button>
          <button onClick={() => setShowGigMod(!showGigMod)} className="glass rounded-xl px-4 py-2 text-sm font-medium glass-hover transition-all flex items-center gap-2 relative">
            <Briefcase className="h-4 w-4 text-primary" /> Gig Moderation
            {pendingGigs.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {pendingGigs.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowSecurity(!showSecurity)} className="glass rounded-xl px-4 py-2 text-sm font-medium glass-hover transition-all flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security Terminal
          </button>
        </div>

        {/* Security Terminal */}
        {showSecurity && <SecurityTerminal />}

        {/* Client Leads Panel */}
        {showLeads && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Client Leads
              <span className="text-xs text-muted-foreground font-normal ml-2">{leads.length} total</span>
            </h2>
            {leads.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No leads yet. Share your Partner form!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leads.map((lead, i) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`rounded-xl p-4 border transition-all ${
                      lead.status === 'new'
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/20 bg-secondary/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm truncate">{lead.company_name}</h3>
                          <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
                            lead.status === 'new' ? 'bg-primary/15 text-primary' :
                            lead.status === 'contacted' ? 'bg-accent/15 text-accent' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.email} · {lead.service}</p>
                        {lead.budget_range && <p className="text-xs text-muted-foreground mt-0.5">Budget: {lead.budget_range}</p>}
                        {lead.project_details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lead.project_details}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(lead.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {lead.status === 'new' && (
                          <button
                            onClick={() => updateLeadStatus(lead.id, 'contacted')}
                            className="p-1.5 rounded-lg hover:bg-accent/20 transition-colors text-accent"
                            title="Mark as contacted"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await supabase.from('client_leads').delete().eq('id', lead.id);
                            setLeads(prev => prev.filter(l => l.id !== lead.id));
                          }}
                          className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Gig Moderation Panel */}
        {showGigMod && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Gig Moderation Queue
              <span className="text-xs text-muted-foreground font-normal ml-2">{pendingGigs.length} pending</span>
            </h2>
            {pendingGigs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No pending gigs to review 🎉</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingGigs.map((gig, i) => (
                  <motion.div
                    key={gig.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl p-4 border border-border/20 bg-secondary/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{gig.title}</h3>
                          <span className="text-[10px] rounded-full px-2 py-0.5 font-medium bg-muted text-muted-foreground">{gig.category}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-1">{gig.description}</p>
                        <p className="text-xs text-muted-foreground/60">Contact: {gig.contact_info} · {new Date(gig.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => approveGig(gig.id)}
                          className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
                          title="Approve"
                        >
                          <Check className="h-4 w-4 text-green-400" />
                        </button>
                        <button
                          onClick={() => rejectGig(gig.id)}
                          className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

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

        {/* Feed Settings */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" /> Automated News Feed
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Automated News</p>
                <p className="text-xs text-muted-foreground">When enabled, the Culture feed fetches live articles from your RSS URL</p>
              </div>
              <Switch checked={feedEnabled} onCheckedChange={setFeedEnabled} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">RSS Feed URL</label>
              <input
                value={feedUrl}
                onChange={e => setFeedUrl(e.target.value)}
                placeholder="https://news.google.com/rss/search?q=entertainment+culture"
                className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={saveFeedSettings}
              disabled={feedSaving}
              className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2 disabled:opacity-40"
            >
              {feedSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Feed Settings
            </button>
          </div>
        </motion.div>

        {/* Weekly Digest Broadcast */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" /> Weekly Digest
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manually dispatch the weekly digest email — top 5 recent posts — to all active subscribers via Resend.
          </p>
          <button
            onClick={sendWeeklyDigest}
            disabled={sendingDigest}
            className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2 disabled:opacity-40"
          >
            {sendingDigest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sendingDigest ? 'Dispatching…' : 'Broadcast Digest Now'}
          </button>
        </motion.div>

        {/* Send Broadcast */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Send Broadcast
          </h2>
          <div className="flex gap-2">
            <input
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendBroadcast()}
              placeholder="Type a notification message for all users..."
              className="flex-1 bg-secondary/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
            <button
              onClick={sendBroadcast}
              disabled={broadcasting || !broadcastMsg.trim()}
              className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2 disabled:opacity-40"
            >
              {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </motion.div>

        {/* AI Draft Editor */}
        {showDraftEditor && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass glow rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Draft Editor
              </h2>
              <button onClick={() => setShowDraftEditor(false)} className="p-1 hover:bg-secondary/50 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title input */}
              <input
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                placeholder="Article title..."
                className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />

              {/* Category + Tags row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Category</label>
                  <select
                    value={draftCategory}
                    onChange={e => setDraftCategory(e.target.value)}
                    className="w-full bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="News">News</option>
                    <option value="Hustle">Hustle</option>
                    <option value="Vibes">Vibes</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Tags (comma-separated)</label>
                  <input
                    value={draftTags}
                    onChange={e => setDraftTags(e.target.value)}
                    placeholder="AI, trending, tech"
                    className="w-full bg-secondary/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <textarea
                value={draft}
                onChange={e => updateDraft(e.target.value)}
                placeholder="Edit your AI-generated article here (Markdown supported)..."
                rows={16}
                className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-y leading-relaxed"
              />

              <div className="bg-secondary/20 rounded-xl p-5 max-h-[500px] overflow-y-auto prose prose-sm prose-invert max-w-none [&_img]:rounded-xl [&_img]:my-4 [&_img]:w-full [&_img]:max-h-80 [&_img]:object-cover [&_img]:shadow-lg">
                <ReactMarkdown>{draft}</ReactMarkdown>
              </div>

              {/* Publish button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={publishDraft}
                  disabled={publishingDraft || !draft.trim()}
                  className="bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-all glow flex items-center gap-2 disabled:opacity-40"
                >
                  {publishingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Publish to Feed 🚀
                </button>
                <span className="text-xs text-muted-foreground">
                  This will publish the article to the live public feed immediately.
                </span>
              </div>
            </div>
          </motion.div>
        )}

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
                  <p className="text-xs text-muted-foreground">{post.category} · {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'No date'} · {(post.views || 0).toLocaleString()} views</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => togglePublish(post)} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors" title="Toggle publish">
                    {post.published ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => openEditForm(post)} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(post)} className="p-2 rounded-lg hover:bg-destructive/20 transition-colors">
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
                    <>
                      <div className="prose prose-sm prose-invert max-w-none [&_img]:rounded-xl [&_img]:my-4 [&_img]:w-full [&_img]:max-h-80 [&_img]:object-cover [&_img]:shadow-lg">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {!isStreaming && msg.content.length > 100 && (
                        <button
                          onClick={() => useAsDraft(msg.content)}
                          className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Use as Draft → Edit & Publish
                        </button>
                      )}
                    </>
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
