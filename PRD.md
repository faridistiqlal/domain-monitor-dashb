# Planning Guide

A simple, real-time monitoring dashboard to track the availability status of multiple kabupaten.go.id subdomain websites, providing immediate visual feedback on which sites are accessible and which are experiencing downtime.

**Experience Qualities**:
1. **Clarity** - Status information should be instantly recognizable through strong color coding and minimal visual noise
2. **Efficiency** - Quick scanning of many domains without scrolling fatigue, with essential information front and center
3. **Reliability** - Real-time monitoring that feels trustworthy and provides accurate availability data

**Complexity Level**: Light Application (multiple features with basic state)
This is a monitoring dashboard with domain management (add/remove), periodic health checks, and persistent data storage. It requires state management for domains and status tracking but doesn't need complex routing or advanced features.

## Essential Features

### Domain List Management
- **Functionality**: Add, view, and remove .kendalkab.go.id domains to monitor
- **Purpose**: Allows customization of which government websites to track
- **Trigger**: User clicks "Add Domain" button or delete icon on existing domain
- **Progression**: Click Add → Input domain name → Validate format → Save to list → Begin monitoring
- **Success criteria**: Domain persists after page refresh, validates .kendalkab.go.id format, prevents duplicates

### Real-time Status Monitoring
- **Functionality**: Periodically checks each domain's accessibility and displays color-coded status
- **Purpose**: Provides immediate visibility into which sites are up or down
- **Trigger**: Automatic on page load and every 60 seconds thereafter
- **Progression**: Load page → Fetch all domains → Check each URL → Update status indicator → Repeat after interval
- **Success criteria**: Status updates within 10 seconds, clear visual distinction between up/down, shows last check timestamp

### Status Indicators
- **Functionality**: Display health status with green (accessible) or red (down) indicators
- **Purpose**: Enable quick visual scanning of system health
- **Trigger**: Automatic after each health check completes
- **Progression**: Health check completes → Parse response → Update color indicator → Show response time if successful
- **Success criteria**: Color changes are immediate and obvious, includes response time for successful checks

### Persistent Configuration
- **Functionality**: Save domain list across browser sessions
- **Purpose**: Users don't need to re-enter domains every visit
- **Trigger**: Automatic on domain add/remove
- **Progression**: User modifies domain list → Save to KV store → Load on next visit
- **Success criteria**: Domain list persists after browser close/reopen

## Edge Case Handling

- **Empty State**: Show helpful onboarding message with example domain when no domains are configured
- **All Domains Down**: Display summary count and suggest checking network connectivity
- **Invalid Domain Format**: Show inline validation error, only accept *.kendalkab.go.id or valid URLs
- **Slow Network**: Show loading skeleton during initial checks, timeout after 10 seconds per domain
- **CORS Issues**: Handle browser CORS restrictions gracefully with error messaging explaining limitations
- **Duplicate Domains**: Prevent adding same domain twice with validation message

## Design Direction

The design should evoke a sense of **operational control and technical clarity** - like a mission control center or NOC (Network Operations Center). Users should feel confident and informed, with a professional, focused aesthetic that emphasizes the critical nature of infrastructure monitoring.

## Color Selection

A dark mode monitoring interface with high contrast status indicators for quick recognition in various lighting conditions.

- **Primary Color**: Deep Blue (`oklch(0.35 0.08 250)`) - Communicates technical professionalism and stability, used for primary actions and headers
- **Secondary Colors**: 
  - Dark Slate Background (`oklch(0.15 0.01 250)`) - Reduces eye strain during extended monitoring sessions
  - Medium Gray (`oklch(0.45 0.01 250)`) - For secondary UI elements and borders
- **Accent Color**: Bright Cyan (`oklch(0.75 0.15 200)`) - Electric blue for interactive elements and focus states, suggests digital connectivity
- **Foreground/Background Pairings**:
  - Primary (Deep Blue `oklch(0.35 0.08 250)`): White text (`oklch(0.98 0 0)`) - Ratio 8.2:1 ✓
  - Background (Dark Slate `oklch(0.15 0.01 250)`): Light Gray text (`oklch(0.88 0.01 250)`) - Ratio 11.5:1 ✓
  - Success (Vibrant Green `oklch(0.65 0.20 145)`): White text (`oklch(0.98 0 0)`) - Ratio 5.1:1 ✓
  - Destructive (Alert Red `oklch(0.55 0.22 25)`): White text (`oklch(0.98 0 0)`) - Ratio 4.8:1 ✓
  - Accent (Bright Cyan `oklch(0.75 0.15 200)`): Dark text (`oklch(0.15 0.01 250)`) - Ratio 10.2:1 ✓

