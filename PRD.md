# Product Requirements Document: TornCorp Analyzer

## 1. Project Vision
**TornCorp Analyzer** is an advanced business intelligence platform tailored for the players of *Torn City*. It provides a unified, high-performance interface for scouting industries, benchmarking corporate performance, and monitoring the competitive landscape using live data from the official Torn API.

## 2. Target Audience
- **Company Directors:** Who seek to monitor their competitors and market trends.
- **Job Seekers:** Looking for the most stable and high-performing companies for maximum perk gain.
- **Market Analysts:** Interested in city-wide industry health and revenue distribution.

## 3. Core Functional Requirements

### 3.1 Industry Scouting
- **industry Range:** Supports all 40+ industry types available in Torn City.
- **Automated Data Fetching:** Dynamic fetching based on user selection using the Public Torn API.

### 3.2 Advanced Filtering Engine
- **Search:** Instant fuzzy-search by company name.
- **Metric Range Filters:**
    - **Star Rating:** Target companies between 0 and 10 stars.
    - **Financials:** Filter by Daily or Weekly income ranges using dual-thumb sliders.
    - **Customers:** Target companies by foot traffic volume.
    - **Age:** Filter established veterans or rising startups.
- **Reset Logic:** One-click restoration of default filtering states.

### 3.3 Competitive Analytics & Ranking
- **Torn Rank (TR):** A proprietary sorting logic that determines city-wide standing based on a hierarchy of Stars followed by Weekly Revenue.
- **Performance Delta (%):** Real-time calculation showing how a company's most recent daily performance compares to its 7-day average.
- **Peer-Group Ranking:** For bookmarked companies, the system calculates relative standing within their specific star-tier for Age, Revenue, and Customers.

### 3.4 User Productivity Tools
- **Bookmark System:** "Mark" specific companies to pin them to the top of the interface for persistent monitoring.
- **Smart Caching:** High-performance local caching with automatic invalidation daily at **18:00 UTC (Torn City Time)**.
- **Theme Support:** Native Light and Dark modes with automatic system preference detection.

## 4. Technical Architecture
- **Framework:** Next.js / React 19.
- **Styling:** Tailwind CSS with dynamic CSS variables for theme switching.
- **External APIs:**
    - **Torn City API (v1):** Direct client-side fetching for company data.
    - **Google Apps Script (GAS):** Webhook for tracking and displaying global application engagement (Views).
- **State Management:** React Hooks with persistence via `localStorage`.

## 5. Security & Privacy
- **Client-Side First:** All data processing, including API key handling and filtering, occurs within the user's browser.
- **Privacy:** User API keys and preferences are stored locally and never transmitted to unauthorized third-party servers.

## 6. UI/UX Design Goals
- **Density:** Provide high-information density without clutter, ideal for analytical tasks.
- **Responsiveness:** Fully fluid layout for mobile, tablet, and desktop viewing.
- **Consistency:** Follow a professional "Data Terminal" aesthetic with a clear visual hierarchy for metrics.

## 7. Roadmap & Future Improvements
- **V2.0:** Historical revenue graphing (multi-day snapshots).
- **V2.1:** Employee contribution analysis (based on public staffing data).
- **V2.2:** industry-to-industry health comparison metrics.
