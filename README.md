# 🏡 HALYCON — Full-Stack Vacation Rentals & Stays Marketplace

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-v5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-v1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Passport.js](https://img.shields.io/badge/Passport.js-Authentication-34E27A?style=for-the-badge&logo=passport&logoColor=white)](http://www.passportjs.org/)

> **Halycon** is a modern, production-grade vacation rental marketplace inspired by Airbnb. Built with Express.js, MongoDB, Leaflet.js, and server-rendered EJS templates, Halycon offers travelers seamless stay discovery with interactive geocoded maps, instant reservation booking, dynamic wishlist management, and verified host listing controls.

---

## 📑 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📐 System Architecture](#-system-architecture)
- [📁 Folder Structure](#-folder-structure)
- [🚀 Quick Start & Installation](#-quick-start--installation)
- [📡 RESTful API Endpoints](#-restful-api-endpoints)
- [🗄️ Database Schemas](#️-database-schemas)
- [🔒 Security & Best Practices](#-security--best-practices)
- [📚 Technical Deep Dive & Interview Guide](#-technical-deep-dive--interview-guide)
- [📄 License](#-license)

---

## ✨ Key Features

### 🗺️ Zero-Cost Interactive Mapping Engine
- **Leaflet.js + OpenStreetMap (OSM):** Fully functional interactive maps without paid Google Maps or Mapbox API keys.
- **3-Tier Geocoding Fallback:**
  1. Stored GeoJSON Point coordinates `[longitude, latitude]`.
  2. In-memory coordinate dictionary for 50+ world travel hubs.
  3. Dynamic asynchronous geocoding via OpenStreetMap Nominatim.
- **Airbnb-Style Privacy Radius:** Renders a 750-meter semi-transparent circle around the listing neighborhood to protect host privacy before booking.

### 💖 Reactive AJAX Stays Cart / Wishlist
- **Optimistic UI:** One-click heart toggle on cards and detail pages without full page reloads.
- **Live Navbar Badge & Mini-Cart Drawer:** Cart count updates instantly across the navbar and quick-access dropdown drawer.
- **Orphan Reference Cleanup:** When a listing is deleted, MongoDB `$pull` purges dangling IDs from all user cart arrays.

### 📅 Instant Booking & Reservation System
- **Dynamic Night & Price Calculation:** Automatic date math computing nights between check-in and check-out.
- **Formatted Confirmation Codes:** Generates formatted reservation codes (e.g. `HL-1234`).
- **Standardized Phone Formatting:** Normalizes phone numbers into standard Indian telephone format (`+91 XXXXXXXXXX`).

### 🔍 Real-Time Search & Location Filtering
- Regex-powered full-text search across **title**, **city/location**, and **country**.
- Filter stays directly from the sticky header search bar.

### ⭐ Community Reviews & Ratings
- 5-star rating inputs with timestamped user comments.
- **Optimized Populated Queries:** MongoDB `.populate("reviews")` fetches all nested review documents efficiently.
- **Cascading Deletion:** Deleting a property automatically removes all associated review sub-documents.

### 🔐 Robust Authentication & Session Handling
- **Passport.js & PBKDF2:** Salting and hashing with 128-byte cryptographic keys.
- **Smart Post-Login Redirection (`isLoggedIn` & `saveRedirectUrl`):** Redirects users back to the exact page or action they attempted before signing in.
- **Dual-Layer Validation:** Bootstrap client-side `.needs-validation` combined with strict server-side **Joi** schema validation.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v20+) | Event-driven, non-blocking asynchronous JavaScript runtime |
| **Framework** | [Express.js](https://expressjs.com/) (v5.2.1) | Next-generation web framework with modern promise handling |
| **Database** | [MongoDB](https://www.mongodb.com/) (v7.0+) | Document-oriented NoSQL database |
| **ODM** | [Mongoose](https://mongoosejs.com/) (v9.10.2) | Schema definition, model validation, and population hooks |
| **Auth** | [Passport.js](http://www.passportjs.org/) + `passport-local-mongoose` | PBKDF2 hashing, local strategy, and session serialization |
| **Templating** | [EJS](https://ejs.co/) + [ejs-mate](https://github.com/pallot/ejs-mate) | Layout inheritance, partials, and dynamic server-rendered views |
| **Validation**| [Joi](https://joi.dev/) (v18.2.9) | Schema description language for server-side payload validation |
| **Maps** | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap | Interactive client-side map rendering and Nominatim geocoding |
| **Styling** | [Bootstrap 5.3](https://getbootstrap.com/) + FontAwesome 6 | Responsive grid, custom CSS variables, and Plus Jakarta Sans font |

---

## 📐 System Architecture

Halycon adheres to the **Model-View-Controller (MVC)** architectural pattern:

```text
[ Browser / Client ]
        │  ▲
        │  │ HTTP / JSON
        ▼  │
┌────────────────────────────────────────────────────────┐
│                   Express.js App                       │
│  ├── Session & Connect-Flash                           │
│  ├── Passport Authentication & Local Strategy          │
│  ├── res.locals Context Middleware (currUser, cart)    │
│  ├── Joi Request Validation (validateListing, Review)  │
│  └── RESTful Controllers (Listings, Book, Cart, Auth)  │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  Mongoose ORM   │         │ EJS-Mate Views  │
    │  (Listings,     │         │ (Layouts,       │
    │   Reviews,      │         │  Partials,      │
    │   Users)        │         │  Pages)         │
    └────────┬────────┘         └─────────────────┘
             ▼
    ┌─────────────────┐
    │ MongoDB Database│
    │   ('Halcoyn')   │
    └─────────────────┘
```

---

## 📁 Folder Structure

```bash
major/
├── app.js                   # Primary Express application & routing logic
├── middleware.js            # Auth guards, redirect keeper & Joi validation middlewares
├── schema.js                # Joi validation schemas for listings & reviews
├── package.json             # NPM project metadata & run scripts
├── PROJECT_DOCUMENTATION.md # Comprehensive 380+ line interview & HLD master guide
│
├── models/                  # Mongoose data models
│   ├── listing.js           # Listing schema with GeoJSON, image fallbacks & reviews array
│   ├── review.js            # Review schema with rating, comment & timestamps
│   └── user.js              # User schema with Passport-Local, cart & booking arrays
│
├── views/                   # EJS templates rendered via ejs-mate
│   ├── layouts/
│   │   └── boilerplate.ejs  # Main master layout (head, navbar, flash, footer)
│   ├── includes/
│   │   ├── navbar.ejs       # Sticky responsive navbar with search & cart dropdown
│   │   ├── footer.ejs       # Modern multi-column footer
│   │   └── flash.ejs        # Dismissible Bootstrap alert banners
│   ├── listings/            # Stays views (index, show, new, edit)
│   ├── users/               # Authentication views (signup, login)
│   ├── cart/                # Saved stays / wishlist management view
│   └── pages/               # Informational views (help, contact, careers)
│
├── public/                  # Static assets served by Express
│   ├── css/
│   │   └── style.css        # Custom design tokens, glassmorphism & cards styling
│   └── js/
│       ├── script.js        # Form validation & AJAX cart toggle logic
│       └── map.js           # Leaflet map engine, OSM geocoder & circle radius
│
├── init/                    # Database seeding scripts
│   ├── data.js              # Initial sample dataset of curated global stays
│   └── index.js             # Seeding runner with automated review generator
│
└── utils/                   # Shared utility helpers
    ├── ExpressError.js      # Custom error class with HTTP status codes
    └── wrapAsync.js         # Higher-order async route error wrapper
```

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (`v18.0.0` or higher)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017`

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/halycon.git
cd halycon
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed the Database
Populate your local MongoDB instance with curated stays and generated reviews:
```bash
npm run seed
```
> Output: `Connected to DB` → `Database initialized with listings and 5 reviews each!`

### 5. Launch the Application
```bash
npm start
```
The application will boot on **port 8080**.

### 6. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 📡 RESTful API Endpoints

| HTTP Method | Route Endpoint | Description | Middleware / Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Redirects to `/listings` | Public |
| `GET` | `/listings` | Displays all stays or filtered search results | Public |
| `GET` | `/listings/new` | Form to create a new stay | `isLoggedIn` |
| `POST` | `/listings` | Persists a new stay to the database | `isLoggedIn`, `validateListing` |
| `GET` | `/listings/:id` | Show page with Leaflet map, reviews & booking form | Public |
| `GET` | `/listings/:id/edit` | Form to edit an existing stay | `isLoggedIn` |
| `PUT` | `/listings/:id` | Updates stay details via `method-override` | `isLoggedIn`, `validateListing` |
| `DELETE` | `/listings/:id` | Deletes stay, cascades reviews & clears cart items | `isLoggedIn` |
| `POST` | `/listings/:id/book` | Places a reservation & generates booking code | Public / Logged-in |
| `POST` | `/listings/:id/reviews` | Submits a 1-5 star review | `isLoggedIn`, `validateReview` |
| `DELETE` | `/listings/:id/reviews/:revId` | Deletes a review from a listing | `isLoggedIn` |
| `GET` | `/cart` | View saved stays / wishlist page | `isLoggedIn` |
| `POST` | `/cart/toggle/:id` | AJAX endpoint to add/remove stay from wishlist | `isLoggedIn` (JSON 401 for guests) |
| `POST` | `/cart/remove/:id` | Removes item from cart | `isLoggedIn` |
| `GET` | `/signup` / `POST /signup` | User registration view & handler | Guest only |
| `GET` | `/login` / `POST /login` | User login view & authentication handler | Guest only |
| `GET` | `/logout` | Destroys session & logs out user | Authenticated |
| `GET` | `/help`, `/contact`, `/careers` | Static customer support & company pages | Public |

---

## 🗄️ Database Schemas

### User Model (`models/user.js`)
- `username`: Auto-managed by `passport-local-mongoose`.
- `email`: String, required, unique.
- `phone`: Normalized standard format (`+91 XXXXXXXXXX`).
- `cart`: Array of ObjectIds referencing `Listing`.
- `bookings`: Array of embedded sub-documents (`listing`, `bookingCode`, `checkIn`, `checkOut`, `guests`, `totalPrice`, `bookedAt`).

### Listing Model (`models/listing.js`)
- `title`: String, required.
- `description`: String, required.
- `image`: Object with `url` and `filename` (with Unsplash fallback).
- `price`: Number, required, min: 0.
- `location`: String, required.
- `country`: String, required.
- `geometry`: GeoJSON Point format `{ type: "Point", coordinates: [lng, lat] }`.
- `reviews`: Array of ObjectIds referencing `Review`.

### Review Model (`models/review.js`)
- `comment`: String, required.
- `rating`: Number (1 to 5).
- `createdAt`: Date (default: `Date.now`).

---

## 🔒 Security & Best Practices

1. **PBKDF2 Password Hashing:** Cryptographically salted password hashing powered by `passport-local-mongoose`. No plaintext passwords stored.
2. **Session Security:** `express-session` configured with `httpOnly: true` cookies to mitigate Cross-Site Scripting (XSS) session theft.
3. **Dual-Layer Validation:** Prevents invalid database entries by executing Joi schema validation before any controller logic executes.
4. **Cascading Referencing Integrity:** MongoDB `$pull` queries automatically clean up references from user carts and delete child reviews upon listing deletion.
5. **No Cost Geocoding:** Leaflet & OpenStreetMap allow full geographic exploration without storing sensitive third-party API keys in client-side code.

---

## 📚 Technical Deep Dive & Interview Guide

Looking for system design rationale, architecture diagrams, or preparation questions for technical interviews?

👉 **Check out [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md)** for:
- Detailed High-Level Design (HLD) & Mermaid Diagrams
- Step-by-step solutions to complex challenges faced during development
- **Top 20 Technical Interview Questions & Model Answers** covering Mongoose indexing, sessions, XSS defense, REST constraints, and scaling strategies.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).  
Developed with ❤️ by **Boyal** as a full-stack major project.
