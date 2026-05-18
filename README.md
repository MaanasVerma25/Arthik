<p align="center">
  <img src="public/favicon.png" alt="Arthik Logo" width="120" />
</p>

<h1 align="center">Arthik (अर्थीक)</h1>

<p align="center">
  <strong>Earn. Play. Grow.</strong><br/>
  A gamified financial literacy platform for a financially empowered Bharat — powered by AI.
</p>

<p align="center">
  <a href="https://arthik-gilt.vercel.app/"><img src="https://img.shields.io/badge/🚀_Live_Demo-arthik--gilt.vercel.app-blueviolet?style=for-the-badge" alt="Live Demo" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📌 Overview

**Arthik** is a full-stack, India-first financial literacy platform that teaches users about investing, budgeting, and markets through **interactive trading simulators**, **AI-powered financial planning**, and **structured learning content** — all without risking real money.

Every user starts with a **virtual ₹1,00,000** portfolio and can trade across **Stocks**, **Forex**, and **Crypto** using real-time market data.

> 🌐 **Try it live →** [https://arthik-gilt.vercel.app/](https://arthik-gilt.vercel.app/)

---

## ✨ Features

### 📊 Stock Market Simulator
- Trade any global equity/ETF with **real-time Yahoo Finance data**
- Toggle between **Candlestick & Line charts** (ApexCharts)
- Time range filters: 1D · 5D · 15D · 1M · 5M · 1Y
- Live/Mock data indicator — graceful fallback when APIs are down
- Buy/Sell with quantity tracking and P&L analysis

### 🌍 Forex Simulator
- 10 major currency pairs (EUR/USD, GBP/USD, USD/JPY, etc.)
- Live quotes via **Twelve Data API**
- Historical candlestick charts with multiple time ranges

### 🪙 Crypto Simulator
- 9 cryptocurrencies: BTC, ETH, BNB, SOL, ADA, XRP, DOT, DOGE, MATIC
- Real-time data from **Binance public API**
- Live USD → INR conversion

### 🤖 AI Budget & Roadmap Builder
- Powered by **Google Gemini 2.5 Flash**
- Input your age, income, career, and financial goals
- Generates: monthly savings plan, stress meter, portfolio allocation donut chart, wealth growth projection, and a year-by-year roadmap

### 📈 Unified Dashboard
- Cash balance, invested value, total equity, and overall P&L
- Portfolio breakdown by asset class with visual progress bars
- Recent activity feed and quick-action links

### 📰 Live Market News
- Curated financial news feed via Yahoo Finance RSS
- Article thumbnails, descriptions, and direct links

### 🏠 Landing Page
- Animated shader hero background
- Glassmorphism navigation
- Three-pillar showcase: Earn · Play · Grow

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 + shadcn/ui components |
| **Animations** | Framer Motion |
| **Charts** | ApexCharts (candlestick, line) |
| **AI** | Google Gemini 2.5 Flash |
| **Backend / Auth** | Supabase (Auth, Postgres, Realtime, RLS) |
| **State Management** | TanStack React Query |
| **Icons** | Lucide React |
| **HTTP Clients** | Axios + native fetch |
| **Deployment** | Vercel |
| **Testing** | Vitest + Testing Library + Playwright |

---

## 🔌 API Integrations

| API | Purpose | Auth |
|---|---|---|
| Yahoo Finance | Stock quotes + historical data | Via Vite proxy |
| Twelve Data | Forex quotes + time series | API key |
| Binance | Crypto prices, klines, INR rate | Public (no key) |
| Google Gemini | AI budget & roadmap generation | API key (`.env`) |
| rss2json.com | News RSS → JSON | Public |
| Supabase | Auth, database, realtime | URL + anon key |

---

## 📂 Project Structure

```
src/
├── App.tsx                    # Root router
├── main.tsx                   # Entry point
├── index.css                  # Global styles & Tailwind directives
│
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── LoginPage.tsx          # Email/password login
│   ├── SignupPage.tsx         # Registration
│   ├── DashboardPage.tsx      # Portfolio dashboard
│   ├── StockSimulatorPage.tsx # Stock trading simulator
│   ├── ForexSimulatorPage.tsx # Forex trading simulator
│   ├── CryptoPage.tsx         # Crypto trading simulator
│   ├── AiBudgetingPage.tsx    # AI budgeting & roadmap
│   ├── NewsPage.tsx           # Market news feed
│   ├── ProfilePage.tsx        # User profile & settings
│   ├── AboutUsPage.tsx        # About the team
│   └── NotFound.tsx           # 404 page
│
├── components/
│   ├── landing/               # Navbar, PillarsSection, WaitlistSection, Footer
│   ├── layout/                # AppLayout (authenticated shell)
│   ├── ui/                    # shadcn/ui primitives (button, dialog, card, etc.)
│   └── ScrollToTop.tsx
│
├── lib/
│   ├── supabase.ts            # Supabase client init
│   ├── supabaseService.ts     # Profile CRUD, portfolio updates, realtime
│   ├── stockApi.ts            # Yahoo Finance API + mock fallback
│   ├── forexApi.ts            # Twelve Data API
│   ├── cryptoApi.ts           # Binance API
│   ├── newsApi.ts             # Yahoo Finance RSS feed
│   ├── gemini.ts              # Gemini AI integration
│   ├── currencyService.ts     # Currency conversion utilities
│   └── utils.ts               # Shared utilities
│
└── hooks/
    ├── use-mobile.tsx         # Responsive breakpoint hook
    └── use-toast.ts           # Toast notification hook
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** (or bun)

### Installation

```bash
git clone https://github.com/MaanasVerma-test/arthik2.0.git
cd arthik2.0
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url          # optional
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key # optional
```

> 💡 Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
>
> Without Supabase keys, the app runs in **Guest Mode** — full simulator access with ₹1,00,000 virtual balance (no data persistence).

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## 🗄️ Database Schema (Supabase)

The `profiles` table stores all user data:

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Linked to `auth.users` |
| `full_name` | text | Display name |
| `avatar` | text | Profile picture URL |
| `role` | text | User role |
| `city` | text | User location |
| `balance` | numeric | Shared cash balance (default ₹1,00,000) |
| `is_pro` | boolean | Premium user flag |
| `stock_holdings` | JSONB | Stock positions (symbol, qty, avgPrice) |
| `forex_holdings` | JSONB | Forex positions |
| `crypto_holdings` | JSONB | Crypto positions |

---

## 🎯 Design Philosophy

1. **Unified Balance** — All simulators share a single ₹1,00,000 pool, teaching capital allocation across asset classes
2. **Graceful Degradation** — Every API has a mock/fallback engine so the app never breaks
3. **India-First** — INR formatting, NSE/BSE symbols, Indian financial context throughout
4. **AI Honesty** — The Gemini prompt generates realistic financial plans, including telling users when goals are unrealistic
5. **Rate Limit Respect** — 1-minute client-side cache on quotes and charts for free API tiers

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>🌟 Our Mission</strong><br/>
  Making financial education <em>inclusive, accessible, and fun</em>.<br/>
  Every citizen deserves the tools to manage their wealth and understand the economy.
</p>

<p align="center">
  <a href="https://arthik-gilt.vercel.app/">
    <img src="https://img.shields.io/badge/Start_Your_Journey-Arthik-blueviolet?style=for-the-badge" alt="Start Your Journey" />
  </a>
</p>
