# 📅 4-Week Roadmap for CLMS (Custom Land Management System)

---

## **Week 1 — Project Setup + Database Models**

### 🎯 Goal: Have a working project skeleton + DB entities

**Steps:**

1. Initialize Project

   ```bash
   mkdir gbewaa-clms && cd gbewaa-clms
   npm init -y
   npm install express sequelize pg pg-hstore jsonwebtoken bcrypt cors dotenv pdfkit
   ```
2. Folder Structure

   ```
   src/
   ├── config/
   │   └── db.js
   ├── models/
   │   ├── User.js
   │   ├── LandPlot.js
   │   └── Transaction.js
   ├── controllers/
   ├── services/
   ├── routes/
   ├── middlewares/
   ├── utils/
   └── server.js
   ```
3. Setup DB connection (`config/db.js`).
4. Define Models (`User.js`, `LandPlot.js`, `Transaction.js`).
5. Sync DB & Test Connection (`sequelize.sync()`).

✅ End of Week 1: You can connect to PostgreSQL and see tables created.

---

## **Week 2 — Authentication + User Roles**

### 🎯 Goal: Secure the system with login & role-based access

**Steps:**

1. Auth Service → register/login using `bcrypt` for passwords.
2. JWT Tokens → issue on login.
3. Middleware (`middlewares/auth.js`):

   * Verify token.
   * Check role (ADMIN, STAFF, AUDITOR).
4. Routes (`routes/auth.js`):

   * `POST /auth/register` (admin only).
   * `POST /auth/login`.

✅ End of Week 2: You can log in, get a token, and protect routes.

---

## **Week 3 — Land & Transaction APIs**

### 🎯 Goal: Handle land registry + sales

**Steps:**

1. Land Service + Controller (`landService.js`, `landController.js`):

   * `POST /lands` → Add land.
   * `GET /lands` → List lands.
   * `PUT /lands/:id` → Update status.
2. Transaction Service + Controller (`transactionService.js`, `transactionController.js`):

   * `POST /transactions` → Record sale → auto-calc commission.
   * `GET /transactions` → List sales.
3. Commission Logic → inside service (e.g. `commission = price * 0.1`).
4. Routes (`routes/lands.js`, `routes/transactions.js`).

✅ End of Week 3: You can create land plots, record sales, and auto-calc commission.

---

## **Week 4 — Reports + Receipts**

### 🎯 Goal: Add reporting + generate PDFs

**Steps:**

1. Reports API (`reportsController.js`):

   * `GET /reports/summary` → returns:

     * Total lands sold
     * Revenue earned
     * Total commission
     * Disputed plots count
2. PDF Receipts (`utils/pdfGenerator.js` with `pdfkit`):

   * Auto-generate receipt on `POST /transactions`.
   * Include buyer, seller, plot number, price, commission, date.
3. Testing:

   * Run Postman tests for all APIs.
   * Add seed data (fake lands + sales).
4. Deploy: Push to GitHub → Deploy on Render/Heroku.

✅ End of Week 4: You have a working backend with secure APIs, reports, and PDF receipts.

---

# 🎉 Final Deliverable After 1 Month

* Fully working CLMS backend with:

  * Auth (JWT + roles)
  * Land registry
  * Sales + commission tracking
  * Reports
  * PDF receipts
* Ready for real data entry at Gbewaa Palace 🚀