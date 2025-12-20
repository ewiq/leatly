### NEXT

- fetch url client-side first and then only server-side if failed

- Youtube oAuth to import subscribed channels
- Privacy notice - About page
- Handle old item deletion (but not favourited)
- general refactor
- OPML compatibility for imports

### BUGS

- Navigation correction: ensure scroll: top beforenavigate also works on main feed

### LATER

- Shuffle feed (see below)
- i18n
- Save subscribed rss channels to a global database - Track popularity
- Google analytics
- Enhance first landing page - easily add first rss channels.
- Add api rate limiting
- Domain checking and validation ('extractdomain') refactor and enhancment
- 'Add new' sub -> Possibility to choose from D1 channels
- Implement 'RSS Feed Finder' - If not valid xml URL, but valid page, try to find any rss link on the website and propose to user.
- Create sharable link to import RSS collection (D1 db): modal -> User should be able to choose which to share from his channels - CONSTRAINTS: subbed to at least 5 channels -> cross-check with d1 to check if valid channels (to avoid
  manipulation of IDB before share) -> CHECK IF COLLECTIONS NAMES AREN'T TO LONG AND ALL OF KINDS OF STUFF LIKE THAT

- Handle slow import in UI. Load list of channels, and then let user select/customize channel list before import
- Enhance "looks like you're new here landing page.
- Handle feeds with no or invalid pubDate - add date '0'/current when importing?
- Suggestion: Add items that where fetched directly, channel by channel to the feed, not in a batch

## Misc

- Daily chess puzzle (Lichess)
- Daily gospel (scraped)
- Daily art
- Random Wikipedia articles feed
- Today in history (wiki)
- Reddit RSS
- Podcast and media player implementation
- Disable YT shorts

### Shuffle algorithm ideas

- Shouldn't be totally random. Fresher contents still at the top. Limit how many consecutive from same channel - Burst suppression - (limit n items per source within X items).
- Prevent 'loud sources' to spam the feed. Consider 'slower' feeds. Round-robin between sources.
- Varying between item types (when videos, podcasts will be implemented).
- When showing items that were previously displayed, consider 'timesDisplayed' or 'msDisplayed' when sorting
  Precompute shuffle key for a few 1000 items in the working set.
- If random+mobile, new shuffle on swipe up (refresh)
- Add timesDisplayed property to items - when active in viewport for mor than 1s ( or how much?)

## RSS reader problems

- When subscibing to: https://feeds.content.dowjones.io/public/rss/RSSOpinion 401 error
- There clearly is a https://s.wsj.net/media/wsj_apple-touch-icon-180x180.png in source code.
- Enhance Description parser: https://www.nme.com/feed gives html/MD text, http://feeds.feedburner.com/Archeyes give incorrect text.
