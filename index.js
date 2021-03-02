const https = require('https');
var AWS = require('aws-sdk');

AWS.config.update({ region: 'ap-southeast-2' });
var ddb = new AWS.DynamoDB({ apiVersion: '2021-03-02' });
var docClient = new AWS.DynamoDB.DocumentClient();

function getUserStatus(user, createdat) {
  return new Promise((resolve, rej) => {
    let isUserOnlineLink = `https://manifest-server.naiadsystems.com/live/s:${user.username}.json?last=load&format=mp4-hls`;
    https.get(isUserOnlineLink, res => {
      let userStatus = res.statusCode == 200 ? 'online' : 'offline';

      resolve({
        ...user,
        createdat,
        status: userStatus
      });
    }).on('error', (e) => {
      console.error(`Failed to get user status from naiadsystems for user ${user.id}`, e);
    });;
  });
}

function formatBatch(tablename, items) {
  return params = {
    RequestItems: {
      [tablename]: items
    }
  };
}


function formatStatusesForDDB(statuses) {
  return statuses.map(s => {
    return {
      PutRequest: {
        Item: {
          "userid": { "N": String(s.id) },
          "username": { "S": s.username },
          "createdat": {"S": s.createdat},
          "status": {"S": s.status}
        }
      }
    };
  });
}

function formatUsersLastOnlineForDDB(users) {
  return users.map(function (u) {
    return {
      PutRequest: {
        Item: {
          "userid": { "N": String(u.id) },
          "username": { "S": u.username },
          "createdat": {"S": u.createdat},
        }
      }
    };
  });
}

function saveUserStatuses(statuses) {
  
  statuses = formatStatusesForDDB(statuses);

  console.log(statuses);

  let promises = [];
  for (let i=0; i < statuses.length; i += 25) {
    let thisBatchStatuses = statuses.slice(i, Math.min(i + 25, statuses.length));
    console.log('thisBatchStatuses', thisBatchStatuses.map(s => s.username));
    let batchWrite = ddb.batchWriteItem(formatBatch('userstatus', thisBatchStatuses), function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data);
      }
    });

    promises.push(batchWrite);
  }
  return promises;

}

function genUserStatusEntry(user, userStatus) {
  // return {
  //   userid: user.id,
  //   username: user.username,
  //   createdat: getDateObject(),
  //   status: userStatus
  // }

  return {
    PutRequest: {
      Item: {
        "username": { "S": user.username },
        "userid": { "N": String(user.id) },
        "createdat": { "S": new Date().toUTCString() },
        "status": { "S": userStatus }
      }
    }
  }
}

function updateOnlineUsers(users) {
  if(!users || users.length == 0) {
    console.log("invalid arg " + users);
  }

  users = formatUsersLastOnlineForDDB(users);

  let promises = [];
  for (let i=0; i < users.length; i += 25) {
    let batchWrite = ddb.batchWriteItem(formatBatch('lastonline', users.slice(i, Math.min(i + 25, users.length))), function(err, data) {
      if (err) {
        console.log("lastonline Error", err);
      } else {
        console.log("lastonline Success", data);
      }
    }).promise();

    promises.push(batchWrite);
  }
  return promises;
}

async function updateUserStatus(users) {

  return new Promise(async resolve => {

    let userStatusPromises = [];
    let createdat = new Date().toUTCString();
    users.forEach(user => {
      try {
        userStatusPromises.push(getUserStatus(user, createdat));
      } catch (e) {
        console.error('Error while getting status for user id ' + user.id, e);
      }
    })

    let userStatuses = await Promise.all(userStatusPromises) || [];

    let onlineUsers = userStatuses.filter(us => us.status == 'online');
    console.log(onlineUsers.map(u => u.username).join(','));
    
    Promise.all([...saveUserStatuses(userStatuses), ...updateOnlineUsers(onlineUsers)])
      .then(res => {
        resolve();
      })
  });

}

function getUsers() {
  var params = {
    TableName: "user",
    ProjectionExpression: "id, username"
  };
  
  let users = [];

  return new Promise(resolve => {
    docClient.scan(params, function onScan(err, data) {
      if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("Scan succeeded.");
        users.push(...data.Items);

        // continue scanning if we have more items, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
          console.log("Scanning for more...");
          params.ExclusiveStartKey = data.LastEvaluatedKey;
          docClient.scan(params, onScan);
        } else {
          resolve(users);
        }
      }
    });
  });
}

exports.handler = handler;

async function handler(event, context) {
  try {
    await updateUserStatus(await getUsers());
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500
    }
  }

  return {
    statusCode: 200
  }
};