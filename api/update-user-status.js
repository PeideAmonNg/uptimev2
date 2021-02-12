const https = require('https');

const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

let password = process.env.MONGODB_ADMIN_PASS;
mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');
const UserStatus = require('../db/UserStatusModel');
const FunctionCallLog = require('../db/FunctionCallLog');

function getUserStatus(user) {
  console.log('Getting status for user', user.id);
  return new Promise((resolve, rej) => {
    let isUserOnlineLink = `https://manifest-server.naiadsystems.com/live/s:${user.username}.json?last=load&format=mp4-hls`;
    https.get(isUserOnlineLink, res => {
      let userStatus = res.statusCode == 200 ? 'online' : 'offline';
      console.log('Getting user status', userStatus);
      resolve(userStatus);
    });
  });
  
}

function saveUserStatuses(userStatuses) {
  // write to mongodb
 return UserStatus.insertMany(userStatuses);
}

function getDateObject() {
  let date = new Date();
  let nzdate = new Date(date.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
  console.log(nzdate.toString());
  return {
    utc_datetime: date,
    nz_datetime: nzdate.toString(),
    nz_day: nzdate.getDay(),
    nz_hour: nzdate.getHours(),
    nz_minute: nzdate.getMinutes(),
    nz_second: nzdate.getSeconds()
  };
}

function genUserStatusEntry(user, userStatus) {
  return {
    userid: user.id,
    username: user.username,
    created_at: getDateObject(),
    status: userStatus
  }
}

function logFunctionCall() {
  let funcCall = new FunctionCallLog();
  return funcCall.save();
}

async function updateUserStatus() {
  console.log('In updateUserStatus');
  return new Promise(async resolve => {

    let users = [];
    try{
      console.log('Fetching users');
      users = await User.find({}).lean();
      console.log('Fecthed users');
    } catch (e) {
      console.log('Error', e);
    }
    
    let userStatuses = [];
    
    // Get user requests
    for (let key in users) {

      let user = users[key];

      try {
        let userStatus = await getUserStatus(user);
        userStatuses.push(genUserStatusEntry(user, userStatus));
      } catch (e) {
        console.log('Error getting status for user id ' + user.id, e);
      }
    }
    try {
      await saveUserStatuses(userStatuses);
    } catch (e) {
      console.log('Error saving user statuses', e);
    }
    await logFunctionCall();
    resolve();
  });
  
}

module.exports = async (req, res) => {
  if(req.query.api_key != process.env.API_KEY) {
    return res.status(403).send();
  }

  await updateUserStatus();

  res.status(200).send();
};