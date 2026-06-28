require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || '';
console.log("PORT", PORT)
// Enable CORS for frontend integration
app.use(cors());
app.use(express.json());

const route = express.Router();

const { getDailyData } = require("./src/Analytics/dailyRecords.route");
const { ReyesGymRecords } = require('./src/model/recordSchema.model.js');
const { connectToDatabase } = require('./src/config/db.js');
const { formatDate, formatTime } = require('./src/utils/utility.js')
const { getMonthlyData } = require('./src/Analytics/analytics.js')
const { addMember } = require('./src/Members/members.route.js')


connectToDatabase()

app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        console.error('Database connection middleware error:', err);
        res.status(500).json({ error: 'Database connection failed: ' + err.message });
    }
});

// 2. Fetch daily receptionist records
app.get('/api/records', getDailyData)

app.post('/api/records', addMember)

// 4. Fetch monthly stats
app.get('/api/monthly-data', getMonthlyData);

// Start server locally (if not running in Serverless environment like Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[GymFlow Test Backend] Running on http://localhost:${PORT}`);
    });
}

module.exports = app;
