# Smart Parking System API

A modern backend for a smart parking system built with Node.js, Express, and Prisma with PostgreSQL.

## Features

- User authentication and management
- Vehicle registration and tracking
- Parking space management
- Booking system
- Payment processing
- Sensor integration

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **Helmet** - Security
- **Winston** - Logging

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd smart-parking
```

2. Install dependencies:
```
npm install
```

3. Configure environment variables:
```
cp env.example .env
```
Edit the `.env` file with your PostgreSQL connection details.

4. Set up the database:
```
npm run prisma:migrate
npm run prisma:generate
```

5. Start the development server:
```
npm run dev
```

### Production Deployment

1. Build for production:
```
npm run build
```

2. Start the server:
```
npm start
```

## API Documentation

API endpoints will be available at `/api/v1` when the server is running.

## Database Schema

The database schema includes the following models:
- User
- Vehicle
- ParkingSpace
- Booking
- Payment
- Sensor

View the complete schema in `prisma/schema.prisma`.

## License

This project is licensed under the ISC License. 