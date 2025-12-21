# Admin Panel - Video Streaming Platform

A complete, production-ready admin panel for managing a video streaming platform built with React 18, Vite, and TypeScript.

## Features

- 🎯 **Ads Management** - Complete CRUD operations for advertisements (Pre-Roll, Mid-Roll, Banner, Native, Popup, Interstitial)
- 🎬 **Movie Management** - Upload and manage movies with multiple video qualities and subtitles
- 📁 **Category Management** - Organize content with categories, subcategories, and channels
- 🔍 **SEO Management** - Optimize content for search engines with meta tags and sitemap generation
- 🎁 **Referral Management** - Track and manage referral programs
- 📊 **Analytics Dashboard** - View key metrics and performance charts
- 🔐 **Secure Authentication** - JWT-based authentication with protected routes

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **React Router DOM v6** - Routing
- **TanStack React Query** - Data fetching and caching
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling and validation
- **Tailwind CSS** - Styling
- **Headless UI** - Accessible UI components
- **Recharts** - Charts and analytics
- **Axios** - HTTP client

## Project Structure

```
src/
├── api/              # API service files
├── components/       # Reusable components
│   ├── layout/      # Layout components (Sidebar, Topbar, etc.)
│   └── ui/          # UI components (Button, Input, etc.)
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Dashboard page
│   ├── ads/         # Ads management pages
│   ├── movies/      # Movie management pages
│   ├── categories/  # Category management pages
│   ├── seo/         # SEO management pages
│   └── referrals/   # Referral management pages
├── routes/          # Routing configuration
├── store/           # Zustand stores
├── hooks/           # Custom React hooks
└── utils/           # Utility functions and constants
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## API Configuration

The admin panel connects to the backend API at `http://localhost:3000/api/admin`. Make sure your backend server is running and accessible.

Update the API base URL in `src/utils/constants.ts` if needed:

```typescript
export const API_BASE_URL = 'http://localhost:3000/api/admin';
```

## Authentication

The admin panel uses JWT-based authentication. Tokens are stored in localStorage and automatically attached to API requests via Axios interceptors.

## Environment Variables

Create a `.env` file in the root directory if you need to customize the API URL:

```
VITE_API_BASE_URL=http://localhost:3000/api/admin
```

## Features Overview

### Ads Management
- Create, edit, delete ads
- Filter by type and status
- Toggle ad status
- View ad analytics (impressions, clicks, CTR)

### Movie Management
- Upload movies with thumbnails, posters, videos, and subtitles
- Multiple video qualities (480p, 720p, 1080p)
- Multiple subtitle languages
- Toggle trending and featured status
- DMCA takedown functionality
- Country blocking
- Age restrictions

### SEO Management
- Update movie SEO metadata
- Generate sitemap
- View SEO analytics and coverage

### Referral Management
- View referral list
- Track referral statistics
- Update referral earnings

## License

This project is proprietary software.

