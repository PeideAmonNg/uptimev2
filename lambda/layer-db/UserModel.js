const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
  id: Number,
  username: String,
  name: String,
  url: String
}, {timestamps: false, strict: false});

userSchema.plugin(AutoIncrement, {inc_field: 'id'});


let User = mongoose.model('User', userSchema);

module.exports = User;