const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

// In-memory database initialized with sample data
let dailyRecords = [
    { id: 1, time: '06:15 AM', member: 'Juan Dela Cruz', type: 'Monthly', amount: 1500 },
    { id: 2, time: '07:30 AM', member: 'Maria Santos', type: 'Walk-in', amount: 100 },
    { id: 3, time: '08:00 AM', member: 'Carlos Reyes', type: 'Monthly', amount: 1500 },
    { id: 4, time: '09:45 AM', member: 'Ana Garcia', type: 'Walk-in', amount: 100 },
    { id: 5, time: '10:20 AM', member: 'Pedro Mendoza', type: 'Personal Training', amount: 800 },
    { id: 6, time: '11:00 AM', member: 'Sofia Villanueva', type: 'Monthly', amount: 1500 },
    { id: 7, time: '12:30 PM', member: 'Marco Tan', type: 'Walk-in', amount: 100 },
    { id: 8, time: '01:15 PM', member: 'Isabella Cruz', type: 'Monthly', amount: 1500 },
    { id: 9, time: '02:00 PM', member: 'Rafael Aquino', type: 'Personal Training', amount: 800 },
    { id: 10, time: '03:30 PM', member: 'Camille Lim', type: 'Walk-in', amount: 100 },
];

// Generate consistent monthly breakdown for mock analysis
const monthlyData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    sales: Math.floor(Math.random() * 6000) + 2000,
    members: Math.floor(Math.random() * 20) + 5,
}));

// Helpers
function formatTime(date) {
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
app.get('/api/records', (req, res) => {
    res.json(dailyRecords);
});

// 3. Add a new record
app.post('/api/records', (req, res) => {
    const { member, type, amount, time } = req.body;

    // Simple validation
    if (!member || !type || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: member, type, amount' });
    }

    const recordTime = time || formatTime(new Date());
    const nextId = dailyRecords.length > 0 ? Math.max(...dailyRecords.map(r => r.id)) + 1 : 1;

    const newRecord = {
        id: nextId,
        time: recordTime,
        member: String(member).trim(),
        type: String(type).trim(),
        amount: Number(amount),
    };

    dailyRecords.push(newRecord);
    res.status(201).json(newRecord);
});

// 4. Fetch monthly stats
app.get('/api/monthly-data', (req, res) => {
    res.json(monthlyData);
});

// Start server
app.listen(PORT, () => {
    console.log(`[GymFlow Test Backend] Running on http://localhost:${PORT}`);
});
