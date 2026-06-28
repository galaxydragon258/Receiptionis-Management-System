const { Router } = require("express")
const dashboardRoute = Router()

dashboardRoute.get('/records', async (req, res) => {
    try {
        const records = await ReyesGymRecords.find().sort({ createdAt: 1 });
        res.json(records);
        console.log(records)
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ error: 'Failed to fetch records from database' });
    }
})

module.exports = { dashboardRoute }