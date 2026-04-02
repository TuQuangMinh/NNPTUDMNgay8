const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const userModel = require('../schemas/users');
const roleModel = require('../schemas/roles');
const mailHandler = require('./mailHandler');
const crypto = require('crypto');

// MongoDB Connection URI - from app.js
const MONGO_URI = 'mongodb://localhost:27017/NNPTUD-C5';

function generateRandomPassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

async function importUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find the "user" role
        let userRole = await roleModel.findOne({ name: { $regex: /^user$/i } });
        if (!userRole) {
            console.log('Role "user" not found, creating it...');
            userRole = new roleModel({ name: 'USER', description: 'Regular User' });
            await userRole.save();
        }

        const workbook = new ExcelJS.Workbook();
        const filePath = path.join(__dirname, '..', 'user.xlsx');
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        const usersToImport = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            // ExcelJS cell values can be strings, numbers, objects (links/formulas)
            const getCellValue = (cell) => {
                if (cell.value && typeof cell.value === 'object') {
                    return cell.value.text || cell.value.result || cell.value.toString();
                }
                return cell.value?.toString() || '';
            };

            const username = getCellValue(row.getCell(1));
            const email = getCellValue(row.getCell(2));

            if (username && email) {
                usersToImport.push({ username, email });
            }
        });

        console.log(`Found ${usersToImport.length} users to import.`);

        for (const userData of usersToImport) {
            try {
                // Check if user already exists
                const existingUser = await userModel.findOne({ 
                    $or: [{ username: userData.username }, { email: userData.email }] 
                });

                if (existingUser) {
                    console.log(`User ${userData.username} or email ${userData.email} already exists. Skipping.`);
                    continue;
                }

                const password = generateRandomPassword(16);
                const newUser = new userModel({
                    username: userData.username,
                    password: password, // Schema has pre-save hook to hash this
                    email: userData.email,
                    role: userRole._id,
                    status: true // Active by default
                });

                await newUser.save();
                console.log(`Created user: ${userData.username}`);

                // Send email
                const subject = 'Your Account Credentials';
                const text = `Hello ${userData.username},\n\nYour account has been created.\nUsername: ${userData.username}\nPassword: ${password}\n\nPlease login and change your password.`;
                const html = `<p>Hello <b>${userData.username}</b>,</p><p>Your account has been created.</p><p><b>Username:</b> ${userData.username}<br><b>Password:</b> ${password}</p><p>Please login and change your password.</p>`;
                
                await mailHandler.sendMail(userData.email, subject, text, html);
                console.log(`Email sent to: ${userData.email}`);

            } catch (err) {
                console.error(`Error importing user ${userData.username}:`, err.message);
            }
        }

        console.log('Import process completed.');
    } catch (err) {
        console.error('Import failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

importUsers();
