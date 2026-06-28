const { ReyesGymRecords } = require('../model/recordSchema.model');
const { formatDate, formatTime } = require('../utils/utility');

const addMember = async (req, res) => {
    const { member, type, paymentMethod, amount, time, orNumber, date, createdBy } = req.body;

    if (!member || !type || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: member, type, amount' });
    }

    try {
        const recordTime = time || formatTime(new Date());
        const recordDate = date || formatDate(new Date());

        const createNewRecord = ReyesGymRecords({
            time: recordTime,
            member: String(member).trim(),
            type: String(type).trim(),
            paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'Cash',
            amount: Number(amount),
            orNumber: orNumber ? String(orNumber).trim() : '',
            date: recordDate,
            createdBy: createdBy,
        })
        await createNewRecord.save();
        res.status(201).json({ message: "Member added successfully", data: createNewRecord })
    }
    catch (error) {
        console.error('Error creating record:', error);
        res.status(500).json({ error: 'Failed to create record in database' });
    }
}

module.exports = { addMember }    