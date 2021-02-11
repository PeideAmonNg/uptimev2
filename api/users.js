const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

let password = process.env.MONGODB_ADMIN_PASS;
mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
autoIncrement.initialize(db);

const User = require('../db/UserModel');

// const userSchema = new mongoose.Schema({
//   id: Number,
//   username: String,
//   name: String,
//   url: String
// });
// userSchema.plugin(autoIncrement.plugin, {model:"User", field: "id"});

// const User = mongoose.model('User', userSchema);


console.log('connected');
function index() {
  return User.find({}).lean();
}

function get(id) {
  console.log("Get user id " + id);
  return {
    id: id,
    name: 'foo'
  };
}

function create(req) {
  console.log("Creating user. req.body: ", req.body, req.body.name, req.body.url);

  // db.on('error', console.error.bind(console, 'connection error:'));
  // db.once('open', function() {
  //   console.log('connection opened');
    

  return new Promise(res => {
    let user = new User({
      username: req.body.username,
      name: req.body.name,
      url: req.body.url
    });

    user.save(function (err, saved) {
      if (err) {
        return console.error(err);
      } else {      
        res(saved);
      }
    });
  });
}

function remove(id) {
  return  "Successfully removed user id " + id;
}

module.exports = async (req, res) => {
  if(req.query.api_key != process.env.API_KEY) {
    return res.status(403).send();  
  }
  
  let method = req.method;
  let userid = req.query.id;

  if (method == 'GET') {

    let users = userid ? get(userid) : await index();
    console.log("get users: ", users);
    res.status(200).json(users);

  } else if (method == 'POST') {

    res.status(201).send(await create(req));

  } else if (method == 'DELETE') {

    res.status(200).send(remove(userid));

  }

};

