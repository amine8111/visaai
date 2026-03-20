# VisaAI - Intelligent Visa Appointment Management System

A full-stack visa appointment management system with AI-powered features, tiered membership, and face-to-face meeting scheduling.

## Features

- **User Roles**: Applicant, Agent, Admin
- **Membership Tiers**: Free, Gold, Premium
  - Free: Standard queue, 2 appointments/month
  - Gold: Priority slots, 5 appointments/month, faster processing
  - Premium: Express processing, unlimited appointments, face-to-face meeting with Visa Agent
- **Assessment Tools**: AI-powered visa assessment and eligibility checker
- **Face-to-Face Meetings**: Premium members can schedule document verification sessions
- **Multi-language**: English, French, Arabic
- **AI Features**: Face verification, liveness check, risk analysis, smart allocation

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, i18next
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (Frontend), Render (Backend)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account

### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed   # Create test users
npm run dev    # Start development server
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev    # Start development server
```

## Test Accounts

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@visaai.com       | admin123    |
| Agent   | agent@visaai.com      | agent123    |
| Free    | applicant@visaai.com  | applicant123|
| Gold    | gold@visaai.com       | gold123     |
| Premium | premium@visaai.com     | premium123  |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/my-appointments` - Get user's appointments
- `PUT /api/appointments/cancel/:id` - Cancel appointment

### Membership
- `GET /api/membership/plans` - Get membership plans
- `GET /api/membership/my-membership` - Get current membership
- `POST /api/membership/upgrade` - Upgrade membership
- `POST /api/membership/book-meeting` - Book face-to-face meeting (Premium)

### Assessment & Eligibility
- `POST /api/assessment/assess` - Run visa assessment
- `GET /api/assessment/required-docs/:visaType` - Get required documents
- `POST /api/eligibility/check` - Check eligibility for destination
- `GET /api/eligibility/countries` - Get supported countries

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - User management
- `GET /api/admin/meetings` - Meeting management

## License

MIT
