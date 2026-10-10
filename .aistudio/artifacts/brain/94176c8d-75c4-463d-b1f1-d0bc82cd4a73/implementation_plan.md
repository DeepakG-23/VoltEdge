# Implementation Plan - Firebase Firestore Real-Time Migration (Dismiss MongoDB & Flask)

This plan outlines the complete removal of the MongoDB/Flask backend and the full integration of Firebase Firestore for real-time data persistence, live inventory sync, and product/order management in Crazy Mobiles.

## User Requirements Addressed
1. Dismiss MongoDB private URL and remove Python Flask backend.
2. Enable storing real products (deleting demo ones) and real-time data changes across clients and admin dashboard using Firebase Firestore.

## Proposed Changes

### 1. Cleanup MongoDB & Flask Backend
- Delete the `backend/` directory (`app.py`, `requirements.txt`, etc.).
- Update `package.json` scripts if any referenced Python or MongoDB runners.
- Update `.env.example` to remove MongoDB connection strings.

### 2. Firebase Firestore Integration & Real-Time Sync
- **Products Collection (`products`)**: Update `src/App.tsx` and admin components to fetch and listen to real-time product updates using `onSnapshot` from Firestore.
- **Orders Collection (`orders`)**: Save new orders directly to Firestore and listen for order status updates in real time.
- **Customer Profiles & Wishlists**: Ensure customer profiles, wishlists, and cart sync seamlessly with Firestore in real time.
- **Seed Data Management**: Allow admins to easily clear demo products and add real products directly stored in Firestore.

### 3. Verification Plan
- Verify that products added in the Admin Dashboard instantly reflect on the storefront in real time via Firestore `onSnapshot`.
- Verify orders placed at checkout save to Firestore and appear in the admin orders list.
- Verify no errors occur due to missing MongoDB or Flask connections.
