# 🚚 SwiftDrop (Backend)

A secure, scalable, and production-ready Node.js + Express + TypeScript backend for managing parcels, users, authentication, and dashboards for the SwiftDrop logistics platform.
This service powers the full parcel-delivery workflow — from creation to tracking to delivery confirmation — while enforcing role-based access across Admin, Sender, and Receiver roles.

## ✨ Features

---  

## 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing (bcrypt)
- Role-based access control (Admin / Sender / Receiver)
- Protected API routes using middleware

---

## 📦 Parcel Management

- Create, update, cancel, and track parcels
- Sender & Receiver user flows supported
- Status logs for parcel history
- Server-side validation & sanitization

---

## 👤 User Management

- Create, update, fetch user profiles
- Role enforcement at the route level
- Optional admin-level visibility for all users

---

## 📊 Dashboard Statistics API

- Aggregated parcel stats (delivered, in transit, canceled)
- Monthly shipment analytics
- Optimized MongoDB queries for performance

--- 

## 🧱 Scalable Architecture

- Modular feature-first folder structure
- Controllers, services, models, and routes cleanly separated
- TypeScript throughout for type-safety
- Built with maintainability and extensibility in mind

---

## 🗂️ Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.ts             # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts           # JWT + role verification
│   │   └── errorHandler.ts   # Global error middleware
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.model.ts
│   │   └── parcels/
│   │       ├── parcel.controller.ts
│   │       ├── parcel.service.ts
│   │       └── parcel.model.ts
│   ├── utils/
│   │   └── response.ts        # Standardized API responses
│   ├── app.ts                 # Core express app
│   └── server.ts              # Server entrypoint
├── .env.example
├── package.json
└── tsconfig.json
```
--- 

## 🛠️ Tech Stack

|Category |	Technology |
|---------|------------|
| Runtime |	Node.js |
| Server Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcrypt |
| Validation | Custom middleware / Optional Zod / JOI |
| Logging |	Console / Optional integrations |
| Deployment Ready | Supports Vercel, Railway, Render, DigitalOcean, AWS |

---

## ⚙️ Environment Variables
Create a .env file based on .env.example:
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

--- 

## 🚀 Getting Started
### 1. Clone the repo
```
git clone https://github.com/yourname/swiftdrop-backend.git
cd swiftdrop-backend
```
### 2. Install dependencies
```
npm install
```
### 3. Configure environment
```
cp .env.example .env
# update your variables
```
### 4. Run development server
```
npm run dev
```
### 5. Build for production
```
npm run build
npm start
```

--- 

### 🔗 API Overview
Here’s a quick overview of available endpoints (simplified):

Auth
|Method |	Endpoint | Description |
|-------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login & get token |

Users
| Method | Endpoint |	Description |
|-------|----------|-------------|
|  GET  | 	/api/users/me  |	  Get current user   |
|  PATCH  | 	/api/users/:id  |   Update profile   |

Parcels
| Method | Endpoint |	Description |
|-------|----------|-------------|
| POST | /api/parcels | Create parcel |
| GET |	/api/parcels | List parcels |
| GET |	/api/parcels/:id | Parcel details |
| PATCH |	/api/parcels/:id/status |	Update status |
| PATCH	| /api/parcels/:id/cancel |	Cancel parcel |

Stats
| Method | Endpoint |	Description 
|-------|----------|-------------|
|   GET   |	/api/stats/parcels  | Dashboard stats |

--- 

### 🧪 Testing (Optional)
If you want to add testing:
```
npm install --save-dev jest supertest ts-jest
```

### 🔒 Production Notes

- Use HTTPS in production
- Set strong JWT secrets
- Limit login attempts (rate limiting)
- Enable CORS rules for specific domains
- Use MongoDB indexes for performance
- Review logs for anomalies

### 🤝 Contributing

Contributions are welcome!
Please open an issue before submitting major changes.
 
### 📝 License

MIT License.
Feel free to use, modify, and distribute with attribution.

### 👨‍💻 Author
Mohammad Al - Amin
