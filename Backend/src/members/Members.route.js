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
        const cleanOrNumber = orNumber ? String(orNumber).trim() : '';

        if (cleanOrNumber) {
            const existingRecord = await ReyesGymRecords.findById(cleanOrNumber);
            if (existingRecord) {
                return res.status(400).json({ error: 'OR Number already exists' });
            }
        }

        const recordFields = {
            time: recordTime,
            member: String(member).trim(),
            type: String(type).trim(),
            paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'Cash',
            amount: Number(amount),
            orNumber: cleanOrNumber,
            date: recordDate,
            createdBy: createdBy,
        };

        if (cleanOrNumber) {
            recordFields._id = cleanOrNumber;
        }

        const createNewRecord = new ReyesGymRecords(recordFields);
        await createNewRecord.save();
        res.status(201).json({ message: "Member added successfully", data: createNewRecord });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'OR Number already exists' });
        }
        console.error('Error creating record:', error);
        res.status(500).json({ error: 'Failed to create record in database' });
    }
}

module.exports = { addMember }