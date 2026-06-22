require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

// Database Connection
const isPlaceholderUri = MONGODB_URI ? (MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>')) : true;

if (!MONGODB_URI || isPlaceholderUri) {
    console.warn('\n⚠️  [GymFlow Database Warning] MONGODB_URI is not set or contains placeholders (<username>/<password>).');
    console.warn('⚠️  Please configure your database connection inside Backend/.env to connect to MongoDB Atlas.');
    console.warn('⚠️  Attempting to connect to local MongoDB database fallback if available...\n');
}

mongoose.connect((!MONGODB_URI || isPlaceholderUri) ? 'mongodb://localhost:27017/gymflow' : MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB database successfully.');
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        console.error('💡 Please verify your MongoDB connection string in Backend/.env');
    });

// Record Schema & Model Definition
const recordSchema = new mongoose.Schema({
    time: { type: String, required: true },
    member: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
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

const getMonthlyData = async () => {
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
    console.log(data)
    return data
};

getMonthlyData();
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
}

// Routes
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
    const { member, type, amount, time } = req.body;

    // Simple validation
    if (!member || !type || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: member, type, amount' });
    }

    try {
        const recordTime = time || formatTime(new Date());
        const newRecord = new ReyesGymRecords({
            time: recordTime,
            member: String(member).trim(),
            type: String(type).trim(),
            amount: Number(amount),
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

// Start server
app.listen(PORT, () => {
    console.log(`[GymFlow Test Backend] Running on http://localhost:${PORT}`);
});
