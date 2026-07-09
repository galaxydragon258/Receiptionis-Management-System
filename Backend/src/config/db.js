const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || '';
const isPlaceholderUri = MONGODB_URI ? (MONGODB_URI.includes('<username>') || MONGODB_URI.includes('<password>')) : true;
console.log(isPlaceholderUri)

let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (!MONGODB_URI || isPlaceholderUri) {
        console.warn('\n⚠️  [GymFlow Database Warning] MONGODB_URI is not set or contains placeholders (<username>/<password>).');
        console.warn('⚠️  Please configure your database connection inside Backend/.env or Vercel Environment Variables.');
        console.warn('⚠️  Attempting to connect to local MongoDB database fallback if available...\n');
        cachedConnection = await mongoose.connect('mongodb://localhost:27017/gymflow');
        return cachedConnection;
    }

    try {
        cachedConnection = await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB database successfully.');
        return cachedConnection;
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        throw err;
    }
}

module.exports = { connectToDatabase };
