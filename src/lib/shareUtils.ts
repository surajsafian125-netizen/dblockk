import { toast } from 'sonner';

export async function sharePost(title: string, description: string, postId: string) {
  const url = `${window.location.origin}/?post=${postId}`;
  const shareData = { title, text: description, url };

  if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    try {
      await navigator.share(shareData);
    } catch (e: any) {
      if (e.name !== 'AbortError') copyToClipboard(url);
    }
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(url: string) {
  navigator.clipboard.writeText(url).then(() => {
    toast.success('Link Copied!', {
      description: 'Share it on WhatsApp, Twitter, or anywhere!',
      duration: 3000,
    });
  }).catch(() => {
    toast.error('Failed to copy link');
  });
}
