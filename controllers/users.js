let userModel = require('../schemas/users')
module.exports = {
    CreateAnUser: async function (
        username, password, email, role, session,
        fullname, avatarUrl, status, loginCount) {
        let newUser = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullname,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newUser.save({ session });
        return newUser;
    },
    FindUserByUsername: async function (username) {
        return await userModel.findOne({
            username: username,
            isDeleted: false
        })
    },
    FindUserByEmail: async function (email) {
        return await userModel.findOne({
            email: email,
            isDeleted: false
        })
    }, FindUserByToken: async function (token) {
        return await userModel.findOne({
            forgotPasswordToken: token,
            isDeleted: false
        })
    },
    FindUserById: async function (id) {
        try {
            return await userModel.findOne({
                _id: id,
                isDeleted: false
            }).populate('role')
        } catch (error) {
            return false
        }
    },
    ImportUsersFromExcel: async function (filePath) {
        const ExcelJS = require('exceljs');
        const roleModel = require('../schemas/roles');
        const mailHandler = require('../utils/mailHandler');
        const crypto = require('crypto');

        let userRole = await roleModel.findOne({ name: { $regex: /^user$/i } });
        if (!userRole) {
            userRole = new roleModel({ name: 'USER', description: 'Regular User' });
            await userRole.save();
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        const results = [];

        const getCellValue = (cell) => {
            if (cell.value && typeof cell.value === 'object') {
                return cell.value.text || cell.value.result || cell.value.toString();
            }
            return cell.value?.toString() || '';
        };

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            if (!row) continue;
            const username = getCellValue(row.getCell(1));
            const email = getCellValue(row.getCell(2));

            if (username && email) {
                try {
                    const existingUser = await userModel.findOne({ 
                        $or: [{ username: username }, { email: email }] 
                    });

                    if (existingUser) {
                        results.push({ username, email, status: 'skipped', message: 'User already exists' });
                        continue;
                    }

                    const password = crypto.randomBytes(12).toString('base64').slice(0, 16);
                    const newUser = new userModel({
                        username: username,
                        password: password,
                        email: email,
                        role: userRole._id,
                        status: true
                    });

                    await newUser.save();

                    const subject = 'Your Account Credentials';
                    const text = `Hello ${username},\n\nYour account has been created.\nUsername: ${username}\nPassword: ${password}`;
                    const html = `<p>Hello <b>${username}</b>,</p><p>Your account has been created.</p><p><b>Username:</b> ${username}<br><b>Password:</b> ${password}</p>`;
                    
                    await mailHandler.sendMail(email, subject, text, html);
                    results.push({ username, email, status: 'success' });
                } catch (err) {
                    results.push({ username, email, status: 'error', message: err.message });
                }
            }
        }
        return results;
    }
}