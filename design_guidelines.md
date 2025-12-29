# Crimestoppers Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - This app handles sensitive crime evidence and interfaces with law enforcement.

**Implementation:**
- Use SSO (Apple Sign-In for iOS, Google Sign-In for Android)
- Include email/password as fallback option
- Login screen must display:
  - Privacy policy link
  - Terms of service link
  - Clear messaging about data security and law enforcement partnerships
- Account screen features:
  - User profile with display name and badge number (optional field for law enforcement)
  - Evidence management dashboard
  - Log out (with confirmation: "Are you sure? Unsent evidence will remain on device.")
  - Delete account (Settings > Account > Delete Account with double confirmation and warning about evidence deletion)

### Navigation Architecture
**Tab Navigation (3 tabs)** - Core action (Capture) positioned center

**Tab Structure:**
1. **Evidence** (Gallery icon) - View saved evidence
2. **Capture** (Camera icon) - Center tab, primary action
3. **Profile** (User icon) - Account and settings

### Screen Specifications

#### 1. Capture Screen
**Purpose:** Quick access to camera for capturing photos/videos of incidents

**Layout:**
- No header (full-screen camera view)
- Camera viewfinder fills entire screen
- Floating controls overlay
- Safe area insets: All edges = insets + Spacing.xl

**Components:**
- Camera viewfinder (full-screen)
- Mode toggle (Photo/Video) - pill selector at top
- Capture button (center bottom) - large circular button
  - Photo mode: white circle with red outline
  - Video mode: red circle (pulsing when recording)
- Flip camera button (top right)
- Flash toggle (top left)
- Gallery thumbnail (bottom left) - last captured item preview
- Recording timer (top center, video mode only)

**Floating Elements:**
- All buttons use subtle drop shadow (shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2)

#### 2. Evidence Gallery Screen
**Purpose:** View all captured evidence organized chronologically

**Layout:**
- Custom header with transparent background
  - Title: "Evidence"
  - Right button: Filter icon
  - Search bar below title
- Scrollable grid view
- Safe area insets:
  - Top: headerHeight + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

**Components:**
- Search bar with placeholder: "Search by tag, location, date..."
- Grid of evidence cards (2 columns)
  - Thumbnail preview
  - Type badge (Photo/Video)
  - Timestamp
  - Location tag (if available)
  - Submission status indicator (Draft/Sent)
- Empty state: "No evidence captured. Tap Capture to begin documenting."
- Filter sheet (modal): Date range, type, submission status, location

#### 3. Evidence Detail Screen
**Purpose:** View, tag, and prepare evidence for submission

**Layout:**
- Default navigation header (non-transparent)
  - Left: Back button
  - Right: Delete icon
  - Title: "Evidence Details"
- Scrollable form
- Submit button fixed at bottom
- Safe area insets:
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.xl + 60 (button height)

**Components:**
- Media preview (full-width, 16:9 aspect ratio)
  - Video: play button overlay
  - Photo: tap to expand full screen
- Metadata section (read-only):
  - Captured date/time
  - Location with map thumbnail (tappable to view full map)
- Tagging form:
  - Incident type (dropdown: Theft, Vandalism, Suspicious Activity, Traffic, Other)
  - Description (multi-line text input, 500 char limit)
  - Additional tags (chip input)
- Floating submit button: "Submit to Authorities"
  - Full-width, fixed 16px from screen edges
  - Primary color, white text
  - Drop shadow specification

#### 4. Map View Screen (Modal)
**Purpose:** Display full location context for evidence

**Layout:**
- Modal presentation
- Custom header over map
  - Left: Close button
  - Title: "Location"
  - Right: Open in Maps button
- Map fills remaining space

**Components:**
- Map view with pin marker at evidence location
- Address card overlay (bottom):
  - Street address
  - Coordinates
  - Accuracy indicator

#### 5. Report Submission Screen
**Purpose:** Review and send evidence to law enforcement

**Layout:**
- Default navigation header
  - Left: Cancel
  - Right: Send
  - Title: "Submit Report"
- Scrollable form
- Safe area insets:
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

**Components:**
- Evidence summary cards (compact)
- Agency selector (dropdown with local law enforcement agencies)
- Priority level (Low/Medium/High radio buttons)
- Contact preference (checkbox: "Allow authorities to contact me")
- Optional contact info (phone/email if checked)
- Anonymity toggle: "Submit anonymously"
- Disclaimer text
- Header "Send" button submits form

#### 6. Profile Screen
**Purpose:** Manage account, settings, and submission history

**Layout:**
- Transparent header
  - Title: "Profile"
  - Right: Settings gear icon
- Scrollable list
- Safe area insets:
  - Top: headerHeight + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

**Components:**
- Profile header card:
  - Avatar (user-selectable badge-style icon)
  - Display name
  - User ID/Badge number (optional)
  - Edit button
- Submission history section:
  - List of submitted reports with status
  - Status: Pending/Reviewed/Closed
- Quick stats: Total submissions, evidence items
- Settings button (navigates to settings screen)
- Log out button (bottom of list)

## Design System

### Color Palette
- **Primary:** Deep Blue (#1E3A8A) - Authority, trust
- **Secondary:** Steel Gray (#64748B) - Neutral, professional
- **Accent:** Alert Red (#DC2626) - Urgency, recording state
- **Success:** Forest Green (#059669) - Submitted status
- **Background:** Off-White (#F8FAFC)
- **Surface:** White (#FFFFFF)
- **Text Primary:** Charcoal (#1E293B)
- **Text Secondary:** Slate (#64748B)
- **Border:** Light Gray (#E2E8F0)

### Typography
- **Headers:** System Bold, 24-28pt
- **Subheaders:** System Semibold, 18-20pt
- **Body:** System Regular, 16pt
- **Captions:** System Regular, 14pt
- **Buttons:** System Semibold, 16-18pt

### Interactive Feedback
- All buttons scale to 0.96 when pressed
- List items show light gray background (#F1F5F9) when pressed
- Toggle switches animate smoothly with haptic feedback
- Capture button pulses subtly when in video recording mode

### Required Assets
**Generated Icons (Badge-style avatars for user profiles):**
- Shield Badge (Blue)
- Star Badge (Gold)
- Checkmark Badge (Green)
- Eye Badge (Silver)

**Note:** All other UI elements use Feather icons from @expo/vector-icons (camera, map-pin, shield, alert-circle, clock, check-circle, user, settings, etc.)

### Accessibility
- Minimum touch target: 44x44 points
- Color contrast ratio: Minimum 4.5:1 for text
- All images include alt text
- Support dynamic type sizing
- VoiceOver labels for all interactive elements
- Emergency/quick capture should work with minimal taps