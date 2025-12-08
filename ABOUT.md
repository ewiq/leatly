# Project Description

## Tech Stack

- **Framework:** SvelteKit with Svelte 5 (runes)
- **Deployment:** Cloudflare Workers
- **Styling:** Tailwind CSS
- **Database:** Cloudflare D1 with Drizzle ORM

## Architecture & Concepts

- Lightweight, primarily frontend-driven
- Minimal backend usage
- No user authentication
- All subscription and settings data stored in `localStorage`

## UI Overview

- Social media-like infinite feed of RSS articles presented as cards
- Scroll-snap behavior between cards
- Clicking a card opens the article on the same page (configurable to `target_blank`)
- Returning to the feed preserves the user's scroll position
- Light and dark mode support

### Navigation

- Hamburger menu in the top-right corner
- RSS subscription management and settings are accessible via the menu

### Feed Behavior

- Recently read or closed items from the last few days are tracked
  - **Read:** Displayed with reduced opacity
  - **Closed:** Hidden from the feed

- Current algorithm shows RSS items in a fully random order
- Lazy loading for performance

## Future Data Sources

- YouTube channel subscriptions
- Daily chess puzzle (Lichess)
- Daily gospel (scraped)
- Daily art
- Random Wikipedia articles feed
- Reddit RSS

## Implementation Ideas

- Add a "favourite" button for articles
- Keyboard navigation
- Customize target_blank in settings
- Store user-added RSS feeds in D1 with metadata (only if not already present)
- Improve randomization so newer content floats higher

### Additional ideas for later

- Category filter
- Today in history

## TODO - Current next tasks

- Solve scroll-snap issues: Menu visibility and search results snapping
- Search bar -> make sure nav back works fine
- Enhance FeedCards - add channel name & image to top -> may need restructuring of DB schema. Change feedcard size - aspect-ratio - more square-like for large screens
- Periodically refresh current subscriptions to look for new items - every 30mins?
- Delete oldest items, leave max 500?

- Add read/close functionality - maybe track each post with timer
- Settings: strictly date sort or randomize
- If random+mobile, add resort on swipe up.
- Add subscription list button to right
- Add keyboard navigation
- Save subscribed channels to a global database - Track popularity
- Privacy notice - About page
- Buy me a coffee
- Enhance first landing page - easily add first rss channels
- Add api rate limiting
