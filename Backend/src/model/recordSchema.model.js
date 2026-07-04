// Record Schema & Model Definition
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    time: { type: String, required: true },
    member: { type: String, required: true },
    type: { type: String, required: true },
    duration: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Cash' },
    amount: { type: Number, required: true },
    orNumber: { type: String, default: '' },
    date: { type: String, default: '' },
    createdBy: { type: String, default: 'admin' },
    expiresAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Map _id to id virtual property for front-end compatibility
recordSchema.virtual('id').get(function () {
    return this._id ? this._id.toString() : '';
});

// Pre-save hook to calculate dynamic expiresAt based on duration
recordSchema.pre('save', function () {
    const baseDate = this.createdAt || new Date();
    const expires = new Date(baseDate);
    const durationStr = this.duration || '';
    
    let monthsToAdd = 2; // Default retention: 2 months
    if (durationStr.includes('12')) {
        monthsToAdd = 13; // 12 + 1 = 13 months
    } else if (durationStr.includes('6')) {
        monthsToAdd = 7; // 6 + 1 = 7 months
    } else if (durationStr.includes('3')) {
        monthsToAdd = 4; // 3 + 1 = 4 months
    }
    
    expires.setMonth(expires.getMonth() + monthsToAdd);
    this.expiresAt = expires;
});

// TTL index to automatically delete records when expiresAt is reached
recordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ReyesGymRecords = mongoose.model('Record', recordSchema);


module.exports = { ReyesGymRecords };