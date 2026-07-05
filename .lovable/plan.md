
# Site Enhancement Plan — All 4 Tracks

Delivering every suggestion in one pass, ordered so shared primitives land first.

## 1. Pulse Hub Resilience
- Add a reusable `WidgetShell` wrapper (glass card + header slot) exposing:
  - `lastUpdated` timestamp ("Updated 12s ago", auto-tick)
  - Refresh button (spinner while loading)
  - Error state with retry (keeps glass aesthetic, no raw error strings)
- Wire into: `ProMatchCenter`, `CryptoTerminal`, `LocalPulse`, `GlobalTrends`, `TechCategoryGrowth`, `DailyTechLaunches`, `CosmicCommand`, `GlobalHubs`, `GeoIntelligenceHub`, `BreakingNewsTicker`.
- Standardise fetch hooks to return `{ data, loading, error, refetch, updatedAt }`.

## 2. Content Trust & Discovery
- **Source/author badges** on `ContentCard` and inside the reading modal (author avatar/initials + source domain pill).
- **Related posts strip** at the bottom of the reading modal: query 3 posts sharing the primary category/tag, excluding current.
- **Category filters** on Hustle Board and main feed: horizontally scrollable glass chips derived from distinct `posts.category` values, with an "All" reset.

## 3. Engagement
- **Reactions**: extend `likes` table usage with an optional `emoji` column (🔥 🚀 💡 ❤). Migration + RLS + grants. Render as glass chip row on each card with counts and toggle-per-user-per-emoji.
- **Share menu**: dropdown on card ("Copy link", "Twitter/X", "WhatsApp", "LinkedIn", native Web Share when available). Uses existing share util.
- **Weekly digest signup**: small glass CTA in footer / sidebar; writes to `notifications` with `type='digest_subscribe'` for the admin to broadcast weekly.

## 4. UX Polish
- **Infinite scroll** on `ContentGrid`: IntersectionObserver-based pagination replacing static pages; keep skeletons.
- **Empty-state illustrations**: reusable `EmptyState` component (glass card, animated glyph, CTA) used by feed, Hustle Board, bookmarks, notifications.
- **Mobile card density**: tighten `ContentCard` padding/typography under `sm`, 2-line title clamp, compact meta row.

## Technical Notes

### New/edited files (high level)
```text
src/components/pulse/WidgetShell.tsx          NEW
src/hooks/useResilientFetch.ts                NEW
src/components/EmptyState.tsx                 NEW
src/components/ReactionsBar.tsx               NEW
src/components/ShareMenu.tsx                  NEW
src/components/CategoryFilter.tsx             NEW
src/components/RelatedPosts.tsx               NEW
src/components/ContentCard.tsx                edit (badges, reactions, share, density)
src/components/ContentGrid.tsx                edit (infinite scroll, filter, empty)
src/components/reading/ReadingModal.tsx       edit (badges + related strip)
src/pages/HustleBoard.tsx                     edit (filter + empty state)
src/components/pulse/*.tsx                    edit (adopt WidgetShell)
src/pages/PulseDashboard.tsx                  minor tweaks
```

### Migration
```sql
ALTER TABLE public.likes
  ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT 'like';
-- Drop old unique(user_id, post_id) if present and replace with (user_id, post_id, emoji)
```
Preserve existing grants/policies; add index on `(post_id, emoji)`.

### Non-goals
- No backend rewrite of edge functions beyond adding cache headers if trivial.
- No redesign of Pulse layout order (kept from previous turn).
- No new external API providers.

## Rollout Order
1. Migration (`likes.emoji`) + shared primitives (`WidgetShell`, `useResilientFetch`, `EmptyState`, `ReactionsBar`, `ShareMenu`, `CategoryFilter`, `RelatedPosts`).
2. Wire Pulse widgets to `WidgetShell`.
3. Update `ContentCard`, `ContentGrid`, `ReadingModal`, `HustleBoard`.
4. Verify build + quick preview check.
