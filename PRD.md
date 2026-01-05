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
- **Functionality**: Add, view, and remove .kendalkab.go.id domains to monitor with bulk operations and grouping
- **Purpose**: Allows customization of which government websites to track with efficient management of large domain lists
- **Trigger**: User clicks "Add Domain" button, imports CSV, or uses bulk delete in manage tab
- **Progression**: Click Add → Input domain name → Validate format → Save to list → Begin monitoring
- **Success criteria**: Domain persists after page refresh, validates .kendalkab.go.id format, prevents duplicates, handles 300+ domains smoothly

### Performance Optimization
- **Functionality**: Debounced search input (300ms delay), memoized filtering/sorting operations, optimized rendering with React.memo
- **Purpose**: Ensures smooth, fluid user experience when filtering and searching through 300+ domains
- **Trigger**: User types in search field or changes filters
- **Progression**: User input → Debounce delay → Memoized filter calculation → Optimized re-render of visible items only
- **Success criteria**: No visible lag or stutter when typing in search with 300 domains, filter changes are instant, smooth scrolling through large lists

### Real-time Status Monitoring
- **Functionality**: Periodically checks each domain's DNS resolution and HTTP/HTTPS accessibility (testing both protocols), displaying color-coded status with distinction between server reachability and web service availability, with enhanced error detection for network-specific issues. **Now supports both Auto-refresh mode (checks every 60s) and Manual mode (on-demand checking)**.
- **Purpose**: Provides immediate visibility into which sites are up or down, identifies cases where server can be reached but web service is not responding, and detects network-specific accessibility problems (e.g., site accessible from some networks but not others)
- **Trigger**: **Auto mode**: Automatic on page load and every 60 seconds thereafter, or manual refresh. **Manual mode**: User clicks "Check" button to run checks on-demand
- **Progression**: Load page → **[Auto mode]** Fetch all domains → Check DNS resolution → Try HTTPS access → Try HTTP access if HTTPS fails → Detect connection errors → Update status indicator → Repeat after interval **OR [Manual mode]** Wait for user click → Show progress indicator → Run all checks → Display results with summary toast → Offer export option
- **Success criteria**: Status updates within 15 seconds per domain, clear visual distinction between fully online (green), DNS-only/server reachable but HTTP down (amber), and completely offline (red), shows protocol used (HTTP/HTTPS badge), shows last check timestamp, captures detailed error messages for troubleshooting network-specific issues, **mode toggle easily accessible, manual check provides clear completion feedback with domain counts**

### Enhanced Status Indicators
- **Functionality**: Display health status with green (fully accessible), amber (DNS resolves but HTTP unavailable), or red (completely down) indicators
- **Purpose**: Enable quick visual scanning of system health and distinguish between network/DNS issues vs web service issues
- **Trigger**: Automatic after each health check completes
- **Progression**: Health check completes → Check DNS resolution → Check HTTP accessibility → Update color indicator → Show detailed status info on hover
- **Success criteria**: Three-state color system is immediately obvious, tooltip shows detailed diagnostics (DNS resolvable, HTTP accessible, IP address, response time, error details)

### Persistent Configuration
- **Functionality**: Save domain list across browser sessions
- **Purpose**: Users don't need to re-enter domains every visit
- **Trigger**: Automatic on domain add/remove
- **Progression**: User modifies domain list → Save to KV store → Load on next visit
- **Success criteria**: Domain list persists after browser close/reopen

## Edge Case Handling

