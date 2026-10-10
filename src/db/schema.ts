import { pgTable, serial, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';

export const productsTable = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name'),
  category: text('category').notNull(),
  brand: text('brand'),
  price: doublePrecision('price').notNull(),
  mrp: doublePrecision('mrp'),
  rating: doublePrecision('rating').default(4.8),
  reviewsCount: serial('reviews_count'),
  image: text('image'),
  badge: text('badge'),
  inStock: boolean('in_stock').default(true),
  description: text('description'),
  tagline: text('tagline'),
});

export const ordersTable = pgTable('orders', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone').notNull(),
  totalAmount: doublePrecision('total_amount').notNull(),
  status: text('status').default('Confirmed'),
  paymentMethod: text('payment_method').default('UPI'),
  paymentId: text('payment_id'),
  shippingAddress: text('shipping_address'),
  createdAt: timestamp('created_at').defaultNow(),
});
