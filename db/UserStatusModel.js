const mongoose = require('mongoose');
// const autoIncrement = require('mongoose-auto-increment');

const userStatusSchema = new mongoose.Schema({
  username: String,
  status: String,
  created_at: {
    utc_datetime: Date,
    nz_datetime: Date,
    nz_day: Number,
    nz_hour: Number,
    nz_minute: Number,
    nz_second: Number
  }
},  { timestamps: true });

let UserStatus = mongoose.model('UserStatus', userStatusSchema);

module.exports = UserStatus;