- **Empty State**: Show helpful onboarding message with example domain when no domains are configured
- **All Domains Down**: Display summary count and suggest checking network connectivity
- **DNS Resolves but HTTP Fails**: Amber status indicator with warning icon, tooltip shows detailed diagnostics including "Server dapat di-ping tetapi website tidak dapat diakses" with specific error (Connection Timeout, Network Unreachable, etc.)
- **Network-Specific Issues**: When domain is accessible via ping/DNS but HTTP fails, system captures error type (timeout, unreachable, failed) to help diagnose firewall/IP-restriction issues where site works on some networks but not others
- **Invalid Domain Format**: Show inline validation error, only accept *.kendalkab.go.id or valid URLs
- **Slow Network**: Show loading skeleton during initial checks, timeout after 10 seconds per domain
- **CORS Issues**: Handle browser CORS restrictions gracefully with error messaging explaining limitations
- **Duplicate Domains**: Prevent adding same domain twice with validation message
- **Manual Mode Initial State**: When in manual mode without any checks performed, show clear call-to-action to run first check with domain count
- **Export Without Check**: In manual mode, export button only available after at least one check has been performed

## Design Direction

The design should evoke a sense of **operational control and technical clarity** - like a mission control center or NOC (Network Operations Center). Users should feel confident and informed, with a professional, focused aesthetic that emphasizes the critical nature of infrastructure monitoring.

## Color Selection

A dark mode monitoring interface with high contrast status indicators for quick recognition in various lighting conditions.

- **Primary Color**: Deep Blue (`oklch(0.35 0.08 250)`) - Communicates technical professionalism and stability, used for primary actions and headers
- **Secondary Colors**: 
  - Dark Slate Background (`oklch(0.15 0.01 250)`) - Reduces eye strain during extended monitoring sessions
  - Medium Gray (`oklch(0.45 0.01 250)`) - For secondary UI elements and borders
- **Accent Color**: Bright Cyan (`oklch(0.75 0.15 200)`) - Electric blue for interactive elements and focus states, suggests digital connectivity
- **Warning Color**: Amber (`oklch(0.70 0.18 60)`) - Used for "DNS-only" status when server is reachable but HTTP/HTTPS service is down
- **Foreground/Background Pairings**:
  - Primary (Deep Blue `oklch(0.35 0.08 250)`): White text (`oklch(0.98 0 0)`) - Ratio 8.2:1 ✓
  - Background (Dark Slate `oklch(0.15 0.01 250)`): Light Gray text (`oklch(0.88 0.01 250)`) - Ratio 11.5:1 ✓
  - Success (Vibrant Green `oklch(0.65 0.20 145)`): White text (`oklch(0.98 0 0)`) - Ratio 5.1:1 ✓
  - Warning (Amber `oklch(0.70 0.18 60)`): Dark text (`oklch(0.15 0.01 250)`) - Ratio 9.8:1 ✓
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
  - Three-state status system: Green (online), Amber (DNS resolves but HTTP down), Red (completely offline)
  - Custom domain card with flex layout: status dot, domain name, IP address, status text, response time/error, delete button
  - Warning icon with tooltip for DNS-only status showing detailed diagnostics
  - Pulsing animation for status transitions using Framer Motion
  - Empty state illustration: Simple SVG or icon composition for zero domains

- **States**:
  - Buttons: Default with cyan accent, hover with brightness increase, active with scale down (0.98)
  - Input: Subtle border on rest, cyan border on focus with glow effect
  - Domain cards: Neutral on rest, elevated shadow on hover, pressed state with scale
  - Status indicators: Solid green (online), solid amber with glow (DNS-only), solid red (offline), pulsing gray (checking)

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
- Implement dual-check system: DNS resolution via Google DNS API, HTTP accessibility via fetch with timeout (10s)
- Distinguish between three states: fully online (DNS + HTTP), DNS-only (server pingable but HTTP down), completely offline
- Note: Browser CORS restrictions may prevent direct domain pings - will use fetch with error handling
- Consider using a CORS proxy or external monitoring API if direct checks fail
- Auto-refresh every 60 seconds using setInterval
- Show last checked timestamp using date-fns for formatting
- Display detailed diagnostic info (DNS status, HTTP status, IP address) in tooltips

**Limitations to Communicate**:
- Browser-based monitoring has CORS limitations - some domains may not be checkable directly
- Users running the app are doing the health checks from their own network
- Not a replacement for server-side monitoring, but useful for quick status overview
