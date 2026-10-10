# Crazy Mobiles — Python Flask & MongoDB Backend

This directory contains the production-ready Python Flask backend service configured for MongoDB using `${{ MongoDB.MONGO_PRIVATE_URL }}`.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables**:
   Set your MongoDB private URL in your environment or `.env` file:
   ```env
   MONGO_PRIVATE_URL="mongodb+srv://username:password@cluster.mongodb.net/crazymobiles?retryWrites=true&w=majority"
   ```

3. **Run the Flask Server**:
   ```bash
   python app.py
   ```
   The server runs on `http://localhost:5000` with endpoints:
   - `GET /api/health` - Health check & database status
   - `GET /api/orders` - Retrieve recent orders from MongoDB
   - `POST /api/orders` - Create/persist a new customer order in MongoDB
