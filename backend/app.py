import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# Support MongoDB URI from MONGO_PRIVATE_URL, MONGO_URL, MONGODB_URI, or DATABASE_URL
mongo_uri = os.getenv('MONGO_PRIVATE_URL') or os.getenv('MONGO_URL') or os.getenv('MONGODB_URI') or os.getenv('DATABASE_URL')

db = None
mongo_client = None

if mongo_uri and ('mongodb' in mongo_uri or 'srv' in mongo_uri):
    try:
        mongo_client = MongoClient(mongo_uri)
        # Select database 'crazymobiles'
        db = mongo_client.get_database('crazymobiles')
        print("Connected to MongoDB successfully!")
    except Exception as e:
        print(f"MongoDB connection error: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    db_type = "MongoDB" if mongo_client else "PostgreSQL / SQLite"
    return jsonify({
        'status': 'healthy',
        'service': 'Crazy Mobiles Python Flask Backend',
        'database': db_type
    })

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        order_doc = {
            'id': data.get('id', f"CM-{int(datetime.utcnow().timestamp())}"),
            'customerName': data.get('customerName'),
            'customerEmail': data.get('customerEmail'),
            'customerPhone': data.get('customerPhone'),
            'totalAmount': data.get('totalAmount', 0.0),
            'status': 'Confirmed',
            'paymentMethod': data.get('paymentMethod', 'UPI'),
            'paymentId': data.get('paymentId'),
            'shippingAddress': data.get('shippingAddress', {}),
            'items': data.get('items', []),
            'createdAt': datetime.utcnow()
        }

        if db is not None:
            db.orders.insert_one(order_doc)
            # Convert ObjectId for JSON serialization
            order_doc['_id'] = str(order_doc.get('_id'))

        return jsonify({'success': True, 'order': order_doc}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        orders = []
        if db is not None:
            cursor = db.orders.find().sort('createdAt', -1).limit(50)
            for doc in cursor:
                doc['_id'] = str(doc.get('_id'))
                orders.append(doc)
        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
