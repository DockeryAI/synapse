# Dashboard V2.1 - User Guide
**Last Updated:** 2025-11-24
**Version:** 2.1.0

---

## 🎯 Overview

The Dashboard V2.1 Intelligence Library provides a unified interface for discovering, exploring, and acting on AI-generated content insights. This guide covers all features, workflows, and best practices.

---

## 🚀 Quick Start

### Access Intelligence Library

1. **Navigate to Dashboard**
   - From anywhere in the app, press `Ctrl+D` (or `Cmd+D` on Mac)
   - Or click "Dashboard" in the navigation menu

2. **Generate Intelligence**
   - Click "Generate Intelligence" button
   - System fetches data from 14+ sources
   - Wait for synthesis to complete (~30-60 seconds)

3. **Explore Results**
   - View clusters of related insights
   - Identify breakthrough opportunities
   - Browse individual insights by category

---

## 📊 Intelligence Display Modes

### Power Mode (Default)
**Best for:** Experienced users who want full control and visibility

**Features:**
- Full insight grid with expandable cards
- Cluster visualization with pattern detection
- Breakthrough opportunities highlighted
- Quality metrics visible
- Advanced filtering options

**Access:** Toggle "Power Mode" switch at top of Intelligence Library

### Easy Mode
**Best for:** Quick scanning and simple actions

**Features:**
- Simplified card layout
- One-click actions
- Pre-filtered for high-quality insights
- Fewer visual elements
- Faster scanning

**Access:** Toggle off "Power Mode" switch

---

## 🎨 Main Components

### 1. Insight Clusters

**What are Clusters?**
- Groups of 3+ related insights sharing a common theme
- Automatically detected by AI pattern analysis
- Scored for coherence (0-100)
- Labeled with dominant sentiment

**Cluster Card Elements:**
- **Theme:** Main topic connecting the insights
- **Size:** Number of insights in cluster
- **Coherence:** How well insights align (higher = stronger pattern)
- **Sentiment:** Positive, negative, neutral, or mixed
- **Framework:** Marketing framework used (e.g., AIDA, Jobs-to-be-Done)
- **Quality Score:** Average quality of insights (0-100)

**Actions:**
- **Generate Campaign:** Create a campaign based on the cluster theme
  - Navigates to Campaign Builder
  - Pre-selects templates matching cluster framework
  - Passes cluster metadata for template customization

### 2. Breakthrough Cards

**What are Breakthroughs?**
- Exceptionally high-value insights (quality ≥85)
- Profound ideas with strong timing justification
- Rare discoveries worth special attention

**Breakthrough Card Elements:**
- **Insight Text:** The core breakthrough idea
- **Why Profound:** Explanation of significance
- **Why Now:** Timing justification
- **Quality Score:** Overall quality rating (85-100)
- **Framework:** Marketing framework alignment

**Actions:**
- **Generate with Synapse:** Create breakthrough content
  - Triggers celebration animation
  - Navigates to Synapse page
  - Pre-populates form with breakthrough data
  - Shows "Building from Breakthrough Insight" banner

### 3. Insight Grid

**Insight Categories:**
- **Competitive:** Market positioning opportunities
- **Trending:** Current trends and momentum
- **Pain Point:** Customer problems to solve
- **Opportunity:** Growth and expansion ideas
- **Customer Sentiment:** Emotional insights

**Insight Card Elements:**
- **Title:** Concise summary
- **Category Badge:** Color-coded by type
- **Framework Badge:** Marketing framework used
- **Quality Score:** 0-100 rating (if scored)
- **Source:** Where insight originated (e.g., serper, reddit)

**Card States:**
- **Collapsed:** Shows title, category, framework
- **Expanded:** Shows full description, metadata, actions

**Actions:**
- **Build Campaign:** Create campaign from single insight
  - Navigates to Campaign Builder
  - Passes insight context (title, type, framework, quality)
  - Shows "Building from Individual Insight" banner

---

## 🎯 Complete Workflows

### Workflow 1: Building a Campaign from a Cluster

**Use Case:** You've discovered a strong pattern across multiple insights and want to create a comprehensive campaign

**Steps:**
1. **Generate Intelligence**
   - Click "Generate Intelligence" in dashboard
   - Wait for synthesis to complete

2. **Identify Strong Cluster**
   - Look for clusters with:
     - High coherence (≥75)
     - Meaningful size (≥5 insights)
     - Relevant theme for your brand

3. **Review Cluster Details**
   - Click cluster card to see examples
   - Verify framework alignment
   - Check quality score

4. **Generate Campaign**
   - Click "Generate Campaign" button
   - You'll navigate to Campaign Builder
   - Context banner shows:
     - Cluster theme
     - Framework used
     - Cluster size
     - Quality score

