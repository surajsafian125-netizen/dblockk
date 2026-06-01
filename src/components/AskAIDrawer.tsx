import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2 } from 'lucide-react';
import { streamChat, type Msg } from '@/lib/streamChat';
import { toast } from 'sonner';

interface AskAIDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AskAIDrawer = ({ open, onOpenChange }: AskAIDrawerProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      await streamChat({
        messages: next.slice(0, -1),
        onDelta: (delta) => {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + delta };
            return copy;
          });
        },
        onDone: () => setLoading(false),
      });
    } catch (err: any) {
      toast.error('AI request failed', { description: err.message });
      setMessages((prev) => prev.slice(0, -2));
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 glass">
        <SheetHeader className="p-4 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Ask <span className="text-primary text-glow">D'Block AI</span>
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-8">
              Ask anything — tech, culture, markets, or insights.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                m.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'mr-auto bg-background/50 border border-border/30 whitespace-pre-wrap'
              }`}
            >
              {m.content || <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border/30 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a question…"
            disabled={loading}
            autoFocus
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AskAIDrawer;
