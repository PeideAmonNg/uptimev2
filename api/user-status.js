const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const password = process.env.MONGODB_ADMIN_PASS;

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, 
                  {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');
const UserStatus = require('../db/UserStatusModel');

function getUserStatusToday() {
  // return User.count().then(count => {
  //   console.log(count)
  var todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  var now = new Date();

  return UserStatus.find({createdAt: {$gte: todayStart, $lte: now}}, {username: 1, createdAt: 1, status: 1}).sort({createdAt: -1}).lean();
  // });  
}

function getUserStatusById(userid, limit = 50) {
  return User.findOne({id: userid}, {username: 1}).then(user => {
    if(!user) {
      return Promise.resolve([]);
    }
    return UserStatus.find({username: user.username}, {username: 1, createdAt: 1, status: 1}).sort({createdAt: -1}).limit(limit).lean();
  });
}

module.exports = async (req, res) => {
  if(req.query.api_key != process.env.API_KEY) {
    return res.status(403).send(); 
  }
  let userStasuses = [];
  if(req.query.id) {
    userStasuses = await getUserStatusById(req.query.id);
  } else {
    userStasuses = await getUserStatusToday()
  }

  res.status(200).send(userStasuses);
};