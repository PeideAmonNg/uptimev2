// var AWS = require('aws-sdk');

// AWS.config.update({ region: 'ap-southeast-2' });
// var ddb = new AWS.DynamoDB({ apiVersion: '2021-03-02' });
// var docClient = new AWS.DynamoDB.DocumentClient();

const { DynamoDBClient, ScanCommand, } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

const client = new DynamoDBClient({ region: "ap-southeast-2" });


async function getUsersLastOnline() {
  var params = {
    TableName: "lastonline",
    ProjectionExpression: "userid, username, createdat"
  };

  return new Promise(async (resolve, reject) => {
    try {
      const data = await client.send(new ScanCommand(params));
      let users = data.Items.map(i => unmarshall(i));
      users = users.map(u => {
        u.createdat = new Date(u.createdat);
        return u;
      });
      users = users.sort((a, b) => a.createdat > b.createdat ? -1 : 1);
      resolve(users);
    } catch (error) {
      console.log('Error with scan command', error);
      reject();
    }
  })
}

exports.handler = async function handler(event, context) {
  console.log('event', event);
  if(event.queryStringParameters.api_key != process.env.API_KEY) {
    return {
      statusCode: 403
    }
  }
  
  let res = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": String(process.env.ALLOWED_ORIGIN)
    },
    body: JSON.stringify({
      userStatuses: await getUsersLastOnline()
    })
  }

  console.log(res);

  return res;
};

getUsersLastOnline()