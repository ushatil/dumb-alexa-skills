/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
'use strict';

const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');

const APP_ID = undefined;  // TODO replace with optional env var, default undefined
const tableName = ''; // TODO replace with env var
const CANNOT_UNDERSTAND_PRIMARY_NAME = // TODO replace with optinoal env var with default

const dynamo = new AWS.DynamoDB();

function emitCouldNotUnderstand(emitter) {
  var queryParams = {
    TableName: tableName,
    KeyConditionExpression:"#primaryName = :primaryName",
    ExpressionAttributeNames: {
      "#primaryName": "primaryName"
    },
    ExpressionAttributeValues: {
      ':primaryName': {"S": CANNOT_UNDERSTAND_PRIMARY_NAME}
    }
  };
  dynamo.query(queryParams, function(err, data) {
    if (err) {
      console.log(err);
      sayMessage(emitter, 'Error encountered while querying Dynamo DB');
      return;
    }
    console.log('Retrieved data from DynamoDB: ' + data);
    var items = data.Items;
    
    if (items.length != 1) {
      console.log('CRITICAL Found multiple items for single key');
    }
    
    var item = items[0];
    var message = getNextMessageAndPushToBack(item);
    sayMessageAndUpdateItem(emitter, message, item);
  });
}

function sayMessage(emitter, message) {
  console.log('Emitting: ' + message);
  emitter.emit(':tell', message);
}

function sayMessageAndUpdateItem(emitter, message, item) {
  var queryParams = {
    TableName: tableName,
    Item: item
  };
  dynamo.putItem(queryParams, function(err, data) {
    if (err) {
      console.log("Error: " + err);
      sayMessage(emitter, 'Failed writing data to DynamoDB');
      return;
    }
    sayMessage(emitter, message);
  });
}

function getNextMessageAndPushToBack(item) {
  var possibleMessages = item.messages;
  var index = Math.floor(Math.random() * (possibleMessages['L'].length - 1)); // Any item except last
  var message = possibleMessages['L'][index]['S'];
  // Move that item into the last position
  possibleMessages['L'].push(possibleMessages['L'].splice(index, 1)[0]);
  console.log('Selected message: ' + message);
  console.log('Rearranged messages array to: ' + possibleMessages);
  item.messages = possibleMessages; // Not sure about JS pass-by-value versus pass-by-reference. May not be needed
  return message
}

function sayFriendNameIfExists(emitter, name) {
  dynamo.scan({TableName: tableName}, function(err, data) {
    if (err) {
        console.log('Error: ' + err);
        emitter.emit(':tell', 'Error encountered while scanning Dynamo DB');
        return;
    }
    
    console.log('Retrived data from DynamoDB: ' + data);
    var items = data.Items;
    
    console.log('User provided name ' + name);
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
        var namePronounciations = item.namePronounciations.SS;
        var possibleMessages = item.messages;
        console.log('Name Pronounciations: ' + namePronounciations);
        console.log('Possible messages: ' + JSON.stringify(possibleMessages));
        
        var message;
        var needToUpdateItem = false;
        if (possibleMessages.length == 1) {
          message = possibleMessages['L'][0]['S'];
        } else {
          message = getNextMessageAndPushToBack(item);
          needToUpdateItem = true;
          
        }
        for (var j = 0; j < namePronounciations.length; j++) {
            console.log('Checking against name pronounciations: ' + JSON.stringify(namePronounciations[j]));
            if (name.toLowerCase() == namePronounciations[j].toLowerCase()) {
                console.log('Found match for name: ' + namePronounciations[j]);
                if (needToUpdateItem) {
                    sayMessageAndUpdateItem(emitter, message, item);
                } else {
                    sayMessage(emitter, message);
                }
                return;
            }
        }
    }
    // TODO: Prompt the user to add the record
    emitCouldNotUnderstand(emitter);
  });
}

const handlers = {
    'LaunchRequest': function () {
        console.log('LaunchRequest Handler');
        this.emit('FriendFacts');
    },
    'FriendFacts': function () {
        var intentObject = this.event.request.intent;
        var emitter = this;
        console.log('FriendFacts Handler');
        console.log('ItentObject: ' + JSON.stringify(intentObject));
        if (!intentObject || !intentObject.slots || !intentObject.slots.FriendName || !intentObject.slots.FriendName.value) {
            emitCouldNotUnderstand(emitter);
            return;
         }
        
        var providedName = intentObject.slots.FriendName.value;
                
        sayFriendNameIfExists(emitter, providedName);
    }
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    //alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
