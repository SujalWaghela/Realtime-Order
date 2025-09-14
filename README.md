# Real-time Orders System

A real-time order management system that automatically pushes database changes to connected clients using MongoDB Change Streams and WebSockets.

## 🎯 Problem Statement

This system solves the challenge of efficiently propagating database changes to clients in real-time without relying on frequent polling. When orders are created, updated, or deleted in the database, all connected clients receive immediate updates automatically.

## 🏗️ Architecture & Approach

### Core Components

1. **Express.js REST API** - Handles CRUD operations for orders
2. **MongoDB with Change Streams** - Monitors database changes in real-time
3. **Socket.IO** - Enables bidirectional communication between server and clients
4. **Web Client** - Real-time dashboard showing order updates

### Technical Approach

The system uses **MongoDB Change Streams** to monitor database changes at the collection level. When any operation (insert, update, delete) occurs on the orders collection, the change stream captures the event and broadcasts it to all connected clients via Socket.IO.

**Why this approach?**
- **Efficient**: No polling required - changes are pushed only when they occur
- **Real-time**: Sub-second latency for updates
- **Scalable**: MongoDB Change Streams are designed for production workloads
- **Reliable**: Built-in error handling and reconnection logic
- **Database-agnostic**: Works with any MongoDB-compatible database

### Data Flow

```
Database Change → Change Stream → Server → Socket.IO → Client
```

1. Client performs CRUD operation via REST API
2. MongoDB processes the operation
3. Change Stream detects the modification
4. Server receives change event
5. Server broadcasts to all connected clients via Socket.IO
6. Clients update their UI in real-time

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB instance
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-orders
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the project root:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

5. **Access the client**
   Open your browser and navigate to `http://localhost:3000`

## 🧪 How to Test This

### Start the System

1. Start the server:
   ```bash
   npm start
   ```

2. Open the client dashboard at `http://localhost:3000`

### Test Real-time Updates

The client will automatically show real-time updates. Use these curl commands to test:

#### Create a New Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"id": 200, "customer_name": "Bob", "product_name": "T-shirt", "status": "pending"}'
```
*This will create a new order card in the dashboard*

#### Update an Existing Order
```bash
curl -X PUT http://localhost:3000/orders/200 \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped", "product_name": "T-shirt XL"}'
```
*This will update the existing card instead of creating a duplicate*

#### Delete an Order
```bash
curl -X DELETE http://localhost:3000/orders/200
```
*This will remove the card from the dashboard*

#### Get All Orders
```bash
curl -X GET http://localhost:3000/orders
```

### Expected Behavior

- **Create**: New order card appears at the top of the dashboard
- **Update**: Existing card updates in place and moves to top
- **Delete**: Card is removed from the dashboard
- **Real-time**: All changes appear instantly without page refresh

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/orders` | Retrieve all orders (sorted by updated_at desc) |
| `POST` | `/orders` | Create a new order |
| `PUT` | `/orders/:id` | Update an order by ID |
| `DELETE` | `/orders/:id` | Delete an order by ID |

### Order Schema

```json
{
  "id": "number (required, unique)",
  "customer_name": "string",
  "product_name": "string", 
  "status": "string (enum: pending, shipped, delivered)",
  "updated_at": "date (auto-generated)"
}
```

## 🔧 Technical Implementation Details

### Why MongoDB Change Streams?

1. **Native Real-time Monitoring**: Built into MongoDB, no external tools needed
2. **Low Latency**: Changes are detected within milliseconds
3. **Reliable**: Handles network interruptions and reconnections
4. **Scalable**: Works with replica sets and sharded clusters
5. **Rich Event Data**: Provides full document, update descriptions, and operation types

### Why Socket.IO?

1. **Cross-browser Compatibility**: Handles WebSocket fallbacks automatically
2. **Room Management**: Easy to implement user-specific updates
3. **Reconnection Logic**: Built-in handling of connection drops
4. **Event-based**: Clean separation of concerns

### Why Express.js?

1. **Lightweight**: Minimal overhead for API endpoints
2. **Middleware Support**: Easy CORS and JSON parsing
3. **RESTful**: Standard HTTP methods for CRUD operations
4. **Static File Serving**: Built-in support for serving the client

## 📁 Project Structure

```
realtime-orders/
├── server.js              # Main server file with API and Socket.IO
├── public/
│   └── index.html         # Real-time client dashboard
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
└── README.md             # This file
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify your `MONGODB_URI` in `.env` file
   - Check MongoDB Atlas IP whitelist
   - Ensure database user has proper permissions

2. **Socket.IO Connection Issues**
   - Check browser console for errors
   - Verify CORS settings
   - Ensure server is running on correct port

3. **Change Stream Not Working**
   - Verify MongoDB version supports Change Streams (3.6+)
   - Check if replica set is properly configured
   - Ensure user has `changeStream` permissions

## 🔮 Future Enhancements

- **Authentication**: Add user authentication and authorization
- **Filtering**: Allow clients to subscribe to specific order types
- **Persistence**: Store change history for audit trails
- **Scaling**: Add Redis for horizontal scaling
- **Monitoring**: Add health checks and metrics

## 📝 License

ISC License - see package.json for details
