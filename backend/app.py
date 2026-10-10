import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

# PostgreSQL database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/crazymobiles'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models (PostgreSQL via SQLAlchemy)
class ProductModel(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    short_name = db.Column(db.String(128))
    category = db.Column(db.String(64), nullable=False)
    brand = db.Column(db.String(64))
    price = db.Column(db.Float, nullable=False)
    mrp = db.Column(db.Float)
    rating = db.Column(db.Float, default=4.8)
    reviews_count = db.Column(db.Integer, default=124)
    image = db.Column(db.Text)
    badge = db.Column(db.String(64))
    in_stock = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text)
    tagline = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'shortName': self.short_name,
            'category': self.category,
            'brand': self.brand,
            'price': self.price,
            'mrp': self.mrp,
            'rating': self.rating,
            'reviewsCount': self.reviews_count,
            'image': self.image,
            'badge': self.badge,
            'inStock': self.in_stock,
            'description': self.description,
            'tagline': self.tagline
        }

class OrderModel(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.String(64), primary_key=True)
    customer_name = db.Column(db.String(128), nullable=False)
    customer_email = db.Column(db.String(128))
    customer_phone = db.Column(db.String(32), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(32), default='Confirmed')
    payment_method = db.Column(db.String(64), default='UPI')
    payment_id = db.Column(db.String(128))
    shipping_address = db.Column(db.Text)
    items_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customerName': self.customer_name,
            'customerEmail': self.customer_email,
            'customerPhone': self.customer_phone,
            'totalAmount': self.total_amount,
            'status': self.status,
            'paymentMethod': self.payment_method,
            'paymentId': self.payment_id,
            'shippingAddress': self.shipping_address,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Crazy Mobiles Python Flask PostgreSQL Backend'})

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = ProductModel.query.all()
        return jsonify([p.to_dict() for p in products])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        new_order = OrderModel(
            id=data.get('id', f"CM-{int(datetime.utcnow().timestamp())}"),
            customer_name=data.get('customerName'),
            customer_email=data.get('customerEmail'),
            customer_phone=data.get('customerPhone'),
            total_amount=data.get('totalAmount', 0.0),
            status='Confirmed',
            payment_method=data.get('paymentMethod', 'UPI'),
            payment_id=data.get('paymentId'),
            shipping_address=str(data.get('shippingAddress', '')),
            items_json=str(data.get('items', []))
        )
        db.session.add(new_order)
        db.session.commit()
        return jsonify({'success': True, 'order': new_order.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        orders = OrderModel.query.order_by(OrderModel.created_at.desc()).all()
        return jsonify([o.to_dict() for o in orders])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
