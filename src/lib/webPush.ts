import { supabase } from '@/integrations/supabase/client';

export const VAPID_PUBLIC_KEY =
  'BEbBDgIH0oPGLLHFV-_wJLVfK1z6QL_p6iZDgV55KvpHCSBNrHuszplFj-rxCHD3JgROEd6sYLkAw1DlIYaN1TE';

export const webPushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const b64ToUint8 = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const getRegistration = () => navigator.serviceWorker.register('/push-sw.js', { scope: '/push/' });

// navigator.serviceWorker.ready never resolves for a worker scoped outside the page,
// so wait for this registration's own worker to become active instead.
const waitActive = (reg: ServiceWorkerRegistration) =>
  new Promise<void>((resolve, reject) => {
    if (reg.active) return resolve();
    const sw = reg.installing || reg.waiting;
    const timer = setTimeout(() => reject(new Error('Service worker activation timed out')), 10000);
    sw?.addEventListener('statechange', () => {
      if (sw.state === 'activated') { clearTimeout(timer); resolve(); }
    });
  });

/** Subscribe this device and save it. Returns true on success. */
export async function subscribeDevice(userId: string): Promise<boolean> {
  if (!webPushSupported()) return false;
  try {
    const reg = await getRegistration();
    await waitActive(reg);
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    const { error } = await (supabase as any).from('push_subscriptions').upsert(
      { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent.slice(0, 250) },
      { onConflict: 'endpoint' },
    );
    if (error) { console.error('[push] save failed', error); return false; }
    return true;
  } catch (e) {
    console.error('[push] subscribe failed', e);
    return false;
  }
}

export async function unsubscribeDevice(): Promise<void> {
  if (!webPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/push/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await (supabase as any).from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch (e) {
    console.error('[push] unsubscribe failed', e);
  }
}
