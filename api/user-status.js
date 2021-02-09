const mongoose = require('mongoose');

const password = process.env.MONGODB_ADMIN_PASS;

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, 
                  {useNewUrlParser: true, useUnifiedTopology: true});

const UserStatus = require('../db/UserStatusModel');

function getUserStatuses(user) {
  return UserStatus.find({status: 'online'}).sort({createdAt: -1}).limit(50).lean();
}

module.exports = async (req, res) => {
  res.status(200).send(await getUserStatuses());
};


