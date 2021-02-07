const mongoose = require('mongoose');

const functionCallLogSchema = new mongoose.Schema({
}, { timestamps: true });
let FunctionCallLog = mongoose.model('FunctionCallLog', functionCallLogSchema);

module.exports = FunctionCallLog;