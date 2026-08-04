# Video demo options for PePFibPred LinkedIn post

## Option 1: Remotion (recommended for your skill set)

**What it is:** React framework for creating videos programmatically. You write React components, Remotion renders them as MP4/WebM at 30-60fps.

**Why it fits:**
- You already know React + TypeScript — no new toolchain to learn
- You can embed actual screenshots of the app as still frames
- Animated text overlays, transitions, and annotations in JSX
- Renders offline (no screen recording artifacts, no cursor jitter)
- Output is a clean MP4 you can upload to LinkedIn directly

**Setup:**
```bash
npx create-video@latest pepfibpred-demo
cd pepfibpred-demo
npm start  # opens localhost:3000 with a preview
```

**What to build:** A 60-90 second video with 5-6 scenes:
1. Title card: "PePFibPred — Predicting fibril-forming peptides" (3s)
2. Paste a sequence → Quick Analyze results appear (show screenshot, animate zoom) (8s)
3. 4-class classification Venn diagram (show screenshot, highlight each class) (10s)
4. Batch upload → Results dashboard (show screenshot, scroll effect) (8s)
5. PeptideDetail deep-dive with Mol* 3D (show screenshot) (8s)
6. Closing card with GitHub URL + team credits (3s)

**Trade-off:** You write code to make the video, not drag-and-drop. But for a developer this is faster and produces a more polished result than any screen recorder.

## Option 2: Screen recording (simplest)

**Tool:** macOS built-in (Cmd+Shift+5) or OBS Studio (free)
**What to do:** Record yourself using the live app at http://94.130.178.182:3000
**Trade-off:** Quick but raw — cursor movements, loading spinners, any hiccups show. Need to edit afterward (iMovie or CapCut, both on your Mac).

## Option 3: Loom (fastest to share)

**What it is:** Screen recorder with instant shareable link
**Trade-off:** Great for internal demos, but the Loom watermark and hosted-link format don't project well on LinkedIn. MP4 download available on paid plans.

## Option 4: Figma + prototype recording

**What it is:** Build a click-through prototype in Figma from screenshots, record the prototype interaction
**Trade-off:** Polished but static — no real data flowing through the app

## Recommendation

**For LinkedIn carousel post:** Use static screenshots (Prompt 2 from the kit). No video needed for a carousel — 5 PNG slides work perfectly.

**For a standalone demo video (optional, high engagement):** Use Remotion. You'll spend ~2 hours writing the React components, but the output is publication-quality and reusable (same video can go on the repo README, the bio.tools submission, and your portfolio).

**For a quick walkthrough to send Peleg/Alex:** Use Loom or macOS screen recording. 3-4 minutes, narrated, unlisted.
