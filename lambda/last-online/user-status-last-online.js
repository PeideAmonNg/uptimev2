const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const password = process.env.MONGODB_ADMIN_PASS;

console.error('password 1 is: ' + password); // terrible, remove later

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, 
                  {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');
const UserStatus = require('../db/UserStatusModel');

function getUserStatuses() {
  return User.count().then(count => {
    console.log(count)
    return UserStatus.find().sort({createdAt: -1}).limit(count).lean();
  });  
}

function getEachUserLastOnline() {
  return UserStatus.aggregate([
    {$match: {status: 'online'}},
    {
      $sort: {
        createdAt: 1
      }
    },
    { 
      $group: { 
        _id: '$username',
        createdAt: { $last: '$createdAt' },
        status: { $last: '$status' },
        userid: { $last: '$userid' }
      }
    },
    {
      $project: {        
        _id: 0,
        username: '$_id',
        userid: 1,
        createdAt: 1,
        status: 1
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    }
  ])
}

function getLastUpdatedStatus() {
  return UserStatus.find().sort({createdAt: -1}).limit(1).lean();
}

module.exports = async (req, res) => {
  if(req.query.api_key != process.env.API_KEY) {
    return res.status(403).send();
  }
  
  console.error('password 2 is: ' + password); // terrible, remove later

  let lastUpdated = await getLastUpdatedStatus();
  let obj = {
    lastUpdated: lastUpdated.length > 0 ? lastUpdated[0].createdAt : '',
    userStatuses: await getEachUserLastOnline()
  }
  res.status(200).send(obj);
};
