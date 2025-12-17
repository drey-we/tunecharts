# 🎵 TuneCharts

A suite of visual tools for music lovers, integrated with Last.fm and Spotify APIs. This project generates aesthetic reports ("receipts"), listening statistics, and music compatibility analysis, optimized for social sharing (Instagram Stories).

This repository is a **Monorepo** hosting three distinct tools in subdirectories, serving both the main domain and its subdomains.

## 📂 Project Structure

The project is organized to handle multiple tools within a single repository:

```text
tunecharts/
├── index.html          # Main Tool (Charts/Receipts)
├── assets/             # Main site assets & OG-Images
├── css/ & js/          # Core styles and scripts
│
├── counter/            # Subdomain: Time Counter
│   ├── index.html
│   ├── assets/         # Counter-specific assets (Purple theme)
│   └── ...
│
├── matcher/            # Subdomain: Compatibility Matcher
│   ├── index.html
│   ├── assets/         # Matcher-specific assets
│   └── ...
│
└── beta/               # Staging area (Ignored by Git)
```

## 🛠️ Tools & Features
### 1. TuneCharts (Main)

Generates visual cards summarizing top albums, artists, and tracks over customizable periods.

    Focus: Aesthetics and shareability (9:16 format).

    Tech: Canvas generation for instant download.

### 2. Counter (/counter)

Calculates the total time (hours/minutes) a user has spent listening to music.

    Methodology: To ensure mobile performance and avoid API rate limiting, this tool analyzes the user's Top 1,000 Tracks.

    Disclaimer: While this covers 99% of listening time for most users, tracks ranked below 1,000 are not included in the total sum. This decision prioritizes speed and stability over "forensic" precision found in slower, aggressive scrapers.

    UI: Includes an informational modal explaining this calculation logic to the user.

### 3. Matcher (/matcher)

A compatibility tool that cross-references listening history between two users to generate a "Match Score" based on shared artists and genres.

## ⚠️ Security & API Usage

This project relies on client-side calls to public APIs (Last.fm & Spotify).

API Keys: API Keys used in frontend JavaScript are publicly visible by design.

**Important for Forks:**

- Please generate your own API Keys via the Last.fm API Console and Spotify for Developers.

- NEVER commit a Spotify **"Client Secret"** to a public repository. If backend authentication is needed, use environment variables or a server-side proxy.

- Be mindful of API rate limits.

## 🚀 Deployment & Workflow

This project utilizes a direct-to-production workflow tailored for Hostinger:

- Development: Edits are made directly in the Hostinger environment (or local setup).

- Version Control: Changes are pushed from the server terminal to GitHub for backup/versioning.

## Typical Workflow
git add .
git commit -m "Update feature X"
git push origin main

📄 License & Credits

Developed by [drey-we(https://github.com/drey-we). TuneCharts is not affiliated with Last.fm or Spotify. Data is provided courtesy of their respective public APIs.
