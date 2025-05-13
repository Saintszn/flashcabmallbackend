# FlashCab Mall Backend

This backend serves both the admin-panel (web-based) and the user-panel (mobile app) for the FlashCab Mall project. It dynamically handles API calls to send and retrieve data from an online MySQL database.

## Features
- **User Authentication:** Signup, login, and password updates using JWT.
- **Product Management:** CRUD operations for products.
- **Order Management:** Place orders, update order statuses, and retrieve order details.
- **User Profile & Notifications:** Dynamic retrieval and update of user profiles and notifications.
- **Coupon Management:** Create, update, and validate coupons.
- **Dynamic Settings:** Update adverts, flash sales, and other settings.
- **Real-time API Endpoints:** All data exchanged dynamically via API endpoints.

## Technologies Used
- Node.js with Express
- MySQL (using mysql2)
- JWT for authentication
- Middleware for logging, CORS, and JSON body parsing

## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env` file in the root directory and set the following variables:

PORT=3000 DB_HOST=your_db_host DB_USER=your_db_user DB_PASSWORD=your_db_password DB_NAME=your_db_name JWT_SECRET=your_jwt_secret JWT_EXPIRE=1d

4. Ensure your MySQL database has the following tables (Users, Products, Orders, Coupons, Notifications, Categories, SubCategories, Settings).
5. Run `npm run dev` to start the development server.
6. The API will be available at `http://localhost:3000/`.

## API Endpoints
Refer to the code in the `/routes` folder for the full list of available endpoints.
"# Flashcabmallbackend" 
