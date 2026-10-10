# Implementation Plan: Navigation Auth, Premium Blue/Slate Aesthetic, Admin OCR, Strict UPI Payment & Order History

Implement requested architectural fixes and visual overhaul across navigation, authentication, admin tools, payment gateway, and customer account persistence.

---

## 1. Authentication-Aware Header & Navigation
- **Logged-Out vs Logged-In Distinction**:
  - Detect logged-out state. Instead of showing "Accounts and Orders" to anonymous guests, display prominent **"Login & Sign Up"** triggers.
  - **Mobile Layout**: Move "Login / Create Account" to the **very top** of the mobile drawer and header (above categories and quick links).
  - **Desktop Header**: Display "Sign In / Join" action button when logged out; display User Profile / "My Account & Orders" menu with badge when authenticated.
  - In bottom sticky navigation (mobile), adjust the Account tab to indicate "Login" when guest, and "Account" when authenticated.

---

## 2. Color Palette & Visual Theme Refresh
- **Color Scheme Transformation**:
  - Replace the green / emerald theme with **Clean Modern Blue & Slate with Amber Accents**:
    - Primary brand color: Deep High-Trust Blue (`#1e40af` / `#2563eb`) & Slate (`#0f172a` / `#1e293b`).
    - Accent & highlight color: Warm Amber / Gold (`#f59e0b` / `#d97706`) for ratings, badges, and CTAs.
    - Clean white cards (`#ffffff`) with subtle slate borders (`border-slate-200`) and soft elevation shadows.
  - Apply consistently across:
    - Navigation bar, announcements, buttons, category pills, cart badges, trust badges, checkout flow, and admin panels.

---

## 3. Admin Product Description Screenshot Reader (OCR)
- **Paste / Upload Image to Description Tool**:
  - Add an OCR / Screenshot Reader panel directly in the Admin Product Add/Edit form.
  - Support:
    1. **Clipboard paste (`Ctrl+V` / `Cmd+V`)** of any product spec sheet / label screenshot.
    2. **Drag-and-drop / file upload** of PNG/JPEG/WEBP screenshots.
  - Process the image using client-side OCR / Vision API parsing to extract:
    - Product title & model name.
    - Key technical specifications (e.g., Battery, Dimensions, Connectivity, Warranty).
    - Descriptive bullet points and features.
  - Provide preview and "Insert into Description" button to auto-fill the rich description textarea without manual typing.

---

## 4. Strict UPI Payment Gateway & Authorization Guard
- **Strict Verification Enforcement**:
  - Remove instant bypasses or automatic fake confirmations.
  - Implement direct **UPI Intent & Dynamic QR Code**:
    - Generates real UPI links (`upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`) for one-tap opening in GPay, PhonePe, Paytm, BHIM, CRED.
    - Requires customer to authorize payment in their app and submit the **12-digit UPI Reference No. / UTR** (or scan confirmation).
    - Validates UTR format and performs authorization verification with countdown timer before granting order confirmation.
    - Prevents navigation to order success until payment is genuinely marked authorized.

---

## 5. Account Registration, Profile & Order History Personalization
- **Dynamic User Profile & Real Order Linking**:
  - When a guest signs up or completes an order with their information:
    - Save their full name, phone number, shipping address, and email directly to their persistent profile.
    - Associate newly created orders with their authenticated user UID in Firestore and local state.
    - Ensure Order History only shows orders belonging to the logged-in customer (removing hardcoded placeholder data for newly registered users).
  - Add account editing: edit profile details, manage default delivery address, and view order tracking status.

---

## 6. Automated Transactional Email Notification Service
- **Order & Status Email Module**:
  - Complete email service module (`src/services/emailService.ts` and `/api/send-email` endpoint).
  - Templates for:
    - Order Confirmation (item breakdown, shipping address, payment method, invoice details).
    - Order Dispatched / Shipping Update with tracking link.
  - Triggers automatically upon successful checkout and admin status updates.