5. **Select Template**
   - Templates are pre-filtered by framework
   - Choose template matching your cluster theme
   - Example: "Awareness" cluster → "Launch Campaign" template

6. **Customize Campaign**
   - Adjust timeline
   - Set target audience
   - Modify content pieces
   - Review and launch

**Expected Result:**
- Multi-piece campaign aligned with cluster theme
- Content resonates across the identified pattern
- Framework-driven narrative arc

---

### Workflow 2: Acting on a Breakthrough

**Use Case:** You've found a profound insight with perfect timing and want to create breakthrough content

**Steps:**
1. **Identify Breakthrough**
   - Breakthrough cards appear automatically
   - Look for quality scores ≥85
   - Read "Why Profound" and "Why Now"

2. **Evaluate Insight**
   - Is the insight truly novel for your brand?
   - Does the timing make sense?
   - Is the framework alignment correct?

3. **Generate with Synapse**
   - Click "Generate with Synapse" button
   - Watch celebration animation (quality ≥85)
   - Navigate to Synapse page

4. **Review Pre-populated Context**
   - Context banner shows:
     - Insight text
     - Why profound
     - Why now
     - Framework
     - Quality score

5. **Configure Content Generation**
   - Enter your website URL (or use pre-filled)
   - Select industry
   - Choose platforms (LinkedIn, Facebook, etc.)
   - Set edginess level

6. **Generate Content**
   - Click "Generate Synapses"
   - Wait for multi-source intelligence gathering
   - Review generated content
   - Enhance with humor if desired

**Expected Result:**
- Multiple content pieces (posts, articles, campaigns)
- Optimized for breakthrough insight
- Platform-specific variants
- High engagement potential

---

### Workflow 3: Building from a Single Insight

**Use Case:** You've found a specific insight that perfectly addresses a customer pain point

**Steps:**
1. **Browse Insights**
   - Use category filters (Competitive, Trending, etc.)
   - Toggle "Show High Quality Only" for focus
   - Scan insight cards

2. **Expand Insight Card**
   - Click insight card to expand
   - Read full description
   - Check quality score and framework

3. **Build Campaign**
   - Click "Build Campaign from This Insight"
   - Navigate to Campaign Builder
   - Context banner shows:
     - Insight title
     - Insight type
     - Framework
     - Quality score

4. **Template Selection**
   - Choose template matching insight category
   - Example: "Pain Point" insight → "Solution Campaign"

5. **Leverage Context**
   - Campaign pre-configured with:
     - Customer segments from insight
     - Framework alignment
     - Quality expectations

6. **Customize and Launch**
   - Adjust timeline
   - Modify content pieces
   - Review and launch

**Expected Result:**
- Targeted campaign addressing specific insight
- Framework-aligned messaging
- Customer segment focus

---

## ⚙️ Advanced Features

### Quality Score Caching

**What it does:**
- Automatically caches quality scores for 24 hours
- Reduces computation time on repeat views
- 90% performance improvement on cached insights

**How it works:**
- First view: Computed via AI quality scorer
- Subsequent views: Retrieved from LocalStorage cache
- Automatic expiry after 24 hours
- Automatic cleanup of expired scores

**User benefit:**
- Faster page loads
- Consistent scoring
- No manual intervention needed

---

### Opportunity Snooze/Dismiss

**What it does:**
- Hide opportunities temporarily (snooze) or permanently (dismiss)
- Keep your dashboard focused on actionable items
- Automatic restoration of snoozed items after duration

**How to use:**

**Snooze (24 hours):**
1. Find opportunity card
2. Click BellOff icon (top right)
3. Opportunity hidden for 24 hours
4. Automatically reappears after duration

**Dismiss (permanent):**
1. Find opportunity card
2. Click X icon (bottom right)
3. Opportunity hidden permanently
4. Can be restored via service API if needed

**Where it works:**
- Opportunity Radar component
- Any dashboard widget showing opportunities
- Respects hidden state across page reloads

---

### Keyboard Shortcuts

**Navigation Shortcuts:**
- `Ctrl+D` (Cmd+D on Mac) - Go to Dashboard
- `Ctrl+I` (Cmd+I on Mac) - Go to Insights
- `Ctrl+C` (Cmd+C on Mac) - New Campaign
- `Ctrl+S` (Cmd+S on Mac) - Open Synapse
- `Ctrl+L` (Cmd+L on Mac) - Open Calendar

**Utility Shortcuts:**
- `Shift+?` - Show keyboard shortcuts help

