const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
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

const { getDailyData } = require("./src/Analytics/dailyRecords.route.js");
const { connectToDatabase } = require('./src/config/db.js');
const { getMonthlyData } = require('./src/Analytics/analytics.js')
const { addMember } = require('./src/members/members.route.js')


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

app.get('/api/records', getDailyData)
app.post('/api/records', addMember)
app.get('/api/monthly-data', getMonthlyData);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[GymFlow Test Backend] Running on http://localhost:${PORT}`);
    });
}

module.exports = app;
