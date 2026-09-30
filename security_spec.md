# VoltEdge Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default-Deny Safety Net**: Every path not explicitly matched is denied (`allow read, write: if false;`).
2. **Path Variable Hardening (`isValidId`)**: All document IDs (`productId`, `orderId`, `userId`, `adminId`) on single-document operations (`get`, `create`, `update`, `delete`) must be strings between 1 and 128 chars matching `^[a-zA-Z0-9_\-]+$`.
3. **Strict Key & Type Validation (`isValid[Entity]`)**: Every `create` and `update` must pass `isValidProduct`, `isValidOrder`, or `isValidWishlist` verifying `hasAll` and `hasOnly` keys, exact types, numeric bounds, enum values, and string `.size()` limits.
4. **Identity & Verified Email Enforcement**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
5. **PII Isolation & Query Enforcement (`/orders/{orderId}` & `/wishlists/{userId}`)**:
   - Orders contain PII (`customerEmail`, `phone`, `addressSummary`). `get` and `list` are strictly restricted to the document owner (`resource.data.userId == request.auth.uid`) or a verified administrator.
   - Wishlists are strictly isolated to `request.auth.uid == userId`.
6. **Temporal & Immutable Field Integrity**:
   - `createdAt` must equal `request.time` on `create` and remain immutable (`incoming().createdAt == existing().createdAt`) on `update`.
   - `updatedAt` must equal `request.time` on both `create` and `update`.
   - `userId` on `Order` and `UserWishlist` is immutable after creation.
7. **Terminal State Locking**: Once an `Order` reaches `status == 'Delivered'`, non-admin users cannot mutate it further.

---

## 2. The "Dirty Dozen" Payloads

1. **Shadow Field Injection on Product (`isFeaturedHack: true`)**:
   ```json
   { "name": "GaN Charger", "shortName": "GaN", "category": "Chargers & Cables", "price": 1299, "originalPrice": 1999, "stock": 10, "rating": 4.8, "reviewsCount": 10, "image": "https://placehold.co/400", "tagline": "Fast", "description": "Fast charger", "isFeaturedHack": true }
   ```
2. **Identity Spoofing on Order Creation (`userId` != `request.auth.uid`)**:
   ```json
   { "orderCode": "VE-2026-001", "userId": "victim_uid_999", "customerName": "Spoofer", "customerEmail": "a@b.com", "phone": "9820411290", "addressSummary": "Bengaluru", "itemsSummary": "1x GaN", "subtotal": 1299, "shipping": 0, "discount": 0, "total": 1299, "paymentMethod": "UPI", "paymentDetails": "GPay", "status": "Pending", "date": "30 Sep 2026" }
   ```
3. **Unverified Admin Email Spoof Attack (`email_verified: false`)**:
   - Token `{ email: "deepakpanditgaikwad2004@gmail.com", email_verified: false }` attempting to delete `/products/1`.
4. **PII Blanket Read Attack on `/orders/VE-20260929-001`**:
   - Authenticated user `attacker_uid` attempting `get` or `list` on orders belonging to `owner_uid`.
5. **Resource Exhaustion / 1MB String Poisoning on `Order.addressSummary`**:
   - `addressSummary` containing 10,000 characters (exceeds `maxLength: 400`).
6. **ID Poisoning Attack on `/orders/{orderId}`**:
   - Document ID containing special characters or > 128 chars.
7. **State Shortcutting on Order Creation (`status: "Delivered"`)**:
   - Buyer creating a new order directly with `status: "Delivered"` instead of `"Pending"`.
8. **Terminal State Mutation Attack**:
   - Buyer attempting to update an order whose `existing().status == "Delivered"`.
9. **Immortal Field Tampering (`createdAt` or `userId` modified on update)**:
   - Updating `Order` while changing `userId` or `createdAt`.
10. **Client Timestamp Forgery**:
    - Supplying a past or future `updatedAt` timestamp not equal to `request.time`.
11. **Unbounded Array Attack on `/wishlists/{userId}`**:
    - `productIds` array with 500 elements (exceeds max 50 limit) or non-number first element.
12. **Self-Privilege Escalation on `/admins/{adminId}`**:
    - Regular user attempting `setDoc` on `/admins/my_uid`.

---

## 3. Red Team Audit Summary

- **Shadow Update Test**: Passed — `hasOnly` and `isValid[Entity]` block undeclared keys on both `create` and `update`.
- **Email Spoofing Test**: Passed — `isAdmin()` requires `isVerifiedUser()` (`request.auth.token.email_verified == true`).
- **PII Blanket Test**: Passed — `/orders` and `/wishlists` enforce `userId == request.auth.uid || isAdmin()`.
- **Query Trust Test**: Passed — `allow list` on `/orders` and `/wishlists` explicitly checks `resource.data.userId == request.auth.uid` without `get()`/`exists()` inside list rules.
