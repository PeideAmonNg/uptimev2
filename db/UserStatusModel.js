const mongoose = require('mongoose');
// const autoIncrement = require('mongoose-auto-increment');

const userStatusSchema = new mongoose.Schema({
  userid: Number,
  username: String,
  status: String
},  { strict: false, timestamps: true });

let UserStatus = mongoose.model('UserStatus', userStatusSchema);

module.exports = UserStatus;