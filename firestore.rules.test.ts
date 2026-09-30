/**
 * Phase 0: Payload-First Security TDD Test Specification (firestore.rules.test.ts)
 * Verifies that all 12 "Dirty Dozen" adversarial payloads in security_spec.md
 * are rejected with PERMISSION_DENIED by firestore.rules.
 */

export interface AdversarialTestVector {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authContext: {
    uid: string | null;
    email?: string;
    email_verified?: boolean;
  };
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_VECTORS: AdversarialTestVector[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Product (isFeaturedHack: true)',
    collectionPath: '/products/prod-1',
    operation: 'create',
    authContext: {
      uid: 'admin-1',
      email: 'deepakpanditgaikwad2004@gmail.com',
      email_verified: true,
    },
    payload: {
      name: 'GaN Charger',
      shortName: 'GaN',
      category: 'Chargers & Cables',
      price: 1299,
      originalPrice: 1999,
      stock: 10,
      rating: 4.8,
      reviewsCount: 10,
      image: 'https://placehold.co/400',
      tagline: 'Fast',
      description: 'Fast charger',
      isFeaturedHack: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Identity Spoofing on Order Creation (userId != request.auth.uid)',
    collectionPath: '/orders/VE-20260930-001',
    operation: 'create',
    authContext: {
      uid: 'attacker-uid',
      email: 'attacker@example.com',
      email_verified: true,
    },
    payload: {
      orderCode: 'VE-20260930-001',
      userId: 'victim-uid-999',
      customerName: 'Spoofer',
      customerEmail: 'a@b.com',
      phone: '9820411290',
      addressSummary: 'Bengaluru, Karnataka',
      itemsSummary: '1x GaN',
      subtotal: 1299,
      shipping: 0,
      discount: 0,
      total: 1299,
      paymentMethod: 'UPI',
      paymentDetails: 'GPay',
      status: 'Pending',
      date: '30 Sep 2026',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof Attack (email_verified: false)',
    collectionPath: '/products/1',
    operation: 'delete',
    authContext: {
      uid: 'spoof-admin',
      email: 'deepakpanditgaikwad2004@gmail.com',
      email_verified: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Blanket Read Attack on /orders/VE-20260929-001',
    collectionPath: '/orders/VE-20260929-001',
    operation: 'get',
    authContext: {
      uid: 'non-owner-uid',
      email: 'snooper@example.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Resource Exhaustion / 1MB String Poisoning on Order.addressSummary',
    collectionPath: '/orders/VE-20260930-002',
    operation: 'create',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      orderCode: 'VE-20260930-002',
      userId: 'user-1',
      customerName: 'User One',
      customerEmail: 'user1@example.com',
      phone: '9820411290',
      addressSummary: 'A'.repeat(5000),
      itemsSummary: '1x GaN',
      subtotal: 1299,
      shipping: 0,
      discount: 0,
      total: 1299,
      paymentMethod: 'UPI',
      paymentDetails: 'GPay',
      status: 'Pending',
      date: '30 Sep 2026',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'ID Poisoning Attack on /orders/{orderId}',
    collectionPath: '/orders/INVALID$ID#WITH!SPECIAL@CHARS',
    operation: 'create',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'State Shortcutting on Order Creation (status: Delivered)',
    collectionPath: '/orders/VE-20260930-003',
    operation: 'create',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      orderCode: 'VE-20260930-003',
      userId: 'user-1',
      customerName: 'User One',
      customerEmail: 'user1@example.com',
      phone: '9820411290',
      addressSummary: 'Bengaluru, Karnataka',
      itemsSummary: '1x GaN',
      subtotal: 1299,
      shipping: 0,
      discount: 0,
      total: 1299,
      paymentMethod: 'UPI',
      paymentDetails: 'GPay',
      status: 'Delivered',
      date: '30 Sep 2026',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Terminal State Mutation Attack on Delivered Order',
    collectionPath: '/orders/VE-20260929-001',
    operation: 'update',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      status: 'Pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immortal Field Tampering (userId modified on update)',
    collectionPath: '/orders/VE-20260928-003',
    operation: 'update',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      userId: 'different-user-id',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Client Timestamp Forgery (updatedAt != request.time)',
    collectionPath: '/wishlists/user-1',
    operation: 'update',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      userId: 'user-1',
      productIds: [1, 2],
      updatedAt: '1999-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbounded Array Attack on /wishlists/{userId} (> 50 items)',
    collectionPath: '/wishlists/user-1',
    operation: 'create',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      userId: 'user-1',
      productIds: Array.from({ length: 65 }, (_, i) => i + 1),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Privilege Escalation on /admins/{adminId}',
    collectionPath: '/admins/user-1',
    operation: 'create',
    authContext: {
      uid: 'user-1',
      email: 'user1@example.com',
      email_verified: true,
    },
    payload: {
      email: 'user1@example.com',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
