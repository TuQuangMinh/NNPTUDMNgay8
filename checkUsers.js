const mongoose = require('mongoose');
const userModel = require('./schemas/users');

async function checkUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-C5');
        const count = await userModel.countDocuments();
        console.log(`Total users in DB: ${count}`);
        
        const latestUsers = await userModel.find().sort({ createdAt: -1 }).limit(5);
        latestUsers.forEach(u => {
            console.log(`Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
