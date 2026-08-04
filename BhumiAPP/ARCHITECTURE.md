# 🌾 BhumiCred — Production-Grade Full-Stack Architecture

> **App:** `bhumicred-app` | **Platform:** Expo (React Native) + MERN Backend + Next.js Admin Panel + AI Seva Bot  
> **Version:** 2.0 (Target Architecture) | **Author:** Architecture by Antigravity AI  
> **Status:** Frontend Complete → Backend + Admin Integration Pending

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack Decision Matrix](#2-tech-stack-decision-matrix)
3. [High-Level Architecture Diagram](#3-high-level-architecture-diagram)
4. [Complete Repository Structure](#4-complete-repository-structure)
   - [4a. Mobile App (Expo)](#4a-mobile-app-expo---existing--evolving)
   - [4b. Backend (Node.js + Express + MongoDB)](#4b-backend-nodejs--express--mongodb---new)
   - [4c. Admin Panel (Next.js 15)](#4c-admin-panel-nextjs-15---new)
   - [4d. AI Seva Bot Service](#4d-ai-seva-bot-service---new)
5. [Database Architecture](#5-database-architecture)
6. [API Design & Integration Flow](#6-api-design--integration-flow)
7. [State Management Strategy](#7-state-management-strategy)
8. [Authentication & Authorization Flow](#8-authentication--authorization-flow)
9. [AI Chatbot (Seva Bot) Architecture](#9-ai-chatbot-seva-bot-architecture)
10. [Feature Module Integration Map](#10-feature-module-integration-map)
11. [Migration Plan: Mock → Real API](#11-migration-plan-mock--real-api)
12. [Security Architecture](#12-security-architecture)
13. [DevOps & Deployment Strategy](#13-devops--deployment-strategy)
14. [Environment Configuration](#14-environment-configuration)

---

## 1. System Overview

BhumiCred is an **agri-fintech platform** for Indian farmers. It provides:

| Domain | Features |
|---|---|
| 🔐 Identity & KYC | Mobile OTP login, Aadhaar/PAN verification, farmer profile |
| 🌾 Land Management | Plot registration, land records, geo-tagging |
| 🛡️ Insurance | Policy purchase, claim filing, claim tracking, certificates |
| 🛒 Marketplace | Agri-input packages, cart, checkout, inspection booking |
| 💰 Wallet | Balance, transactions, payment history |
| 📊 Reports | Soil health reports, crop analytics |
| ♻️ Carbon Credits | Project listing, application, carbon certificate tracking |
| 🏛️ Government Schemes | Eligibility check, applications, status tracking |
| 🤖 Seva Bot | AI chatbot for scheme guidance, crop advisory, form help |

**User Roles:**
- `FARMER` — Mobile app end user (Expo)
- `ADMIN` — Internal ops team with full control (Next.js panel)

---

## 2. Tech Stack Decision Matrix

### Why These Choices?

| Layer | Technology | Why |
|---|---|---|
| **Mobile** | Expo SDK 54 + React Native 0.81 | Already implemented; Expo Router v6 for file-based routing |
| **Backend** | Node.js + Express.js | Matches JS/TS skill set; fast API development |
| **Database (Primary)** | MongoDB Atlas | Agri data is schema-flexible; geo-queries for land plots; JSON-native |
| **Database (Cache)** | Redis (Upstash) | Session caching, OTP storage (TTL), rate limiting, real-time notifications queue |
| **Admin Panel** | Next.js 15 + Tailwind CSS | SSR dashboards, server actions, parallel routes for analytics |
| **AI Service** | Python FastAPI + LangChain + OpenAI GPT-4o | Multi-purpose RAG bot; Python ecosystem dominates AI tooling |
| **AI Vector Store** | Pinecone | Stores scheme/crop knowledge embeddings for RAG |
| **File Storage** | AWS S3 / Cloudflare R2 | KYC documents, insurance certificates, land photos |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Cross-platform (Android + iOS) notification delivery |
| **SMS / OTP** | Twilio / MSG91 | Indian mobile OTP delivery |
| **Real-time** | Socket.io | Live booking status, chatbot streaming, admin alerts |
| **Auth** | JWT (Access + Refresh token pair) | Stateless, mobile-friendly; refresh token stored in Redis |
| **Payments** | Razorpay | Indian payment gateway; UPI, Net Banking, Cards |

---

## 3. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                                   │
│                                                                     │
│   ┌──────────────────────┐        ┌───────────────────────────┐    │
│   │   EXPO MOBILE APP    │        │    NEXT.JS ADMIN PANEL    │    │
│   │  (React Native 0.81) │        │     (Next.js 15 + Tailwind)│   │
│   │                      │        │                           │    │
│   │  Expo Router v6      │        │  Server Components + RSC  │    │
│   │  React Query v5      │        │  Server Actions           │    │
│   │  Zustand + Redux     │        │  Admin Auth (NextAuth.js) │    │
│   └─────────┬────────────┘        └──────────────┬────────────┘    │
└─────────────│────────────────────────────────────│─────────────────┘
              │  HTTPS + JWT                        │ HTTPS + Session
              ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY TIER                              │
│                                                                     │
│              ┌─────────────────────────────────┐                   │
│              │     Nginx Reverse Proxy          │                   │
│              │  (Rate Limiting, SSL, CORS)      │                   │
│              └────────┬──────────┬─────────────┘                   │
└───────────────────────│──────────│──────────────────────────────────┘
                        │          │
          /api/v1/*      │          │ /admin/api/*
                        ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE TIER                                   │
│                                                                     │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  │
│  │   EXPRESS.JS REST API       │  │   FASTAPI AI SERVICE        │  │
│  │   Node.js (PM2 Cluster)     │  │   Python 3.12               │  │
│  │                             │  │                             │  │
│  │  ├── Auth Service           │  │  ├── RAG Pipeline           │  │
│  │  ├── Farmer Service         │  │  ├── LangChain Agent        │  │
│  │  ├── Insurance Service      │  │  ├── GPT-4o Integration     │  │
│  │  ├── Marketplace Service    │  │  ├── Crop Advisory Engine   │  │
│  │  ├── Wallet Service         │  │  ├── Scheme Eligibility Bot │  │
│  │  ├── Carbon Service         │  │  └── Conversation Memory   │  │
│  │  ├── Scheme Service         │  └───────────┬─────────────────┘  │
│  │  ├── Notification Service   │              │                     │
│  │  └── Socket.io Server       │              │                     │
│  └──────────────┬──────────────┘              │                     │
└─────────────────│────────────────────────────│─────────────────────┘
                  │                            │
                  ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA TIER                                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  MongoDB     │  │  Redis   │  │ Pinecone │  │  AWS S3 /     │  │
│  │  Atlas       │  │ (Upstash)│  │ (Vector) │  │  Cloudflare R2│  │
│  │              │  │          │  │          │  │               │  │
│  │  Primary DB  │  │  Cache   │  │  RAG     │  │  Files / KYC  │  │
│  │  11 Collections│  │  OTP TTL │  │  Scheme  │  │  Certificates │  │
│  │  Geo-indexes │  │  Sessions│  │  Embeddings│  │  Land Photos  │  │
│  └──────────────┘  └──────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                  │                            │
                  ▼                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES TIER                           │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │ Razorpay │ │ Firebase │ │  Twilio  │ │OpenAI  │ │ Digilocker│  │
│  │ Payments │ │   FCM    │ │  SMS/OTP │ │ GPT-4o │ │ KYC Verify│  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Repository Structure

### Recommended: **Monorepo Structure** using `npm workspaces`

```
BhumiCred/                          ← Root monorepo
├── apps/
│   ├── mobile/                     ← Expo app (existing codebase moves here)
│   ├── admin/                      ← Next.js 15 admin panel (new)
│   └── api/                        ← Express.js backend (new)
├── packages/
│   ├── shared-types/               ← Shared TypeScript interfaces
│   ├── shared-validators/          ← Shared Yup/Zod schemas
│   └── ai-service/                 ← FastAPI Python AI bot (new)
├── .env.example
├── docker-compose.yml
├── package.json                    ← Root workspace config
└── turbo.json                      ← (Optional) Turborepo for caching
```

> **Note:** If you prefer keeping the Expo app at the root (as it is now), use a **polyrepo** pattern instead — three separate Git repositories: `bhumicred-mobile`, `bhumicred-api`, `bhumicred-admin`.

---

### 4a. Mobile App (Expo) — Existing → Evolving

**Current location:** `e:\BhumiAPP\` (root)  
**Target:** `apps/mobile/` in monorepo OR kept as root

```
apps/mobile/
├── app/                             ← Expo Router v6 (file-based routing)
│   ├── _layout.tsx                  ← Root layout: providers, fonts, theme
│   ├── index.tsx                    ← Splash/entry redirect logic
│   ├── onboarding.tsx               ← Multi-step onboarding flow
│   ├── search.tsx                   ← Global search screen
│   │
│   ├── (auth)/                      ← Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx              ← App landing / language selector
│   │   ├── login.tsx                ← Mobile number input
│   │   ├── otp.tsx                  ← OTP verification
│   │   ├── register.tsx             ← New farmer registration
│   │   └── forgot-password.tsx     ← Password/OTP recovery
│   │
│   ├── (tabs)/                      ← Main tab navigator
│   │   ├── _layout.tsx              ← Tab bar config
│   │   ├── index.tsx                ← Home dashboard
│   │   ├── marketplace.tsx          ← Agri marketplace
│   │   ├── bookings.tsx             ← Inspection bookings
│   │   ├── projects.tsx             ← Carbon credit projects
│   │   ├── reports.tsx              ← Soil/crop reports
│   │   ├── track.tsx                ← Order/application tracking
│   │   ├── wallet.tsx               ← Wallet & transactions
│   │   ├── book-action.tsx          ← Quick booking action
│   │   └── profile.tsx              ← Farmer profile tab
│   │
│   ├── insurance/                   ← Insurance module
│   │   ├── index.tsx                ← Insurance home & plans
│   │   ├── register-single.tsx      ← Single farmer insurance registration
│   │   ├── register-family.tsx      ← Family insurance registration
│   │   ├── policy-details.tsx       ← Active policy viewer
│   │   ├── claim.tsx                ← Raise a new claim
│   │   ├── claim-track.tsx          ← Track claim status
│   │   ├── certificate.tsx          ← Download insurance certificate
│   │   └── payment.tsx              ← Insurance payment flow
│   │
│   ├── marketplace/                 ← [REFACTOR] Split from (tabs)/marketplace.tsx
│   │   ├── index.tsx                ← Product listing
│   │   ├── [id].tsx                 ← Product detail page
│   │   └── search.tsx               ← Marketplace search
│   │
│   ├── package/                     ← Agri package module
│   │   ├── index.tsx                ← Package listing
│   │   ├── [id].tsx                 ← Package detail
│   │   └── custom.tsx               ← Custom package builder
│   │
│   ├── checkout/                    ← Cart & checkout flow
│   │   ├── _layout.tsx
│   │   ├── cart.tsx                 ← Cart screen
│   │   ├── address.tsx              ← Delivery address list
│   │   ├── add-address.tsx          ← Add new address
│   │   ├── farmer-details.tsx       ← Confirm farmer info
│   │   ├── inspection-slot-booking.tsx ← Book inspection slot
│   │   ├── payment.tsx              ← Payment gateway screen
│   │   └── success.tsx              ← Order success confirmation
│   │
│   ├── carbon/                      ← Carbon credits module
│   │   ├── apply.tsx                ← Apply for carbon credit
│   │   ├── payment.tsx              ← Carbon payment
│   │   ├── track.tsx                ← Track carbon project
│   │   └── success.tsx              ← Carbon credit success
│   │
│   ├── schemes/                     ← Government schemes module
│   │   └── index.tsx                ← Scheme listing & eligibility
│   │
│   ├── profile/                     ← Profile management module
│   │   ├── _layout.tsx
│   │   ├── info.tsx                 ← Personal info view
│   │   ├── edit.tsx                 ← Edit profile
│   │   ├── family.tsx               ← Family members
│   │   ├── addresses.tsx            ← Saved addresses
│   │   ├── add-land.tsx             ← Add land plot
│   │   ├── contact.tsx              ← Contact/support
│   │   └── payment.tsx              ← Payment history
│   │
│   ├── tracking/
│   │   └── [id].tsx                 ← Dynamic order/application tracker
│   │
│   └── report/
│       └── [id].tsx                 ← Dynamic report detail
│
├── src/                             ← All business logic (non-routing)
│   │
│   ├── api/                         ← [NEW] Centralized API layer
│   │   ├── client.ts                ← Axios instance + interceptors + token refresh
│   │   ├── endpoints.ts             ← All API endpoint constants
│   │   └── hooks/                   ← React Query hooks (replaces mock data)
│   │       ├── useAuth.ts           ← login, verifyOtp, logout mutations
│   │       ├── useFarmer.ts         ← farmer profile queries/mutations
│   │       ├── useInsurance.ts      ← insurance queries/mutations
│   │       ├── useMarketplace.ts    ← product listing, cart queries
│   │       ├── useWallet.ts         ← wallet balance, transactions
│   │       ├── useSchemes.ts        ← scheme listing, eligibility check
│   │       ├── useCarbon.ts         ← carbon project queries
│   │       ├── useBookings.ts       ← booking queries/mutations
│   │       ├── useReports.ts        ← report queries
│   │       ├── usePayments.ts       ← Razorpay integration hooks
│   │       ├── useNotifications.ts  ← FCM notification hooks
│   │       └── useSevaBot.ts        ← AI chatbot API hook (streaming)
│   │
│   ├── store/                       ← State management
│   │   ├── index.ts                 ← Redux store configuration (KEEP)
│   │   ├── authStore.ts             ← Zustand: auth + user session (REFACTOR: remove mock)
│   │   ├── walletStore.ts           ← Zustand: wallet UI state (KEEP)
│   │   ├── insuranceStore.ts        ← Zustand: insurance form state (KEEP)
│   │   ├── carbonStore.ts           ← Zustand: carbon form state (KEEP)
│   │   ├── marketplaceStore.ts      ← Zustand: marketplace filters/UI (KEEP)
│   │   ├── schemeStore.ts           ← Zustand: scheme filter state (KEEP)
│   │   ├── landStore.ts             ← Zustand: land form state (KEEP)
│   │   ├── notificationStore.ts     ← Zustand: notification state (KEEP)
│   │   ├── connectivityStore.ts     ← Zustand: network status (KEEP)
│   │   └── slices/                  ← Redux Toolkit slices
│   │       ├── authSlice.ts         ← Redux: auth flags for deep linking (KEEP)
│   │       ├── cartSlice.ts         ← Redux: cart items (KEEP — shared across tabs)
│   │       ├── bookingSlice.ts      ← Redux: active booking draft (KEEP)
│   │       ├── addressSlice.ts      ← Redux: address list (KEEP)
│   │       └── familySlice.ts       ← Redux: family members (KEEP)
│   │
│   ├── components/                  ← Reusable UI components
│   │   ├── AmbientEcoBackground.tsx ← Skia animated background
│   │   ├── EmptyState.tsx           ← Empty list/error state
│   │   ├── GlassCard.tsx            ← Glassmorphism card
│   │   ├── GlobalSchedulerOverlay.tsx ← Full-screen scheduler UI
│   │   ├── GradientButton.tsx       ← Primary CTA button
│   │   ├── InputBox.tsx             ← Form input component
│   │   ├── LocationPickerModal.tsx  ← Google Maps location picker
│   │   ├── MaterialDatePickerModal.tsx ← Date picker modal
│   │   ├── MaterialTimeSlotModal.tsx← Time slot selector
│   │   ├── PremiumBottomSheet.tsx   ← Bottom sheet component
│   │   ├── PremiumPackageCard.tsx   ← Package card UI
│   │   ├── PremiumScratchModal.tsx  ← Scratch reveal animation
│   │   ├── PremiumTestCard.tsx      ← Test/service card
│   │   ├── SevaBotModal.tsx         ← AI chatbot modal (REFACTOR: connect to API)
│   │   ├── SkeletonLoader.tsx       ← Loading skeleton
│   │   └── SuccessOverlay.tsx       ← Transaction success overlay
│   │
│   ├── theme/
│   │   └── theme.ts                 ← Colors, typography, spacing tokens
│   │
│   ├── locales/                     ← i18n translations
│   │   ├── i18n.ts                  ← i18next configuration
│   │   ├── en/                      ← English translations
│   │   └── hi/                      ← Hindi translations
│   │
│   ├── utils/
│   │   ├── pdfGenerator.ts          ← PDF export utility
│   │   ├── validation.ts            ← Yup validation schemas
│   │   ├── tokenStorage.ts          ← [NEW] Secure token storage (SecureStore)
│   │   ├── errorHandler.ts          ← [NEW] Global error handler
│   │   └── formatters.ts            ← [NEW] Date, currency, number formatters
│   │
│   └── mock/                        ← [DEPRECATE GRADUALLY]
│       ├── mockData.ts              ← Phase out as APIs go live
│       └── reportMockData.ts        ← Phase out as APIs go live
│
├── components/                      ← Expo default components (keep as-is)
│   ├── AutocompleteDropdown.tsx
│   ├── CustomCalendarModal.tsx
│   ├── MapViewProxy.tsx
│   ├── MapViewProxy.web.tsx
│   └── ui/                          ← Expo UI primitives
│       ├── collapsible.tsx
│       ├── icon-symbol.ios.tsx
│       └── icon-symbol.tsx
│
├── assets/                          ← Static assets
│   └── images/
│
├── hooks/                           ← Expo default hooks
├── constants/                       ← App-level constants
├── android/                         ← Android native (Expo managed)
├── app.json                         ← Expo config
├── eas.json                         ← EAS Build config
├── metro.config.js
├── tsconfig.json
└── package.json
```

---

### 4b. Backend (Node.js + Express + MongoDB) — NEW

```
apps/api/
├── src/
│   │
│   ├── app.ts                       ← Express app setup, global middleware
│   ├── server.ts                    ← HTTP + Socket.io server entry
│   │
│   ├── config/
│   │   ├── database.ts              ← MongoDB Atlas connection (Mongoose)
│   │   ├── redis.ts                 ← Redis (Upstash) connection
│   │   ├── firebase.ts              ← Firebase Admin SDK (FCM)
│   │   ├── s3.ts                    ← AWS S3 / Cloudflare R2 client
│   │   ├── razorpay.ts              ← Razorpay client init
│   │   └── env.ts                   ← Env validation with Zod
│   │
│   ├── modules/                     ← Feature-based module structure
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts   ← Route handlers
│   │   │   ├── auth.service.ts      ← Business logic (OTP, JWT)
│   │   │   ├── auth.routes.ts       ← Express router
│   │   │   ├── auth.middleware.ts   ← verifyToken, verifyRole
│   │   │   └── auth.dto.ts          ← Request/Response DTOs (Zod)
│   │   │
│   │   ├── farmer/
│   │   │   ├── farmer.controller.ts
│   │   │   ├── farmer.service.ts    ← Profile CRUD, KYC status update
│   │   │   ├── farmer.routes.ts
│   │   │   ├── farmer.model.ts      ← Mongoose schema
│   │   │   └── farmer.dto.ts
│   │   │
│   │   ├── insurance/
│   │   │   ├── insurance.controller.ts
│   │   │   ├── insurance.service.ts ← Policy creation, claim filing
│   │   │   ├── insurance.routes.ts
│   │   │   ├── insurance.model.ts   ← Policy + Claim schemas
│   │   │   └── insurance.dto.ts
│   │   │
│   │   ├── marketplace/
│   │   │   ├── marketplace.controller.ts
│   │   │   ├── marketplace.service.ts ← Product listing, order management
│   │   │   ├── marketplace.routes.ts
│   │   │   ├── product.model.ts
│   │   │   ├── order.model.ts
│   │   │   └── marketplace.dto.ts
│   │   │
│   │   ├── wallet/
│   │   │   ├── wallet.controller.ts
│   │   │   ├── wallet.service.ts    ← Balance, transactions, ledger
│   │   │   ├── wallet.routes.ts
│   │   │   ├── wallet.model.ts      ← Transaction + Wallet schemas
│   │   │   └── wallet.dto.ts
│   │   │
│   │   ├── schemes/
│   │   │   ├── schemes.controller.ts
│   │   │   ├── schemes.service.ts   ← Eligibility check engine, admin publish
│   │   │   ├── schemes.routes.ts
│   │   │   ├── scheme.model.ts      ← Scheme schema (added by Admin)
│   │   │   └── schemes.dto.ts
│   │   │
│   │   ├── carbon/
│   │   │   ├── carbon.controller.ts
│   │   │   ├── carbon.service.ts    ← Project creation, certificate gen
│   │   │   ├── carbon.routes.ts
│   │   │   ├── carbon.model.ts      ← Carbon project schema
│   │   │   └── carbon.dto.ts
│   │   │
│   │   ├── land/
│   │   │   ├── land.controller.ts
│   │   │   ├── land.service.ts      ← Land record CRUD, geo-validation
│   │   │   ├── land.routes.ts
│   │   │   ├── land.model.ts        ← Land schema (GeoJSON Point)
│   │   │   └── land.dto.ts
│   │   │
│   │   ├── booking/
│   │   │   ├── booking.controller.ts
│   │   │   ├── booking.service.ts   ← Slot management, assignment
│   │   │   ├── booking.routes.ts
│   │   │   ├── booking.model.ts
│   │   │   └── booking.dto.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.controller.ts ← Razorpay order create, webhook verify
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.routes.ts
│   │   │   └── payment.model.ts     ← Payment log schema
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts ← FCM push, in-app notifications
│   │   │   ├── notification.routes.ts
│   │   │   └── notification.model.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.controller.ts  ← Admin-only operations
│   │       ├── admin.service.ts     ← KYC approve/reject, scheme publish
│   │       ├── admin.routes.ts      ← Protected admin routes
│   │       └── admin.dto.ts
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   ← JWT verify, role guard
│   │   │   ├── error.middleware.ts  ← Global error handler
│   │   │   ├── rateLimiter.ts       ← Redis-backed rate limiting
│   │   │   ├── upload.middleware.ts ← Multer + S3 direct upload
│   │   │   └── logger.middleware.ts ← Morgan + Winston logging
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.utils.ts         ← Sign/verify access + refresh tokens
│   │   │   ├── otp.utils.ts         ← OTP generation + Redis TTL storage
│   │   │   ├── sms.utils.ts         ← Twilio/MSG91 SMS sender
│   │   │   ├── pdf.utils.ts         ← Certificate PDF generation (Puppeteer)
│   │   │   ├── pagination.utils.ts  ← Cursor-based pagination helper
│   │   │   └── apiResponse.utils.ts ← Standard API response wrapper
│   │   │
│   │   └── types/
│   │       ├── express.d.ts         ← Extend Express Request with user
│   │       └── index.ts             ← Shared TypeScript types
│   │
│   └── socket/
│       ├── socket.ts                ← Socket.io server init
│       └── handlers/
│           ├── chatHandler.ts       ← Seva Bot real-time streaming
│           ├── bookingHandler.ts    ← Booking status live updates
│           └── notificationHandler.ts ← Real-time notifications
│
├── .env                             ← Environment variables (never commit)
├── .env.example                     ← Template
├── package.json
└── tsconfig.json
```

---

### 4c. Admin Panel (Next.js 15) — NEW

```
apps/admin/
├── app/                             ← Next.js App Router
│   ├── layout.tsx                   ← Root layout (sidebar + top nav)
│   ├── page.tsx                     ← Dashboard home → redirect to /dashboard
│   │
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx             ← Admin login (email + password)
│   │   └── layout.tsx
│   │
│   └── (dashboard)/
│       ├── layout.tsx               ← Dashboard shell (sidebar, topbar)
│       │
│       ├── dashboard/
│       │   └── page.tsx             ← Analytics overview (charts, KPIs)
│       │
│       ├── farmers/
│       │   ├── page.tsx             ← Farmer list + search + filter
│       │   └── [id]/
│       │       └── page.tsx         ← Farmer detail + KYC review
│       │
│       ├── kyc/
│       │   ├── page.tsx             ← Pending KYC queue
│       │   ├── approved/
│       │   │   └── page.tsx
│       │   └── rejected/
│       │       └── page.tsx
│       │
│       ├── land/
│       │   ├── page.tsx             ← All land records with map view
│       │   └── [id]/
│       │       └── page.tsx         ← Land detail + verification
│       │
│       ├── insurance/
│       │   ├── page.tsx             ← All policies
│       │   ├── claims/
│       │   │   └── page.tsx         ← Claims management queue
│       │   └── [id]/
│       │       └── page.tsx         ← Policy/claim detail + action
│       │
│       ├── schemes/
│       │   ├── page.tsx             ← Government scheme list
│       │   ├── new/
│       │   │   └── page.tsx         ← Create/publish new scheme
│       │   └── [id]/
│       │       ├── page.tsx         ← Scheme detail
│       │       └── edit/
│       │           └── page.tsx     ← Edit scheme
│       │
│       ├── marketplace/
│       │   ├── page.tsx             ← Orders overview
│       │   ├── products/
│       │   │   ├── page.tsx         ← Product management
│       │   │   └── new/
│       │   │       └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx         ← Order detail + status update
│       │
│       ├── wallet/
│       │   └── page.tsx             ← Transaction ledger & wallet overview
│       │
│       ├── bookings/
│       │   ├── page.tsx             ← All bookings + slot calendar
│       │   └── [id]/
│       │       └── page.tsx         ← Booking detail + assign inspector
│       │
│       ├── carbon/
│       │   ├── page.tsx             ← Carbon project management
│       │   └── [id]/
│       │       └── page.tsx         ← Project detail + certificate issue
│       │
│       ├── notifications/
│       │   └── page.tsx             ← Send push notification campaigns
│       │
│       └── seva-bot/
│           ├── page.tsx             ← Chatbot conversation analytics
│           └── knowledge-base/
│               └── page.tsx         ← Manage RAG knowledge base (scheme docs)
│
├── components/
│   ├── ui/                          ← shadcn/ui components
│   ├── charts/                      ← Recharts dashboard charts
│   ├── tables/                      ← Data table with sorting/filtering
│   ├── forms/                       ← Admin forms (React Hook Form + Zod)
│   ├── modals/                      ← Confirmation dialogs, detail modals
│   └── layout/
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       └── Breadcrumb.tsx
│
├── lib/
│   ├── api.ts                       ← Admin API client (fetch with credentials)
│   ├── auth.ts                      ← NextAuth.js admin session
│   └── utils.ts                     ← cn() helper, formatters
│
├── middleware.ts                    ← Protect all /dashboard/* routes
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

### 4d. AI Seva Bot Service — NEW

```
packages/ai-service/
├── main.py                          ← FastAPI app entry point
├── requirements.txt
│
├── app/
│   ├── config.py                    ← Settings (OpenAI key, Pinecone, etc.)
│   │
│   ├── api/
│   │   └── v1/
│   │       └── chat.py              ← POST /chat + GET /stream endpoint
│   │
│   ├── agents/
│   │   ├── seva_agent.py            ← Main LangChain ReAct Agent
│   │   ├── tools/
│   │   │   ├── scheme_tool.py       ← Tool: search government schemes
│   │   │   ├── weather_tool.py      ← Tool: fetch weather by location
│   │   │   ├── crop_advisory_tool.py ← Tool: crop recommendation engine
│   │   │   ├── eligibility_tool.py  ← Tool: scheme eligibility checker
│   │   │   └── form_assist_tool.py  ← Tool: guide farmer through form filling
│   │   └── memory.py                ← Conversation memory (Redis-backed)
│   │
│   ├── rag/
│   │   ├── pipeline.py              ← RAG: retrieve → augment → generate
│   │   ├── ingestion.py             ← Script: ingest scheme PDFs → Pinecone
│   │   └── retriever.py             ← Pinecone vector retrieval
│   │
│   └── models/
│       ├── chat.py                  ← Pydantic models for request/response
│       └── message.py               ← Message model with language detection
│
└── scripts/
    └── ingest_schemes.py            ← One-time script: load scheme data into Pinecone
```

---

## 5. Database Architecture

### MongoDB Collections (11 Total)

```
MongoDB Atlas: bhumicred-db
│
├── farmers                          ← Core user collection
│   ├── _id, mobile (unique), email
│   ├── personalInfo: { fullName, dob, fatherName }
│   ├── address: { state, district, village, gramPanchayat, vikashKhand }
│   ├── kyc: { aadhaarNumber, panNumber, aadhaarProofUrl, panProofUrl }
│   ├── verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected'
│   ├── fcmTokens: [string]          ← Array of FCM tokens (multi-device)
│   ├── familyMembers: [{ name, relation, dob, aadhaar }]
│   ├── createdAt, updatedAt
│   └── INDEXES: mobile (unique), verificationStatus
│
├── lands                            ← Farmer land records
│   ├── _id, farmerId (ref: farmers)
│   ├── plotNumber, area, unit: 'acres' | 'hectares'
│   ├── location: { type: 'Point', coordinates: [lng, lat] }
│   ├── address: { state, district, village }
│   ├── soilType, cropType, irrigationType
│   ├── ownershipProofUrl
│   └── INDEXES: farmerId, location (2dsphere for geo-queries)
│
├── insurance_policies               ← Insurance data
│   ├── _id, farmerId, policyNumber (unique)
│   ├── type: 'single' | 'family'
│   ├── plan: { name, premium, coverage, duration }
│   ├── status: 'active' | 'expired' | 'claimed' | 'cancelled'
│   ├── startDate, endDate
│   ├── paymentId (ref: payments)
│   └── certificateUrl
│
├── insurance_claims                 ← Claim tracking
│   ├── _id, policyId, farmerId
│   ├── claimType, description, evidenceUrls: [string]
│   ├── status: 'filed' | 'under_review' | 'approved' | 'rejected' | 'settled'
│   ├── claimAmount, settledAmount
│   └── timeline: [{ status, timestamp, note }]
│
├── products                         ← Marketplace products (managed by Admin)
│   ├── _id, name, category, description
│   ├── price, discountPrice
│   ├── images: [string], stock
│   ├── specifications: {}
│   └── isActive
│
├── orders                           ← Marketplace orders
│   ├── _id, farmerId, orderNumber
│   ├── items: [{ productId, quantity, price }]
│   ├── totalAmount, status
│   ├── shippingAddress: {}
│   ├── paymentId
│   └── timeline: [{ status, timestamp }]
│
├── bookings                         ← Inspection slot bookings
│   ├── _id, farmerId, orderId
│   ├── slot: { date, timeRange, location }
│   ├── status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
│   └── assignedInspectorId
│
├── wallets                          ← One wallet per farmer
│   ├── _id, farmerId (unique)
│   ├── balance (Number)
│   └── INDEXES: farmerId (unique)
│
├── transactions                     ← Financial ledger
│   ├── _id, farmerId, walletId
│   ├── type: 'credit' | 'debit'
│   ├── amount, currency: 'INR'
│   ├── category: 'insurance' | 'marketplace' | 'carbon' | 'refund' | 'topup'
│   ├── referenceId (orderId / policyId / etc.)
│   ├── paymentGatewayId (Razorpay)
│   └── status: 'pending' | 'success' | 'failed'
│
├── schemes                          ← Government schemes (added by Admin)
│   ├── _id, title, category
│   ├── description, eligibilityCriteria: {}
│   ├── benefits: [string], applicationProcess
│   ├── documents: [string], deadline
│   ├── isPublished, publishedAt
│   └── INDEXES: category, isPublished
│
├── carbon_projects                  ← Carbon credit projects
│   ├── _id, farmerId, projectName
│   ├── landId, cropType, area
│   ├── status: 'applied' | 'verified' | 'credits_issued' | 'rejected'
│   ├── creditsEarned, certificateUrl
│   └── paymentId
│
└── notifications                    ← In-app notification log
    ├── _id, farmerId
    ├── title, body, type
    ├── isRead: boolean
    ├── data: {}                     ← Deep link data
    └── createdAt
```

### Redis Key Patterns

```
otp:{mobile}                     → OTP string (TTL: 10 minutes)
session:{userId}                 → JWT refresh token (TTL: 30 days)
rate_limit:{ip}:{endpoint}       → Request count (TTL: 1 minute)
chatHistory:{userId}:{sessionId} → Conversation array (TTL: 24 hours)
fcm_queue:{userId}               → Pending notifications (TTL: 7 days)
```

---

## 6. API Design & Integration Flow

### API Standard

All responses follow this envelope:

```typescript
// Success
{ "success": true, "data": <payload>, "message": "..." }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }

// Paginated
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 150, "hasNext": true } }
```

### Base URL Structure

```
Production:  https://api.bhumicred.in/api/v1
Staging:     https://staging-api.bhumicred.in/api/v1
Admin API:   https://api.bhumicred.in/admin/api
AI Bot:      https://ai.bhumicred.in/api/v1
```

### Core API Endpoints

```
AUTH MODULE
POST   /api/v1/auth/send-otp              ← Send OTP to mobile
POST   /api/v1/auth/verify-otp            ← Verify OTP + issue tokens
POST   /api/v1/auth/register              ← New farmer registration
POST   /api/v1/auth/refresh               ← Refresh access token
POST   /api/v1/auth/logout                ← Invalidate refresh token

FARMER MODULE (Protected)
GET    /api/v1/farmer/profile             ← Get own profile
PATCH  /api/v1/farmer/profile             ← Update profile
POST   /api/v1/farmer/kyc                 ← Submit KYC documents
GET    /api/v1/farmer/kyc/status          ← Check KYC status
GET    /api/v1/farmer/family              ← Family members list
POST   /api/v1/farmer/family              ← Add family member

LAND MODULE (Protected)
GET    /api/v1/land                       ← All lands for farmer
POST   /api/v1/land                       ← Add new land plot
GET    /api/v1/land/:id                   ← Land detail
PATCH  /api/v1/land/:id                   ← Update land
DELETE /api/v1/land/:id                   ← Remove land

INSURANCE MODULE (Protected)
GET    /api/v1/insurance/plans            ← Available plans
POST   /api/v1/insurance/policies         ← Purchase policy
GET    /api/v1/insurance/policies         ← My policies
GET    /api/v1/insurance/policies/:id     ← Policy detail
POST   /api/v1/insurance/claims           ← File a claim
GET    /api/v1/insurance/claims/:id       ← Track claim

MARKETPLACE MODULE (Protected)
GET    /api/v1/marketplace/products       ← Product listing (paginated)
GET    /api/v1/marketplace/products/:id   ← Product detail
POST   /api/v1/marketplace/orders         ← Place order
GET    /api/v1/marketplace/orders         ← My orders
GET    /api/v1/marketplace/orders/:id     ← Order detail

WALLET MODULE (Protected)
GET    /api/v1/wallet                     ← Balance + summary
GET    /api/v1/wallet/transactions        ← Transaction history (paginated)

PAYMENTS MODULE (Protected)
POST   /api/v1/payments/create-order      ← Create Razorpay order
POST   /api/v1/payments/verify            ← Verify payment signature
POST   /api/v1/payments/webhook           ← Razorpay webhook (HMAC verified)

SCHEMES MODULE (Public + Protected for apply)
GET    /api/v1/schemes                    ← All published schemes
GET    /api/v1/schemes/:id                ← Scheme detail
POST   /api/v1/schemes/:id/check-eligibility ← AI-powered eligibility check

CARBON MODULE (Protected)
GET    /api/v1/carbon/projects            ← Carbon project listings
POST   /api/v1/carbon/apply               ← Apply for carbon credits
GET    /api/v1/carbon/my-projects         ← My carbon projects

BOOKINGS MODULE (Protected)
GET    /api/v1/bookings/slots             ← Available slots (date-based)
POST   /api/v1/bookings                   ← Book a slot
GET    /api/v1/bookings                   ← My bookings

NOTIFICATIONS (Protected)
GET    /api/v1/notifications              ← In-app notifications
PATCH  /api/v1/notifications/:id/read     ← Mark as read
POST   /api/v1/notifications/register-device ← Register FCM token

SEVA BOT (Protected, separate AI service)
POST   /api/v1/chat/message               ← Send message, get response
GET    /api/v1/chat/stream                ← SSE streaming response
GET    /api/v1/chat/history               ← Conversation history
DELETE /api/v1/chat/history               ← Clear conversation

ADMIN API (Admin JWT only)
GET    /admin/api/farmers                 ← All farmers + filters
GET    /admin/api/farmers/:id/kyc         ← KYC documents
PATCH  /admin/api/farmers/:id/kyc         ← Approve/reject KYC
GET    /admin/api/orders                  ← All marketplace orders
PATCH  /admin/api/orders/:id/status       ← Update order status
GET    /admin/api/bookings                ← All bookings
PATCH  /admin/api/bookings/:id/assign     ← Assign inspector
POST   /admin/api/schemes                 ← Create new scheme
PATCH  /admin/api/schemes/:id             ← Update scheme
PATCH  /admin/api/schemes/:id/publish     ← Toggle publish
POST   /admin/api/notifications/push      ← Send bulk FCM push
GET    /admin/api/analytics/overview      ← Dashboard KPIs
GET    /admin/api/chat-analytics          ← Seva Bot usage stats
```

---

## 7. State Management Strategy

### The Three-Layer Rule (Keep All Three)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: React Query (TanStack Query v5)                       │
│  Purpose: Server state — API data with caching + sync           │
│  Use for: ALL data fetched from the API                         │
│  Example: farmer profile, product list, wallet balance          │
│  Files: src/api/hooks/*.ts                                      │
└─────────────────────────────────────────────────────────────────┘
                           ↕ feeds into
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Zustand                                               │
│  Purpose: Client/UI state — persisted or ephemeral local state  │
│  Use for: Auth session, form progress, app-wide UI flags        │
│  Example: authStore (token), insuranceStore (form step),        │
│           walletStore (filter), notificationStore (badge count) │
│  Files: src/store/*Store.ts                                     │
└─────────────────────────────────────────────────────────────────┘
                           ↕ feeds into
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Redux Toolkit                                         │
│  Purpose: Complex shared state — cross-tab, cross-module        │
│  Use for: Cart (shared Home + Marketplace + Checkout),          │
│           Booking draft, Address list, Family members           │
│  Files: src/store/slices/*.ts + src/store/index.ts             │
└─────────────────────────────────────────────────────────────────┘
```

### Decision Rule (when to use what)

| Question | Answer | Use |
|---|---|---|
| "Is this data from an API?" | Yes | React Query |
| "Does this reset on logout/app restart?" | Yes | Zustand (no persist) |
| "Does this persist across sessions?" | Yes | Zustand + persist middleware |
| "Is this shared across 2+ distant screens?" | Yes | Redux Toolkit |
| "Is this just this screen's local state?" | Yes | `useState` / `useReducer` |

---

## 8. Authentication & Authorization Flow

### Token Strategy

```
ACCESS TOKEN:  JWT (15 min expiry) → stored in Zustand (in-memory)
REFRESH TOKEN: JWT (30 day expiry) → stored in Redis + AsyncStorage (encrypted via expo-secure-store)
```

### Auth Flow

```
1. SEND OTP
   Farmer → POST /auth/send-otp { mobile }
   Server → Generate 6-digit OTP → Store in Redis (key: otp:{mobile}, TTL: 10min)
          → Send SMS via Twilio/MSG91

2. VERIFY OTP
   Farmer → POST /auth/verify-otp { mobile, otp }
   Server → Check Redis otp:{mobile} → Match?
          → YES: Check if farmer exists in DB
              → EXISTS: Issue accessToken + refreshToken → Return farmer profile
              → NEW: Return { isNewUser: true } → App routes to onboarding
          → NO: Return 401 error

3. ONBOARDING (New Farmers)
   Farmer → Completes multi-step form (onboarding.tsx)
          → POST /auth/register { all profile data + KYC files }
          → Server creates farmer doc with verificationStatus: 'pending'
          → Issues accessToken + refreshToken
          → Admin is notified for KYC review

4. TOKEN REFRESH (Auto, transparent)
   API Client Interceptor (src/api/client.ts):
   → On 401 response: read refreshToken from SecureStore
   → POST /auth/refresh → get new accessToken
   → Retry original request with new token
   → On refresh fail: logout() → navigate to (auth)/login

5. ADMIN AUTH (Separate)
   Admin → POST /admin/auth/login { email, password }
   Server → Bcrypt compare → Issue admin JWT (role: 'ADMIN')
          → Admin panel uses NextAuth.js session
```

### Route Protection (Mobile)

```typescript
// app/_layout.tsx — Root Layout
// Pattern: Check authStore → redirect based on state

const { isAuthenticated, user } = useAuthStore();

if (!isAuthenticated) → redirect to (auth)/welcome
if (isAuthenticated && user?.verificationStatus === 'pending') → redirect to /onboarding (step 4: waiting)
if (isAuthenticated && user?.verificationStatus === 'approved') → allow (tabs)/
```

---

## 9. AI Chatbot (Seva Bot) Architecture

### Multi-Purpose Design

The Seva Bot (`SevaBotModal.tsx`) serves three use cases using a **single LangChain ReAct Agent** with specialized tools:

```
Farmer Message
      │
      ▼
Language Detection (Hindi / English)
      │
      ▼
LangChain ReAct Agent (GPT-4o)
      │
      ├── TOOL: scheme_tool
      │   → Query Pinecone for relevant scheme docs
      │   → Return eligibility criteria + application steps
      │
      ├── TOOL: weather_tool
      │   → Fetch weather by farmer's land location (GPS)
      │   → Return crop-specific weather advisory
      │
      ├── TOOL: crop_advisory_tool
      │   → Based on soil type + crop type + season → recommendations
      │
      ├── TOOL: eligibility_tool
      │   → Check farmer profile against scheme criteria
      │   → Return "You are/aren't eligible because..."
      │
      └── TOOL: form_assist_tool
          → Guide farmer step-by-step through government form filling
          → Context-aware: knows which form they're on
```

### Integration Flow

```
Mobile App (SevaBotModal.tsx)
      │
      │ POST /api/v1/chat/message
      │ { message: string, language: 'en'|'hi', sessionId: string }
      │
      ▼
Express Backend (chatHandler.ts)
      │ Forward to AI Service
      │
      ▼
FastAPI AI Service (seva_agent.py)
      │ 1. Load conversation memory from Redis
      │ 2. Run LangChain Agent
      │ 3. Stream response via SSE
      │
      ▼
Express Backend (SSE proxy → Socket.io)
      │
      ▼
Mobile App (useSevaBot.ts)
      → Stream tokens to SevaBotModal.tsx
      → Display real-time typing effect
```

### Mobile Implementation (`SevaBotModal.tsx` Refactor)

```typescript
// src/api/hooks/useSevaBot.ts
export function useSevaBot() {
  const mutation = useMutation({
    mutationFn: (message: string) => apiClient.post('/chat/message', {
      message,
      language: currentLanguage,    // from i18n store
      sessionId: currentSessionId,  // from chatStore
    }),
    onSuccess: (data) => {
      // Append AI response to local chat state
    }
  });

  return { sendMessage: mutation.mutate, isLoading: mutation.isPending };
}
```

---

## 10. Feature Module Integration Map

### How Each Screen Connects to the Backend

| Screen | File | Current State | Target API | Store |
|---|---|---|---|---|
| Home Dashboard | `(tabs)/index.tsx` | Mock data | `GET /farmer/profile` + `GET /wallet` + `GET /notifications` | React Query |
| Marketplace | `(tabs)/marketplace.tsx` | Mock data | `GET /marketplace/products` | React Query + Redux (cart) |
| Bookings | `(tabs)/bookings.tsx` | Mock data | `GET /bookings` | React Query |
| Projects (Carbon) | `(tabs)/projects.tsx` | Mock data | `GET /carbon/my-projects` | React Query |
| Reports | `(tabs)/reports.tsx` | Mock data | `GET /reports` | React Query |
| Wallet | `(tabs)/wallet.tsx` | Mock data | `GET /wallet` + `GET /wallet/transactions` | React Query |
| Profile | `(tabs)/profile.tsx` | Mock data | `GET /farmer/profile` | React Query + Zustand |
| Login | `(auth)/login.tsx` | Mock (hardcoded mobiles) | `POST /auth/send-otp` | Zustand (authStore) |
| OTP | `(auth)/otp.tsx` | Mock (any OTP) | `POST /auth/verify-otp` | Zustand (authStore) |
| Onboarding | `onboarding.tsx` | Mock | `POST /auth/register` + `POST /farmer/kyc` | Zustand (authStore) |
| Insurance Home | `insurance/index.tsx` | Mock | `GET /insurance/plans` + `GET /insurance/policies` | React Query + Zustand |
| Insurance Register | `insurance/register-single.tsx` | Mock | `POST /insurance/policies` | Zustand (insuranceStore) |
| Insurance Claim | `insurance/claim.tsx` | Mock | `POST /insurance/claims` | Zustand |
| Insurance Payment | `insurance/payment.tsx` | Mock | `POST /payments/create-order` → Razorpay SDK | React Query |
| Schemes | `schemes/index.tsx` | Mock | `GET /schemes` | React Query + Zustand (schemeStore) |
| Cart | `checkout/cart.tsx` | Redux | `GET /marketplace/products` | Redux (cartSlice) |
| Checkout Payment | `checkout/payment.tsx` | Mock | `POST /payments/create-order` → Razorpay | React Query |
| Add Land | `profile/add-land.tsx` | Mock | `POST /land` | Zustand (landStore) |
| Carbon Apply | `carbon/apply.tsx` | Mock | `POST /carbon/apply` | Zustand (carbonStore) |
| Seva Bot | `src/components/SevaBotModal.tsx` | Static UI | `POST /chat/message` (streaming) | Local state |

---

## 11. Migration Plan: Mock → Real API

### Phase 1 — Backend Foundation (Week 1–2)
- [ ] Setup Express + MongoDB + Redis connection
- [ ] Implement `auth` module: OTP send/verify, JWT issue
- [ ] Implement `farmer` module: profile CRUD
- [ ] Replace `authStore.ts` mock login with real API calls
- [ ] Add `src/api/client.ts` Axios instance with interceptors
- [ ] Implement token refresh interceptor
- [ ] Add `expo-secure-store` for secure token storage

### Phase 2 — Core Features (Week 3–4)
- [ ] Implement `insurance` module (policies + claims)
- [ ] Implement `marketplace` module (products + orders)
- [ ] Implement `wallet` + `transaction` modules
- [ ] Integrate Razorpay payment gateway
- [ ] Replace all mock data in marketplace/insurance screens

### Phase 3 — Advanced Features (Week 5–6)
- [ ] Implement `schemes` module (Admin-published)
- [ ] Implement `carbon` module
- [ ] Implement `land` module with geo-validation
- [ ] Implement `booking` module with slot calendar
- [ ] Add Firebase FCM push notifications
- [ ] Implement `notification` module

### Phase 4 — Admin Panel (Week 7–8)
- [ ] Setup Next.js 15 admin project
- [ ] Build KYC review workflow (approve/reject)
- [ ] Build scheme management (create/publish/edit)
- [ ] Build order + booking management dashboards
- [ ] Build analytics dashboard (charts + KPIs)
- [ ] Build notification campaign sender

### Phase 5 — AI Integration (Week 9–10)
- [ ] Setup FastAPI AI service
- [ ] Implement Pinecone RAG pipeline
- [ ] Ingest all government scheme documents
- [ ] Build LangChain agent with 5 tools
- [ ] Connect `SevaBotModal.tsx` to streaming AI API
- [ ] Add conversation history + memory

### Phase 6 — Production Hardening (Week 11–12)
- [ ] Security audit (rate limiting, input validation, HMAC webhook)
- [ ] Performance testing (load test with k6)
- [ ] EAS Build for Android + iOS
- [ ] Setup CI/CD (GitHub Actions → EAS + Vercel + Render)
- [ ] Setup monitoring (Sentry + Datadog/Grafana)

---

## 12. Security Architecture

### Mobile App Security

```
Token Storage:     expo-secure-store (iOS Keychain / Android Keystore)
Network:           Certificate pinning (expo-modules)
Sensitive Data:    Never log user PII
Deep Links:        Verified intent filters (bhumicredapp://)
```

### API Security

```
Auth:              JWT (HS256) with 15-min access + 30-day refresh
OTP:               6-digit, Redis TTL 10 min, max 3 attempts per IP
Rate Limiting:     Redis-backed: 100 req/min per IP, 5 OTP req/hr per mobile
Input Validation:  Zod on all request bodies (controller level)
File Upload:       Type whitelist (jpg, png, pdf), 5MB limit, virus scan hook
Webhooks:          Razorpay HMAC SHA256 signature verification
CORS:              Whitelist only mobile app scheme + admin domain
Headers:           Helmet.js (CSP, HSTS, X-Frame-Options)
```

### Admin Panel Security

```
Auth:              NextAuth.js with credential provider → DB lookup
Session:           Signed, httpOnly cookie (no localStorage)
Route Protection:  Next.js middleware for all /dashboard/* routes
Password:          Bcrypt with cost factor 12
2FA:               TOTP (Google Authenticator) — recommended for production
```

### KYC Document Security

```
Storage:           AWS S3 (private bucket, no public ACL)
Access:            Presigned URLs (15-min TTL) generated server-side
Encryption:        S3 SSE-S3 (server-side encryption at rest)
Access Logging:    S3 access logs + CloudTrail audit
```

---

## 13. DevOps & Deployment Strategy

### Infrastructure

```
Mobile:        EAS Build (Expo Application Services)
               → Play Store (Android) + App Store (iOS)

Backend API:   Render.com / Railway / AWS EC2
               → PM2 cluster mode (Node.js multi-core)
               → Nginx reverse proxy + SSL (Let's Encrypt)

Admin Panel:   Vercel (Next.js native hosting)
               → Automatic preview deployments on PR

AI Service:    Render.com (Python container)
               → Separate dyno from Node.js backend

Database:      MongoDB Atlas (M10+ for production)
               → Automated backups + point-in-time recovery

Cache:         Upstash Redis (serverless, pay-per-request)

Storage:       AWS S3 (or Cloudflare R2 for cheaper egress)

CDN:           Cloudflare (in front of API + assets)
```

### CI/CD Pipeline

```
GitHub Actions:
  On PR:
    → Run ESLint + TypeScript check
    → Run unit tests (Jest)
    → Deploy to staging (Render preview)
    → EAS Update for mobile (OTA update)

  On merge to main:
    → Deploy backend to production (Render)
    → Deploy admin to Vercel (auto)
    → Trigger EAS Build for mobile release candidate

  On tag (v*.*.*):
    → Submit to Play Store / App Store via EAS Submit
```

### Monitoring

```
Error Tracking:    Sentry (mobile + backend + admin)
APM:               Datadog / New Relic (API response times, DB queries)
Uptime:            UptimeRobot / Better Uptime
Logs:              Winston → Logtail / Papertrail
DB Monitoring:     MongoDB Atlas Performance Advisor
AI Monitoring:     LangSmith (LangChain observability)
```

---

## 14. Environment Configuration

### Mobile App (`apps/mobile/.env`)

```bash
# API
EXPO_PUBLIC_API_URL=https://api.bhumicred.in/api/v1
EXPO_PUBLIC_AI_API_URL=https://ai.bhumicred.in/api/v1

# Payments
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...

# Firebase
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bhumicred-app
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxx:android:xxx
```

### Backend API (`apps/api/.env`)

```bash
# Server
NODE_ENV=production
PORT=8000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bhumicred-db
REDIS_URL=redis://default:password@upstash-host:6379

# Auth
JWT_ACCESS_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# Payments
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxx

# Firebase (FCM)
FIREBASE_SERVICE_ACCOUNT_JSON='{ "type": "service_account", ... }'

# Storage
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxx
AWS_S3_BUCKET=bhumicred-kyc-docs
AWS_REGION=ap-south-1

# AI Service
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=<internal-api-key>
```

### AI Service (`packages/ai-service/.env`)

```bash
# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxx
OPENAI_MODEL=gpt-4o

# Pinecone
PINECONE_API_KEY=xxxxxxxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=bhumicred-schemes

# Redis (conversation memory)
REDIS_URL=redis://default:password@upstash-host:6379

# Internal auth
INTERNAL_API_KEY=<same-as-backend-AI_SERVICE_API_KEY>
```

### Admin Panel (`apps/admin/.env`)

```bash
# API
NEXT_PUBLIC_API_URL=https://api.bhumicred.in

# NextAuth
NEXTAUTH_URL=https://admin.bhumicred.in
NEXTAUTH_SECRET=<64-char-random>
ADMIN_DB_URI=mongodb+srv://...  # Can share Atlas cluster, different collection
```

---

## Summary

| Layer | Technology | Status |
|---|---|---|
| 📱 Mobile App | Expo 54 + React Native 0.81 | ✅ Frontend Complete |
| 🔄 State Management | React Query + Zustand + Redux | ✅ Implemented (needs API wiring) |
| 🌐 REST API | Node.js + Express.js + MongoDB | 🔲 To Build |
| 🗄️ Database | MongoDB Atlas + Redis (Upstash) | 🔲 To Setup |
| 🖥️ Admin Panel | Next.js 15 + Tailwind + shadcn/ui | 🔲 To Build |
| 🤖 AI Seva Bot | FastAPI + LangChain + GPT-4o + Pinecone | 🔲 To Build |
| 💳 Payments | Razorpay | 🔲 To Integrate |
| 🔔 Push Notifications | Firebase FCM | 🔲 To Integrate |
| 📦 File Storage | AWS S3 / Cloudflare R2 | 🔲 To Setup |
| 🚀 Deployment | EAS + Vercel + Render | 🔲 To Configure |

> **Recommended starting point:** Phase 1 — Build the Auth module first. Once OTP login and JWT are live, replace `authStore.ts` mock data with real API calls. This unlocks real end-to-end testing for all subsequent features.
