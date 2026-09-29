# 🎟️ EventHub — Event Registration & Ticketing Platform

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Deployment](https://img.shields.io/badge/Deployed%20on-Render-blue.svg)](https://render.com)

> A full-stack, responsive Event Management & Registration Platform featuring enterprise-grade Role-Based Access Control (RBAC), real-time seat availability management, direct presentation links, and a modern dual-theme UI.

Developed as part of the **CodeAlpha Internship (Task 2: Event Registration System)**.

---

## 🌐 Live Demo & Links

- 🚀 **Live Application:** [https://event-hub-enz2.onrender.com/](https://event-hub-enz2.onrender.com/)
- 💻 **Source Repository:** [mastewalshiferaw/CodeAlpha_Event_Registration_System](https://github.com/mastewalshiferaw/CodeAlpha_Event_Registration_System)

---

## ✨ Features

### 1. 🔐 Role-Based Access Control (RBAC)
- **Super Admin:** Global control dashboard featuring real-time platform metrics (Total Events, Bookings, Confirmed Passes, Users), platform-wide attendee visibility, and global event deletion privileges.
- **Organizer:** Dedicated portal to publish custom events (capacity, pricing, dates, custom banners), access private attendee rosters (names, emails, phones), and manage self-hosted events.
- **Attendee / Public:** Frictionless event booking without mandatory registration, email-based ticket lookups, and self-service pass cancellation.

### 2. ⚡ Core Functionality
- **Automated Seat Tracking:** Automatically decrements available seats upon booking and restores capacity when a pass is cancelled.
- **Direct Presentation Links:** 1-click shareable public links (`?event=<ID>`) for spotlighting and presenting specific sessions directly.
- **Dynamic Fallbacks:** Automatically generates an editorial date-card widget when no custom image URL is provided.
- **Search & Filtering:** Instant keyword search alongside category filters (*All, Tech, Business, Online, Workshop*).
- **Dual Theme Support:** Smooth Dark/Light mode toggle with persistent local storage preference.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, Tailwind CSS |
| **Hosting & Cloud** | Render.com (Web Service), MongoDB Atlas (Cloud DB) |

---

## 📁 Project Structure

```text
CodeAlpha_Event_Registration_System/
├── middleware/
│   └── auth.js               # JWT verification & RBAC role enforcer
├── models/
│   ├── Event.js              # Event data schema & validation
│   ├── Registration.js       # Booking schema & seat logic
│   └── User.js               # User accounts & role schema
├── public/
│   ├── app.js                # Client logic, UI state & API fetch handlers
│   └── index.html            # Dual-theme single-page application interface
├── routes/
│   ├── authRoutes.js         # Register, Login, & Session verification
│   ├── eventRoutes.js        # Event CRUD, Attendees roster & Admin stats
│   └── registrationRoutes.js  # Booking, Ticket query & Cancellation
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Project manifests & dependencies
└── server.js                 # Express application entry point
🚀 API Endpoints
🔐 Authentication (/api/auth)
Method	Endpoint	Access	Description
POST	/api/auth/register	Public	Register a new user (ADMIN, ORGANIZER, ATTENDEE)
POST	/api/auth/login	Public	Sign in and receive a JWT token
🎟️ Events (/api/events)
Method	Endpoint	Access	Description
GET	/api/events	Public	Retrieve all published events
GET	/api/events/:id	Public	Retrieve details for a single event
POST	/api/events	Organizer / Admin	Publish a new event
DELETE	/api/events/:id	Owner / Admin	Delete an event permanently
GET	/api/events/:id/attendees	Owner / Admin	View attendee roster for an event
GET	/api/events/admin/stats	Admin Only	View platform-wide aggregated metrics
📝 Registrations (/api/registrations)
Method	Endpoint	Access	Description
POST	/api/registrations	Public	Book a ticket/register for an event
GET	/api/registrations/user/:email	Public	Fetch all tickets associated with an email
PATCH	/api/registrations/:id/cancel	Public / Owner	Cancel active ticket and restore seat capacity
💻 Local Setup & Installation
Prerequisites
Node.js (v16+ recommended)
MongoDB Atlas account or a local MongoDB instance
Git
Step-by-Step Installation
Clone the repository:
code
Bash
git clone https://github.com/mastewalshiferaw/CodeAlpha_Event_Registration_System.git
cd CodeAlpha_Event_Registration_System
Install dependencies:
code
Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory:
code
Bash
cp .env.example .env
Fill in your configuration:
code
Env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key
Start the server:
code
Bash
# Production mode
npm start

# Development mode (with nodemon)
npm run dev
Access the platform:
Open your browser and navigate to http://localhost:5000.
👤 Author
Mastewal Shiferaw
GitHub: @mastewalshiferaw
📄 License
This project was built for educational purposes as part of the CodeAlpha Internship Program.