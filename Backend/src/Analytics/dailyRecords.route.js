const { ReyesGymRecords } = require("../model/recordSchema.model");
const getDailyData = async (req, res) => {
    try {
        const data = await ReyesGymRecords.find().sort({ createdAt: 1 });
        res.json(data)
        console.log("DATA", data)
    } catch (err) {
        console.error("Failed to get daily data", err);
        res.status(500).json({ error: "Failed to get daily data: " + err.message, stack: err.stack })
    }

}


module.exports = { getDailyData }

