const { ReyesGymRecords } = require("../model/recordSchema.model.js");

const getMonthlyData = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const data = await ReyesGymRecords.aggregate([
            {
                $match: {
                    $or: [
                        { recordDate: { $gte: startOfMonth, $lt: endOfMonth } },
                        {
                            recordDate: { $exists: false },
                            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        day: {
                            $dayOfMonth: { $ifNull: [ "$recordDate", "$createdAt" ] }
                        }
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
        res.status(500).json({ error: 'Failed to calculate monthly stats: ' + err.message, stack: err.stack });
    }
};

module.exports = { getMonthlyData } 