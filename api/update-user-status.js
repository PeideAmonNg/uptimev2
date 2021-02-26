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

let userCount = 0;

function getUserStatus(user) {
  return new Promise((resolve, rej) => {
    let isUserOnlineLink = `https://manifest-server.naiadsystems.com/live/s:${user.username}.json?last=load&format=mp4-hls`;
    https.get(isUserOnlineLink, res => {
      let userStatus = res.statusCode == 200 ? 'online' : 'offline';
      
      userCount++;
      console.log(`Fetched user status for user #${userCount}`);

      resolve(genUserStatusEntry(user, userStatus));
    }).on('error', (e) => {
      console.error(`Failed to get user status from naiadsystems for user ${user.id}`, e);
    });;
  });
  
}

function saveUserStatuses(userStatuses) {
  // write to mongodb
 return UserStatus.insertMany(userStatuses);
}

function getDateObject() {
  let date = new Date();
  let nzdate = new Date(date.toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
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

  userCount = 0;

  return new Promise(async resolve => {
  
    let startTime = new Date().getTime();

    let users = [];
    try{
      users = await User.find({}).lean();
      console.log(`Fetched ${users.length} users from DB`);
    } catch (e) {
      console.error('Failed to get users from DB', e);
    }
    
    let userStatusPromises = [];
    
    // Get user requests
    for (let key in users) {

      let user = users[key];

      try {
        userStatusPromises.push(getUserStatus(user));
      } catch (e) {
        console.error('Error while getting status for user id ' + user.id, e);
      }
    }

    let userStatuses = await Promise.all(userStatusPromises) || [];

    try {
      await saveUserStatuses(userStatuses);
    } catch (e) {
      console.error('Error saving user statuses', e);
    }

    await logFunctionCall();

    let elapsed = (new Date().getTime() - startTime) / 1000;

    console.error(`Updating user status took ${Math.round(elapsed)} seconds`)

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
