const mongoose = require('mongoose');
const userModel = require('./schemas/users');

async function cleanupBadUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-C5');
        // Users where email looks like [object Object] (or contains [object)
        const result = await userModel.deleteMany({
            $or: [
                { email: /\[object/ },
                { username: /\[object/ }
            ]
        });
        console.log(`Deleted ${result.deletedCount} bad users.`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupBadUsers();
