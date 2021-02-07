const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  name: String,
  url: String
});
userSchema.plugin(autoIncrement.plugin, {model:"User", field: "id"});


let User = mongoose.model('User', userSchema);

module.exports = User;