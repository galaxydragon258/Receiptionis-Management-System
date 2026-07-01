// Record Schema & Model Definition
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    time: { type: String, required: true },
    member: { type: String, required: true },
    type: { type: String, required: true },
    paymentMethod: { type: String, default: 'Cash' },
    amount: { type: Number, required: true },
    orNumber: { type: String, default: '' },
    date: { type: String, default: '' },
    createdBy: { type: String, default: 'admin' },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Map _id to id virtual property for front-end compatibility
recordSchema.virtual('id').get(function () {
    return this._id ? this._id.toString() : '';
});

// TTL index to automatically delete records older than 2 months (60 days)
recordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 5184000 });

const ReyesGymRecords = mongoose.model('Record', recordSchema);


module.exports = { ReyesGymRecords };