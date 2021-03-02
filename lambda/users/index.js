var dayjs = require("dayjs")
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')

const mongoose = require('mongoose');

dayjs.extend(utc);
dayjs.extend(timezone);

let password = process.env.MONGODB_ADMIN_PASS;

mongoose.connect(`mongodb+srv://admin:${password}@cluster0.krz1f.mongodb.net/uptime?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true})
  .catch(error => console.log(error));

mongoose.connection.on('error', err => {
  console.log('err', err);
});

const User = require('./UserModel');
const UserStatus = require('./UserStatusModel');

function index() {
  return User.find({}).lean();
}

function getUserById(userid) {
  return new Promise(async resolve => {
    let user = await User.findOne({id: userid}).lean();
    resolve(user);
    return;
  });
}

function getUserStatusByUsername(username, limit = 50) {

  return new Promise(async resolve => {
    let periodInDays = 7; // fetch user statuses within this period (in days)

    let nzdt = dayjs(new Date()).tz("Pacific/Auckland").subtract(periodInDays, 'day').hour(0);
    let startDate = dayjs.utc(nzdt).format();

    let statuses = await UserStatus.find({username: username, createdAt: {$gte: startDate}}, {createdAt: 1, status: 1, _id: 0}).sort({createdAt: -1}).lean();

    resolve(getDays(statuses));
    return;
  });
}

function getHourMinute(date) {
  let d = new Date(date);
  return `${('0' + d.getHours()).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}`;
}

function getDayMonthYear(ms) {
  return getDayMonth(ms) + '/' + (new Date(ms).getFullYear());
}

function getDayMonth(date) {
  let d = new Date(date);
  let dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
  return dayMonth;  
}

function getDays(statuses) {

  // Model:
  // let res = {
  // 	days : {
  // 		'11/02/2021': {
  // 			hours: {
  // 				'08:00': {
  // 					status: {
  // 						online: 5, 
  // 						offline: 7
  // 					}
  // 				},
  // 				'07:00': {
  // 					status: {
  // 						online: 0,
  // 						offline: 12
  // 					}
  // 				},
  // 				...
  // 			}
  console.log('In getDays()');

  let days = {};

  try {
    for (let s of statuses) {

      let date = new Date((new Date(s.createdAt)).toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
      let dayMonthYear = getDayMonthYear(date);

      if (!(dayMonthYear in days)) {
        days[dayMonthYear] = {};
      }

      let day = days[dayMonthYear];

      if (!('hours' in day)) {
        day['hours'] = {};
      }

      date.setMinutes(0);
      let hourMinute = getHourMinute(date);

      if (!(hourMinute in day.hours)) {
        day.hours[hourMinute] = {
          online: 0,
          offline: 0
        };
      }

      day.hours[hourMinute][s.status] = (day.hours[hourMinute][s.status] || 0) + 1
    }
  } catch (e) {
    console.error('e', e);
  }

  console.log('Returning days');

  return days;
}

async function get(id) {
  try {
    let user = await User.findOne({id: id}).lean();
    let userStatuses = await getUserStatusByUsername(user.username);
    
    return {
      name: user.name,
      username: user.username,
      userStatuses: userStatuses
    };
  } catch (e) {
    console.log(e);
    return {};
  }
}

function create(event) {

  let reqBody = JSON.parse(event.body);

  console.log("Creating user with reqBody: ", reqBody, reqBody.name, reqBody.url);

  // db.on('error', console.error.bind(console, 'connection error:'));
  // db.once('open', function() {
  //   console.log('connection opened');
    
  
  return new Promise(res => {
    let user = new User({
      username: reqBody.username,
      name: reqBody.name,
      url: reqBody.url
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

exports.handler = async (event, context) => {

  console.log('event', event);

  if(event.queryStringParameters.api_key != process.env.API_KEY) {
    return {
      statusCode: 403
    };
  }

  let method = event.httpMethod;
  let userid = event.queryStringParameters.id;

  console.log('httpMethod: ' + method);

  if (method == 'GET') {

    try {

      console.log('Getting user/s');

      let users = userid ? await get(userid) : await index();

      console.log("Fetched users: ", users);

      return {
        statusCode: 200,
        body: JSON.stringify(users),
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      };

    } catch (err) {

      console.log('err', err);

      return {
        statusCode: 500
      };

    }

  } else if (method == 'POST') {

    try {
      let created = await create(event);

      return {
        statusCode: 201,
        body: JSON.stringify(created),
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      };

    } catch (err) {

      return {
        statusCode: 500
      };

    }

  } else if (method == 'DELETE') {

    try {
      let removed = await remove(userid);

      return {
        statusCode: 200,
        body: JSON.stringify(removed),
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      };

    } catch (err) {

      return {
        statusCode: 500
      };

    }
  }
};