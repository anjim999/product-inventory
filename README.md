# Inventory Management System

This project is a complete inventory management application built with React on the frontend and Node.js/Express with SQLite on the backend.  
It includes user authentication with OTP verification, product management tools, CSV import/export, and automatic inventory history tracking.

The goal of this project is to provide a clean, simple, and functional system that can be used for small businesses, assignments, or as a learning project for full-stack development.

---

## Features

### 1. User Authentication
- OTP-based registration
- OTP-based password reset
- Email + password login (secured with bcrypt)
- JWT token for authenticated routes
- Login session persists on page refresh
- User names supported during registration

### 2. Product Management
- Add, edit, delete products
- Product search and category filtering
- Sorting by name, stock, category, or brand
- Image preview support
- Unique product validation per user
- Clean and responsive UI

### 3. Inventory History
Every time the stock of a product changes, the system stores:
- previous and new stock values  
- the user who made the update  
- the timestamp  

The history is displayed in a right-side sliding panel.

### 4. CSV Import/Export
- Import multiple products using a CSV file
- Duplicate products are skipped automatically
- Export all products to CSV format
- Summary after import (added, skipped, duplicates)

### 5. Separate Data Per User
Each user only sees **their own** products and history.

---

## Tech Stack

### Frontend
- React (Vite)
- React Router
- TailwindCSS
- Axios
- Context API for authentication

### Backend
- Node.js
- Express.js
- SQLite database
- bcryptjs for hashing
- JSON Web Tokens for authentication
- Multer for CSV uploads
- express-validator for form validation
- Nodemailer / Resend / Brevo for OTP email sending

---

## Folder Structure

```
frontend/
  src/
    components/
    pages/
    context/
    api/
    App.jsx
    main.jsx

backend/
  src/
    routes/
      auth.js
      products.js
    utils/
      mailer.js
      otp.js
    middleware/
      auth.js
      upload.js
    db.js
    server.js
  inventory.db
```

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

## Backend Setup

### Install dependencies
```bash
cd backend
npm install
```

### Configure environment variables
Create a `.env` file inside the `backend` folder:

```
PORT=5000
JWT_SECRET=your_secret
RESEND_API_KEY=your_api_key   # or Brevo SMTP credentials
EMAIL_FROM=your_verified_email
```

### Start the backend
```bash
npm start
```

The server will run at:
```
http://localhost:5000
```

---

## Frontend Setup

### Install dependencies
```bash
cd frontend
npm install
```

### Create a `.env` file
```
VITE_API_BASE_URL=http://localhost:5000
```

### Start the frontend
```bash
npm run dev
```

The frontend will run at:
```
http://localhost:5173
```

---

## CSV Import Format

Below is the recommended CSV structure for importing products:

```
name,unit,category,brand,stock,status,image
Pen,pcs,Stationery,Cello,100,In Stock,
Shirt,pcs,Clothing,Levis,50,In Stock,
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register-request-otp` | Send OTP for sign-up |
| POST | `/api/auth/register-verify` | Verify OTP and create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password-request` | Send OTP for password reset |
| POST | `/api/auth/forgot-password-verify` | Reset password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get products (user-specific) |
| POST | `/api/products` | Add product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/import` | Import CSV |
| GET | `/api/products/export` | Export CSV |
| GET | `/api/products/:id/history` | Product stock history |

---

## Notes

- When using **Resend** without domain verification, you can only receive OTP on your own email.  
- When using **Brevo**, you must verify the sender email for emails to send successfully.  
- For development, OTP codes are also shown in the backend console.

---

## Acknowledgements

This project was created for learning and assignment purposes, with focus on practical full-stack development and real-world features like authentication, mail services, and database design.


Frontend Live URL:
https://product-inventory-nu.vercel.app/

Backend API URL:
https://product-inventory-1-u9zq.onrender.com