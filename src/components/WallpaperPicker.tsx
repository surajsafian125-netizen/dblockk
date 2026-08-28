import { Image as ImageIcon, Check, Shuffle, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallpaper, WALLPAPERS, WallpaperChoice } from '@/contexts/WallpaperContext';

const WallpaperPicker = () => {
  const { choice, setChoice, activeId } = useWallpaper();

  const Row = ({ id, label, url }: { id: WallpaperChoice; label: string; url?: string }) => (
    <DropdownMenuItem
      onClick={() => setChoice(id)}
      className="gap-3 cursor-pointer"
    >
      {url ? (
        <span
          className="h-8 w-12 rounded-md bg-cover bg-center border border-border/40 shrink-0"
          style={{ backgroundImage: `url(${url})` }}
        />
      ) : (
        <span className="h-8 w-12 rounded-md border border-border/40 grid place-items-center shrink-0">
          {id === 'auto' ? <Shuffle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
        </span>
      )}
      <span className="flex-1 text-sm">{label}</span>
      {choice === id && <Check className="h-4 w-4 text-primary" />}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="glass rounded-lg p-2 glass-hover transition-all"
          title="Live wallpaper"
          aria-label="Choose live wallpaper"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 glass-strong">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Live Wallpaper
        </DropdownMenuLabel>
        <Row id="auto" label={`Auto rotate${choice === 'auto' && activeId ? ' · live' : ''}`} />
        <DropdownMenuSeparator />
        {WALLPAPERS.map(w => (
          <Row key={w.id} id={w.id} label={w.label} url={w.url} />
        ))}
        <DropdownMenuSeparator />
        <Row id="off" label="None" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WallpaperPicker;
