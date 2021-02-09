const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const password = process.env.MONGODB_ADMIN_PASS;

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, 
                  {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');
const UserStatus = require('../db/UserStatusModel');

function getUserStatuses(user) {
  return User.count().then(count => {
    console.log(count)
    return UserStatus.find().sort({createdAt: -1}).limit(count).lean();
  });  
}

module.exports = async (req, res) => {
  res.status(200).send(await getUserStatuses());
};


