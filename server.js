require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve client files from ./public

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

/* -------------------- Mongoose / Model -------------------- */
const orderSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // optional - you can use _id
  customer_name: { type: String },
  product_name: { type: String },
  status: { type: String, enum: ['pending', 'shipped', 'delivered'], default: 'pending' },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'orders' });

const Order = mongoose.model('Order', orderSchema);

/* -------------------- Express endpoints -------------------- */
// Create
app.post('/orders', async (req, res) => {
  try {
    const payload = { ...req.body, updated_at: new Date() };
    const order = await Order.create(payload);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Read all
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ updated_at: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update by id (id is the numeric field)
app.put('/orders/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const update = { ...req.body, updated_at: new Date() };
    const order = await Order.findOneAndUpdate({ id }, update, { new: true, upsert: false });
    if (!order) return res.status(404).json({ message: 'Not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
app.delete('/orders/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await Order.findOneAndDelete({ id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- Socket.io connections -------------------- */
io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.on('disconnect', () => {
    console.log('client disconnected', socket.id);
  });
});

/* -------------------- Watch DB changes (Change Stream) -------------------- */
async function start() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('MongoDB connected');

  // Get the raw collection (ensure collection name 'orders')
  const collection = mongoose.connection.collection('orders');

  // Watch the collection. 'fullDocument: "updateLookup"' ensures we get the full doc on updates.
  const changeStream = collection.watch([], { fullDocument: 'updateLookup' });

  changeStream.on('change', (change) => {
    // change.operationType: "insert" | "update" | "replace" | "delete" | "invalidate" | ...
    console.log('Change detected:', change.operationType);

    const payload = {
      op: change.operationType,
      ns: change.ns,                // namespace
      documentKey: change.documentKey, // _id of doc
      fullDocument: change.fullDocument || null,
      updateDescription: change.updateDescription || null
    };

    // Broadcast to all connected clients
    io.emit('orderChanged', payload);
  });

  changeStream.on('error', (err) => {
    console.error('Change stream error:', err);
    // In production add reconnection/backoff logic here
  });

  changeStream.on('close', () => {
    console.warn('Change stream closed');
    // optionally try to reopen
  });

  server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });

  // graceful shutdown
  process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down...');
    try {
      await changeStream.close();
      await mongoose.disconnect();
      server.close(() => process.exit(0));
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
}

start().catch(err => {
  console.error('Failed to start', err);
});
