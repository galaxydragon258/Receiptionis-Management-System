const { ReyesGymRecords } = require("../model/recordSchema.model.js");

const getMonthlyData = async (req, res) => {
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
        console.log("Data", data)
        res.json(data);
    } catch (err) {
        console.error('Error calculating monthly stats:', err);
        res.status(500).json({ error: 'Failed to calculate monthly stats' });
    }
};

module.exports = { getMonthlyData } 