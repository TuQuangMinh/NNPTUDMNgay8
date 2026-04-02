const ExcelJS = require('exceljs');
const path = require('path');

async function checkExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '..', 'user.xlsx');
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    
    console.log('Worksheet Name:', worksheet.name);
    worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
        if (rowNumber === 1) {
            console.log('Row 1 (Header):', row.values);
        } else if (rowNumber <= 5) {
            console.log(`Row ${rowNumber}:`, row.values);
        }
    });
}

checkExcel().catch(err => console.error(err));
