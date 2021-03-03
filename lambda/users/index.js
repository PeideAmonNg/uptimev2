const { DynamoDBClient, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const client = new DynamoDBClient({ region: "ap-southeast-2" });

var dayjs = require("dayjs")
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc);
dayjs.extend(timezone);

function index() {
  var params = {
    TableName: "user",
    ProjectionExpression: "id, username"
  };

  return new Promise(async (resolve, reject) => {
    try {
      const data = await client.send(new ScanCommand(params));
      resolve(data.Items.map(i => unmarshall(i)));
    } catch (error) {
      console.error('Error with index() user scan command', error);
      reject();
    }
  })
}

function getUserStatusByUsername(username) {
  return new Promise(async (resolve, reject) => {
    let periodInDays = 7; // fetch user statuses within this period (in days)

    let nzdt = dayjs(new Date()).tz("Pacific/Auckland").subtract(periodInDays, 'day').hour(0);
    let startDate = dayjs.utc(nzdt).format();

    var params = {
      TableName: "userstatus",
      ProjectionExpression: "createdat, #S",
      ExpressionAttributeValues: {
        ':username': {'S': username},
        ':createdat': {'S': startDate},
       },
      ExpressionAttributeNames: {
        "#S": 'status'
      },
     KeyConditionExpression: 'username = :username and createdat > :createdat'
    };

    try {
      const data = await client.send(new QueryCommand(params));
      let items = data.Items.map(i => unmarshall(i));
      let statuses = getDays(items);
      resolve(statuses);
    } catch (error) {
      console.error('Error with getUserStatusByUsername query command', error);
      reject(error);
    }
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

  let days = {};

  try {
    for (let s of statuses) {

      let date = new Date((new Date(s.createdat)).toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
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
    console.error('Error with getDays()', e);
  }

  return days;
}

function getUsernameById(id) {
  var params = {
    TableName: "user",
    ProjectionExpression: "username",
    ExpressionAttributeValues: {
      ':id': {N: String(id)},
    },
    KeyConditionExpression: 'id = :id',
  };

  return new Promise(async (resolve, reject) => {
    try {
      let data = await client.send(new QueryCommand(params));
      resolve(unmarshall(data.Items[0]).username);
    } catch (error) {
      console.error('Error with getUsernameById query command', error);
      reject(error);
    }
  });
}

async function getUserById(userid) {
  try {
    let username = await getUsernameById(userid);
    let userStatuses = await getUserStatusByUsername(username);
    
    return {
      name: '<placeholder name>',
      username: username,
      userStatuses: userStatuses
    };
  } catch (e) {
    console.error("Error getting user by id", e);
    return {};
  }
}

function create(event) {

  let reqBody = JSON.parse(event.body);

  console.log("Creating user with req.body: ", reqBody);
  
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

  if (method == 'GET') {

    try {

      console.log('Fetching user/s');

      let users = userid ? await getUserById(userid) : await index();

      console.log("Fetched user/s: ", users);

      return {
        statusCode: 200,
        body: JSON.stringify(users),
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      };

    } catch (err) {

      console.error('Error with GET request', err);

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

      console.error('Error with POST request', err);

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

      console.error('Error with DELETE request', err);

      return {
        statusCode: 500
      };

    }
  }
};