## Font Selection

Typography should convey **technical precision and modern infrastructure monitoring**, with excellent readability for extended monitoring sessions and clear numerical data display.

- **Primary Typeface**: JetBrains Mono - Monospace font provides technical aesthetic, excellent for displaying domain names and timestamps uniformly
- **Secondary Typeface**: Space Grotesk - Clean geometric sans-serif for headings and UI labels, balances the monospace technical feel

**Typographic Hierarchy**:
- H1 (Dashboard Title): Space Grotesk Bold/32px/tight tracking (-0.02em)
- H2 (Section Headers): Space Grotesk Semibold/20px/normal tracking
- Domain Names: JetBrains Mono Regular/16px/normal (1.5 line height)
- Status Text: Space Grotesk Medium/14px/wide tracking (0.02em) - easier scanning
- Timestamps: JetBrains Mono Regular/12px/normal - technical precision for time data
- Body/Helper Text: Space Grotesk Regular/14px/relaxed (1.6 line height)

## Animations

Animations should reinforce the sense of **live monitoring and system responsiveness** - every update should feel like fresh data arriving. Balance subtle, functional feedback (status transitions) with satisfying moments (successful health checks).

- Status changes should pulse briefly (200ms) to draw attention to state transitions
- Adding new domains should slide in smoothly (300ms ease-out) to feel integrated
- Loading states should use subtle breathing animations (1.5s infinite) suggesting active checking
- Successful health checks can include a quick scale bounce (150ms) for positive feedback
- Page transitions and interactions should be snappy (100-150ms) to maintain the technical, responsive feel

## Component Selection

- **Components**:
  - **Card**: Primary container for each domain's status, with hover states for interactivity
  - **Badge**: Display status labels (Online/Offline) with appropriate color coding
  - **Input**: For adding new domain names with inline validation
  - **Button**: Primary action for adding domains, destructive variant for removing
  - **Dialog**: Confirmation modal for domain removal (optional, could use inline delete)
  - **Separator**: Visual dividers between header and content sections
  - **ScrollArea**: Smooth scrolling for long domain lists
  - **Skeleton**: Loading placeholders during initial health checks

- **Customizations**:
  - Custom status indicator component: Circular dot (12px) with glow effect using box-shadow
  - Custom domain card with flex layout: status dot, domain name, response time, timestamp, delete button
  - Pulsing animation for status transitions using Framer Motion
  - Empty state illustration: Simple SVG or icon composition for zero domains

- **States**:
  - Buttons: Default with cyan accent, hover with brightness increase, active with scale down (0.98)
  - Input: Subtle border on rest, cyan border on focus with glow effect
  - Domain cards: Neutral on rest, elevated shadow on hover, pressed state with scale
  - Status indicators: Solid green (online), solid red (offline), pulsing gray (checking)

- **Icon Selection**:
  - Plus icon for adding domains
  - Trash icon for removing domains  
  - Globe icon for header/branding
  - ArrowClockwise for manual refresh
  - Warning triangle for errors
  - CheckCircle for success states

- **Spacing**:
  - Container padding: p-6 on desktop, p-4 on mobile
  - Card gaps: gap-4 in grid layouts
  - Internal card padding: p-5
  - Section spacing: space-y-6 between major sections
  - Status indicator spacing: gap-3 between dot and text

- **Mobile**:
  - Stack domain cards in single column on mobile
  - Reduce card padding to p-4 for more content density
  - Make domain names wrap or truncate with ellipsis
  - Floating action button for adding domains on small screens
  - Sticky header with compact branding
  - Response times stack below domain names instead of inline

---

## Implementation Notes

**GitHub Spark Publishing**: Ya, aplikasi ini bisa dibuat di GitHub Spark dan di-publish online langsung secara gratis. GitHub Spark menyediakan hosting otomatis untuk aplikasi yang dibuat di platform ini.

**Technical Approach**: 
- Use `useKV` hook to persist domain list
- Implement health checks using `fetch()` with timeout (10s)
- Note: Browser CORS restrictions may prevent direct domain pings - will use fetch with error handling
- Consider using a CORS proxy or external monitoring API if direct checks fail
- Auto-refresh every 60 seconds using setInterval
- Show last checked timestamp using date-fns for formatting

**Limitations to Communicate**:
- Browser-based monitoring has CORS limitations - some domains may not be checkable directly
- Users running the app are doing the health checks from their own network
- Not a replacement for server-side monitoring, but useful for quick status overview
