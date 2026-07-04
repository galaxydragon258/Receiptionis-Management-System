const { ReyesGymRecords } = require('../model/recordSchema.model.js');
const { formatDate, formatTime } = require('../utils/utility.js');

const addMember = async (req, res) => {
    const { member, type, paymentMethod, amount, time, orNumber, date, createdBy, duration } = req.body;

    if (!member || !type || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: member, type, amount' });
    }

    try {
        const recordTime = time || formatTime(new Date());
        const recordDate = date || formatDate(new Date());

        // Validate and normalize OR Number
        let cleanOrNumber = '';
        let orExists = false;

        if (orNumber && String(orNumber).trim()) {
            cleanOrNumber = String(orNumber).trim();

            // Convert 5-digit plain number to OR-12345
            if (/^\d{5}$/.test(cleanOrNumber)) {
                cleanOrNumber = `OR-${cleanOrNumber}`;
            }

            // Check if this OR already exists
            const existingRecord = await ReyesGymRecords.findById(cleanOrNumber);
            if (existingRecord) {
                orExists = true;
            }
        }

        const recordFields = {
            time: recordTime,
            member: String(member).trim(),
            type: String(type).trim(),
            duration: duration ? String(duration).trim() : '',
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