var dayjs = require("dayjs")
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')

const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

dayjs.extend(utc);
dayjs.extend(timezone);

const password = process.env.MONGODB_ADMIN_PASS;

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, 
                  {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');
const UserStatus = require('../db/UserStatusModel');


module.exports = async (req, res) => {
  if(req.query.api_key != process.env.API_KEY) {
    return res.status(403).send(); 
  }
};