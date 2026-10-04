import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, BellRing, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { subscribeDevice, unsubscribeDevice, webPushSupported } from '@/lib/webPush';

interface Notification {
  id: string;
  title?: string | null;
  message: string;
  type?: string | null;
  link?: string | null;
  user_id?: string | null;
  is_read?: boolean | null;
  created_at: string;
}

const timeAgo = (date: string) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const pushSupported = () => typeof window !== 'undefined' && 'Notification' in window;

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [permission, setPermission] = useState<string>(pushSupported() ? Notification.permission : 'unsupported');
  const [pushEnabled, setPushEnabled] = useState(false);
  const pushRef = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  pushRef.current = pushEnabled && permission === 'granted';

  const isRead = (n: Notification) => readIds.has(n.id) || !!n.is_read;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: notes }, { data: reads }, { data: pref }] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('notification_reads').select('notification_id').eq('user_id', user.id),
        (supabase as any).from('push_preferences').select('enabled').eq('user_id', user.id).maybeSingle(),
      ]);
      if (notes) setNotifications(notes as Notification[]);
      if (reads) setReadIds(new Set(reads.map((r) => r.notification_id)));
      setPushEnabled(!!pref?.enabled);
    })();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new as Notification;
        if (n.user_id && n.user_id !== user.id) return;
        setNotifications((prev) => [n, ...prev.filter((p) => p.id !== n.id)]);
        if (pushRef.current) {
          try {
            const native = new Notification(n.title || "D'Block", { body: n.message, icon: '/icon-192.png', tag: n.id });
            native.onclick = () => { window.focus(); if (n.link) window.location.href = n.link; };
          } catch { /* ignore */ }
        } else {
          toast(n.title || 'New notification', { description: n.message });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = async (list: Notification[]) => {
    if (!user) return;
    const unread = list.filter((n) => !isRead(n));
    if (!unread.length) return;
    const personal = unread.filter((n) => n.user_id === user.id).map((n) => n.id);
    const broadcast = unread.filter((n) => !n.user_id);
    if (personal.length) await supabase.from('notifications').update({ is_read: true } as any).in('id', personal);
    if (broadcast.length)
      await supabase.from('notification_reads').insert(broadcast.map((n) => ({ user_id: user.id, notification_id: n.id })));
    setReadIds((prev) => { const next = new Set(prev); unread.forEach((n) => next.add(n.id)); return next; });
  };

  const [busy, setBusy] = useState(false);
  const togglePush = async () => {
    if (busy) return;
    if (!user || !pushSupported()) { toast.error('This browser does not support notifications'); return; }
    if (window.self !== window.top) {
      toast.error('Open D\'Block in its own tab (not the editor preview) to turn on alerts');
      return;
    }
    setBusy(true);
    try {
      let perm = Notification.permission;
      if (!pushEnabled && perm !== 'granted') perm = await Notification.requestPermission();
      setPermission(perm);
      const enabled = !pushEnabled && perm === 'granted';
      if (!pushEnabled && perm !== 'granted') toast.error('Notifications are blocked in your browser settings');
      if (enabled) {
        const ok = await subscribeDevice(user.id);
        if (!webPushSupported()) toast.message('On iPhone, add D\'Block to your Home Screen to get alerts when closed');
        else if (!ok) toast.warning('Alerts will show while D\'Block is open; closed-app alerts could not be set up on this device');
      } else if (pushEnabled) {
        await unsubscribeDevice();
      }
      const { error } = await (supabase as any).from('push_preferences').upsert({
        user_id: user.id, enabled, permission: perm, user_agent: navigator.userAgent.slice(0, 250),
      });
      if (error) console.error('[push] preference save failed', error);
      setPushEnabled(enabled);
      if (enabled) toast.success('Push notifications enabled');
      else if (pushEnabled) toast.message('Push notifications turned off');
    } catch (e) {
      console.error('[push] toggle failed', e);
      toast.error('Could not change notification settings');
    } finally {
      setBusy(false);
    }
  };

  // Refresh this device's subscription when already opted in
  useEffect(() => {
    if (user && pushEnabled && permission === 'granted') subscribeDevice(user.id);
  }, [user, pushEnabled, permission]);

  const openItem = (n: Notification) => {
    markRead([n]);
    if (n.link) {
      if (/^https?:\/\//.test(n.link)) window.open(n.link, '_blank', 'noopener');
      else window.location.href = n.link;
    }
  };

  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg glass glass-hover transition-all"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] max-h-[28rem] overflow-y-auto rounded-2xl border border-primary/10 bg-card/80 backdrop-blur-xl shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)] z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <span className="font-display text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => markRead(notifications)} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  <Check className="h-3 w-3" /> Mark all as read
                </button>
              )}
            </div>

            {permission !== 'unsupported' && (
              <button
                onClick={togglePush}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs border-b border-border/30 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2">
                  <BellRing className="h-3.5 w-3.5 text-primary" />
                  {pushEnabled ? 'Push notifications on' : 'Enable Push Notifications'}
                </span>
                <span className={`h-4 w-7 rounded-full p-0.5 transition-colors ${pushEnabled ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`block h-3 w-3 rounded-full bg-background transition-transform ${pushEnabled ? 'translate-x-3' : ''}`} />
                </span>
              </button>
            )}

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              <div className="divide-y divide-border/20">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-primary/10 ${isRead(n) ? 'opacity-60' : 'bg-primary/5'}`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase tracking-wide text-primary">{n.type || 'info'}</span>
                      {n.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    {n.title && <p className="font-semibold leading-snug">{n.title}</p>}
                    <p className="text-foreground/90 leading-snug">{n.message}</p>
                    <span className="text-[11px] text-muted-foreground mt-1 block">{timeAgo(n.created_at)}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
