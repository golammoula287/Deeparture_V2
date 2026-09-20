const { test } = require('node:test');
const assert = require('node:assert/strict');
test('updated mailer generates local JSON without delivery', async () => {
 const transport = require('nodemailer').createTransport({ jsonTransport: true });
 const result = await transport.sendMail({ from: 'sender@example.test', to: 'recipient@example.test', subject: 'Verification', text: 'Test' });
 assert.equal(JSON.parse(result.message).subject, 'Verification');
});
test('updated ExcelJS UUID dependency supports conditional-formatting workbook roundtrip', async () => {
 const ExcelJS = require('exceljs'); const wb = new ExcelJS.Workbook(); const sheet = wb.addWorksheet('Verification');
 sheet.addRow(['value']); sheet.addRow([42]); sheet.addConditionalFormatting({ ref: 'A2:A2', rules: [{ type: 'dataBar', cfvo: [{ type: 'min' }, { type: 'max' }], color: { argb: 'FF00FF00' } }] });
 const bytes = await wb.xlsx.writeBuffer(); const read = new ExcelJS.Workbook(); await read.xlsx.load(bytes);
 assert.equal(read.worksheets[0].getCell('A2').value, 42);
});
