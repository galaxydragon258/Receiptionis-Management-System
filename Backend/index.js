require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';
console.log("PORT", PORT)
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
connectToDatabase()
    .then(async () => {
        try {
            const result = await seedDatabase(false);
            if (result.count > 0) {
                console.log(`ℹ️ [Database Auto-Seeder] Seeded ${result.count} records automatically.`);
            }
        } catch (seedErr) {
            console.error('❌ Failed to run database auto-seeder:', seedErr.message);
        }
    })
    .catch(err => {
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
    paymentMethod: { type: String, default: 'Cash' },
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

// TTL index to automatically delete records older than 2 months (60 days)
recordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5184000 });

const ReyesGymRecords = mongoose.model('Record', recordSchema);

// Helper to seed database with realistic check-in records
async function seedDatabase(clearBeforeSeed = false) {
    if (clearBeforeSeed) {
        await ReyesGymRecords.deleteMany({});
    }

    const count = await ReyesGymRecords.countDocuments();
    if (count > 0 && !clearBeforeSeed) {
        return { count, message: 'Database already has records.' };
    }

    const FIRST_NAMES = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Manuel', 'Carlos', 'Teresa', 'David', 'Lourdes', 'John', 'Sarah', 'Michael', 'Emma', 'Robert', 'Olivia', 'William', 'Sophia', 'Richard', 'Isabella'];
    const LAST_NAMES = ['Dela Cruz', 'Santos', 'Reyes', 'Gonzales', 'Bautista', 'Garcia', 'Cruz', 'Flores', 'Mendoza', 'Aquino', 'Ramos', 'Castro', 'Perez', 'Villanueva', 'Santiago', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'];
    const TYPES = ['Monthly', 'Walk-in', 'Personal Training'];
    const METHODS = ['Cash', 'GCash', 'Bank Transfer'];
    const CREATORS = ['admin', 'receptionist_mark', 'receptionist_jen'];

    const recordsToInsert = [];
    const uniqueNames = new Set();

    // Generate ~45 unique member names
    while (uniqueNames.size < 45) {
        const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        uniqueNames.add(`${fn} ${ln}`);
    }

    const memberNames = Array.from(uniqueNames);
    const today = new Date();

    memberNames.forEach((member, index) => {
        // Assign a membership category to this member to ensure all states are covered
        // 0-14: Active (paid 1-20 days ago)
        // 15-24: Expiring Soon (paid 23-29 days ago)
        // 25-34: Expired (paid 31-60 days ago)
        // 35-44: Walk-ins (day pass, paid 0-5 days ago)

        let statusCategory = 'active';
        if (index >= 15 && index < 25) statusCategory = 'expiring';
        else if (index >= 25 && index < 35) statusCategory = 'expired';
        else if (index >= 35) statusCategory = 'walkin';

        const type = statusCategory === 'walkin' ? 'Walk-in' : (Math.random() > 0.3 ? 'Monthly' : 'Personal Training');
        const paymentMethod = METHODS[Math.floor(Math.random() * METHODS.length)];
        const createdBy = CREATORS[Math.floor(Math.random() * CREATORS.length)];
        const amount = type === 'Monthly' ? 2100 : type === 'Walk-in' ? 500 : 1200;
        const time = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`;

        let daysAgo = 0;
        if (statusCategory === 'active') {
            daysAgo = Math.floor(Math.random() * 20) + 1; // 1 to 20 days ago
        } else if (statusCategory === 'expiring') {
            daysAgo = Math.floor(Math.random() * 7) + 23; // 23 to 29 days ago
        } else if (statusCategory === 'expired') {
            daysAgo = Math.floor(Math.random() * 14) + 31; // 31 to 44 days ago
        } else {
            daysAgo = Math.floor(Math.random() * 5); // 0 to 4 days ago
        }

        const recordDate = new Date(today);
        recordDate.setDate(today.getDate() - daysAgo);

        // Sometimes add historical records for the same member to show history
        if ((statusCategory === 'active' || statusCategory === 'expiring') && Math.random() > 0.4) {
            // Add a previous payment 20 days prior to the latest payment
            const prevDate = new Date(recordDate);
            prevDate.setDate(recordDate.getDate() - 20);

            recordsToInsert.push({
                time: '10:15 AM',
                member,
                type,
                paymentMethod: METHODS[Math.floor(Math.random() * METHODS.length)],
                amount,
                orNumber: `OR-${Math.floor(Math.random() * 90000) + 10000}`,
                date: prevDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                createdBy: CREATORS[Math.floor(Math.random() * CREATORS.length)],
                createdAt: prevDate
            });
        }

        recordsToInsert.push({
            time,
            member,
            type,
            paymentMethod,
            amount,
            orNumber: `OR-${Math.floor(Math.random() * 90000) + 10000}`,
            date: recordDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            createdBy,
            createdAt: recordDate
        });
    });

    await ReyesGymRecords.insertMany(recordsToInsert);
    return { count: recordsToInsert.length, message: 'Successfully seeded database.' };
}

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
    const { member, type, paymentMethod, amount, time, orNumber, date, createdBy } = req.body;

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
            paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'Cash',
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

// 5. Seed database
app.post('/api/seed', async (req, res) => {
    try {
        const clear = req.query.clear === 'true' || req.body?.clear === true;
        const result = await seedDatabase(clear);
        res.json(result);
    } catch (error) {
        console.error('Error seeding database:', error);
        res.status(500).json({ error: 'Failed to seed database: ' + error.message });
    }
});

// Start server locally (if not running in Serverless environment like Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[GymFlow Test Backend] Running on http://localhost:${PORT}`);
    });
}

module.exports = app;
