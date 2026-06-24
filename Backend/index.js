require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

// Database Connection Manager (with caching for Serverless environments)
let cachedConnection = null;
const isPlaceholderUri = MONGODB_URI ? (MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>')) : true;

async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (!MONGODB_URI || isPlaceholderUri) {
        console.warn('\n⚠️  [GymFlow Database Warning] MONGODB_URI is not set or contains placeholders (<username>/<password>).');
        console.warn('⚠️  Please configure your database connection inside Backend/.env or Vercel Environment Variables.');
        console.warn('⚠️  Attempting to connect to local MongoDB database fallback if available...\n');
        cachedConnection = await mongoose.connect('mongodb://localhost:27017/gymflow');
        return cachedConnection;
    }

    try {
        cachedConnection = await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB database successfully.');
        return cachedConnection;
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        throw err;
    }
}

// Proactively connect on startup (will fail silently or print log if offline/unconfigured)
connectToDatabase().catch(err => {
    console.error('❌ Initial MongoDB startup connection failed:', err.message);
});

// Middleware to ensure DB is connected before handling any requests
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error('Database connection middleware error:', err);
        res.status(500).json({ error: 'Database connection failed: ' + err.message });
    }
});

// Record Schema & Model Definition
const recordSchema = new mongoose.Schema({
    time: { type: String, required: true },
    member: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    orNumber: { type: String, default: '' },
    date: { type: String, default: '' },
    createdBy: { type: String, default: 'admin' },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Map _id to id virtual property for front-end compatibility
recordSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

const ReyesGymRecords = mongoose.model('Record', recordSchema);

// Aggregate daily records into monthly breakdown stats
const getMonthlyData = async () => {
    try {
        const data = await ReyesGymRecords.aggregate([
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    sales: { $sum: "$amount" },
                    members: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.day": 1 }
            },
            {
                $project: {
                    _id: 0,
                    day: "$_id.day",
                    sales: 1,
                    members: 1
                }
            }
        ]);
        return data;
    } catch (err) {
        console.error('Error calculating monthly stats:', err);
        return [];
    }
};

// Helper functions
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

// Routes
// 0. Welcome / Fallback check
app.get('/', (req, res) => {
    res.json({ message: 'GymFlow Receptionist API is running. Use /api/health for status check.' });
});

// 1. Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// 2. Fetch daily receptionist records
app.get('/api/records', async (req, res) => {
    try {
        const records = await ReyesGymRecords.find().sort({ createdAt: 1 });
        res.json(records);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: 'Failed to fetch records from database' });
    }
});

// 3. Add a new record
app.post('/api/records', async (req, res) => {
    const { member, type, amount, time, orNumber, date, createdBy } = req.body;

    // Simple validation
    if (!member || !type || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: member, type, amount' });
    }

    try {
        const recordTime = time || formatTime(new Date());
        const recordDate = date || formatDate(new Date());
        const newRecord = new ReyesGymRecords({
            time: recordTime,
            member: String(member).trim(),
            type: String(type).trim(),
            amount: Number(amount),
            orNumber: orNumber ? String(orNumber).trim() : '',
            date: recordDate,
            createdBy: createdBy ? String(createdBy).trim() : 'admin',
        });

        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({ error: 'Failed to create record in database' });
    }
});

// 4. Fetch monthly stats
app.get('/api/monthly-data', async (req, res) => {
    const data = await getMonthlyData();
    res.json(data);
});

// Start server locally (if not running in Serverless environment like Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[GymFlow Test Backend] Running on http://localhost:${PORT}`);
    });
}

module.exports = app;
