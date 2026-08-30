# D'Block: Profiles, Discovery, Ops & Trust

A large scope — proposed as four shippable phases. Each phase is independently useful, and I'll build them in order unless you want to reorder or drop items.

## Phase 1 — Identity & Retention
- **Profiles table** (display name, handle, avatar, bio, joined date) auto-created on signup via trigger.
- **Public profile page** `/u/:handle` — joined date, reaction/bookmark counts, and a public activity strip (bookmarked + reacted articles). Users control visibility with a "public profile" toggle.
- **Reading streak** — daily read events recorded per user; a subtle flame badge in the header showing "X-day streak", with the longest streak on the profile.

## Phase 2 — Discovery
- **For You feed** — a ranked tab on the home feed scoring posts by the categories/tags the user reacts to and bookmarks, blended with recency so it never goes stale.
- **Tag pages** `/tag/:tag` and category pages with their own feeds and headers.
- **Trending tags cloud** — tag frequency weighted by recent engagement, rendered as a clickable cloud on the home page and Pulse Hub.
- **Full-text search** `/search` — Postgres full-text index over post title/description/content, with filters for category, date range, and source/news_category.

## Phase 3 — Admin & Ops
- **Scheduled publishing** — a `publish_at` timestamp on drafts; a scheduled edge function flips due drafts to published. Admin gets a date/time picker alongside the existing publish action.
- **Content calendar** — month view in Admin showing scheduled and published posts, click a day to see or reschedule items.
- **Analytics dashboard (real data)** — views, top articles, reactions, bookmarks, comments, and subscriber growth charted from your own tables (replaces the manually-overridden numbers).

## Phase 4 — Trust & Distribution
- **Report button** on posts and comments, writing to a `reports` table, surfaced as a moderation queue in Admin (dismiss / delete content / note).
- **RSS out-feed** — a public `rss.xml` edge function serving the latest published posts as valid RSS 2.0, linked in the footer and `<head>`.

## Technical notes
- New tables: `profiles`, `reading_streaks` (or `reading_events`), `post_reports`, plus `publish_at` on `posts`. Every table gets explicit GRANTs and RLS: profiles readable publicly only when the user opts in, streaks/reports owner-or-admin scoped, reports insertable by any authenticated user.
- Search uses a generated `tsvector` column + GIN index, queried through a security-definer RPC so it stays fast and RLS-safe (published posts only).
- Scheduling and RSS are Supabase edge functions; the scheduler runs on a cron trigger.
- All new UI follows the existing glassmorphism system (`glass` / `glass-strong`, Framer Motion transitions, no hardcoded colors), and works down to 375px with no horizontal overflow.
- No mock data anywhere — every widget reads live tables.

## Order of work
I'll start with Phase 1 and check in after each phase so you can review before I continue.