**Features:**
- Smart input detection (won't trigger while typing in forms)
- Cross-platform support (Mac/Windows)
- <100ms navigation time

---

### Lazy Loading

**What it does:**
- Loads heavy components only when needed
- Reduces initial page load time by ~30%
- Shows loading skeletons during load

**Components lazy loaded:**
- PowerMode intelligence grid
- EasyMode simplified view
- OpportunityRadar
- BreakthroughScoreCard
- ContentCalendar
- CampaignBuilder

**User experience:**
- Skeleton loaders maintain layout
- Smooth transitions
- No flash of empty content

---

## 🎨 Visual Elements

### Context Banners

**When you see them:**
- After navigating from insight → campaign
- After navigating from cluster → campaign
- After navigating from breakthrough → synapse

**What they show:**
- Source of navigation (cluster, insight, or breakthrough)
- Key context preserved from source
- Framework alignment
- Quality metrics

**Styling:**
- Purple gradient background
- Info icon on left
- Key details prominently displayed
- Dark mode support

---

### Quality Scores

**Color Coding:**
- 🟢 Green (85-100): Excellent quality
- 🟡 Yellow (70-84): Good quality
- 🟠 Orange (50-69): Fair quality
- 🔴 Red (0-49): Needs improvement

**Where you see them:**
- Insight cards
- Cluster cards
- Breakthrough cards
- Context banners

---

### Framework Badges

**Common Frameworks:**
- **AIDA:** Attention, Interest, Desire, Action
- **Jobs-to-be-Done:** Functional, emotional, social jobs
- **FAB:** Features, Advantages, Benefits
- **PAS:** Problem, Agitate, Solution
- **Hook-Story-Offer:** Classic storytelling
- **Value Proposition Canvas:** Customer jobs, pains, gains

**Badge Colors:**
- Each framework has distinct color
- Consistent across all components
- Helps quickly identify content type

---

## 📱 Mobile & Responsive

**Current Status:**
- Optimized for desktop (1920x1080+)
- Tablet support (1024x768+)
- Mobile support in development

**Best Experience:**
- Desktop: Full feature set
- Tablet: Simplified layouts, all features available
- Mobile: Coming soon

---

## 🔧 Troubleshooting

### Intelligence Not Loading

**Symptoms:**
- "Generate Intelligence" button doesn't work
- Stuck on loading screen

**Solutions:**
1. Check internet connection
2. Verify API keys are configured
3. Check browser console for errors
4. Try clearing cache and reloading

---

### Context Not Showing in Campaign Builder

**Symptoms:**
- Navigate from insight but no context banner
- Context data missing

**Solutions:**
1. Verify you clicked a navigation button (not manual URL entry)
2. Check that source page passed context
3. Try navigating again
4. Check browser console for navigation errors

---

### Quality Scores Not Appearing

**Symptoms:**
- Insights show "N/A" for quality score
- Scores not cached

**Solutions:**
1. Wait for quality scoring to complete
2. Check LocalStorage is enabled
3. Clear cache and regenerate intelligence
4. Verify quality scorer service is working

---

### Keyboard Shortcuts Not Working

**Symptoms:**
- Shortcuts don't navigate
- Nothing happens on key press

**Solutions:**
1. Ensure you're not typing in an input field
2. Check keyboard shortcuts are enabled
3. Try refreshing page
4. Verify correct key combinations (Ctrl vs Cmd)

---

## 📊 Best Practices

### 1. Quality Over Quantity
- Use "Show High Quality Only" filter
- Focus on quality scores ≥70
- Prioritize breakthroughs (≥85)

### 2. Framework Alignment
- Match campaigns to framework
- Consistent messaging within framework
- Leverage framework badges for quick identification

### 3. Context Preservation
- Always use navigation buttons (not manual URL entry)
- Review context banners before proceeding
- Verify framework matches your brand strategy

### 4. Regular Intelligence Generation
- Generate fresh intelligence weekly
- Market trends change rapidly
- New insights emerge constantly

### 5. Cluster Exploration
- Look for unexpected patterns
- High coherence = strong signal
- Large clusters = established trends
- Small clusters = emerging opportunities

---

## 🎓 Tips & Tricks

### Finding Hidden Gems
1. Sort by quality score
2. Filter by "Opportunity" category
3. Look for small clusters (3-5 insights)
4. Check for unique framework combinations

### Maximizing Campaign Impact
1. Start with breakthrough insights
2. Build cluster-based campaigns for scale
3. Use framework alignment for consistency
4. Leverage customer segments from insights

### Efficient Workflow
1. Use keyboard shortcuts
2. Snooze low-priority opportunities
3. Dismiss irrelevant insights
4. Cache quality scores automatically

---

## 📞 Support

**Documentation:**
- Phase 4-5 Completion Report
- Phase 6 Completion Report
- Framework Context Preservation Guide

**Contact:**
- Report issues via GitHub
- Feature requests via product roadmap

---

**Version:** 2.1.0
**Last Updated:** 2025-11-24
**Status:** Production Ready
