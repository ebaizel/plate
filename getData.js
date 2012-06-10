var mongo = require('mongodb');
var Db = require('mongodb').Db,
  Connection = require('mongodb').Connection,
  Server = require('mongodb').Server,
  BSON = require('mongodb').BSONNative;

// Get the objectID type
var ObjectID = require('mongodb').ObjectID;

var fs = require('fs');
//var dbname = 'plate';

var host = GLOBAL.mongoHost;
var port = GLOBAL.mongoPort;
var dbname = GLOBAL.mongoDBName;

//var localstr = "mongodb://mongo:r1sky@ds033757.mongolab.com:33757/heroku_app5057630";
var localstr = "mongodb://localhost:27017/plate";
//var localstr = GLOBAL.mongoConnString;

// ###  INTERNAL WORKER METHODS

//Generic function to fetch an object by its ObjectId
var getObjectById = function(objectId, collection, nextFn) {
	console.log("in fetchObjectById for objectID " + objectId + " and collection: " + collection);
	var queryParams = {};
	queryParams['_id'] = new ObjectID(objectId);
	runQuery(collection, queryParams, null, function(err, results) {
		console.log('object retrieved was: ' + JSON.stringify(results));
		nextFn(err, results);
	});
}

//Generic function to fetch objects based on queryParams and collection
var getObjectsByQueryParams = function (queryParams, collection, nextFn) {
	runQuery(collection, queryParams, null, function(err, results) {
		if (err) nextFn(err, null);
		console.log("in getObjectsByQueryParams for coll: " + collection + ", the results jsonstringified are " + JSON.stringify(results));
		nextFn(err, results);
	});
};


//Generic worker function to run a find query
var runQuery = function(myCollection, query, options, nextFn) {

    // perform the {query} on the collection and invoke the nextFn when done
	// var db = new Db(dbname, new Server(host, port, {}), {native_parser:false});
	mongo.connect(localstr, {}, function(error, db){
			db.collection(myCollection, function(err, collection) {

				var optionsArray = {};
				//if (typeof(options) != 'undefined') {
				//	optionsArray = options;
				if (options) {
					optionsArray = options;
				} else {
					optionsArray['limit'] = 100;
					optionsArray['sort'] = {};
					optionsArray['sort']['_id']= -1;
				}

				optionsArray['slaveOk'] = true;

	    		collection.find(query, optionsArray, function (err, cursor){
			    	if (err) {
				    	console.log("error is: " + err);
				    	nextFn(err, null);
				    }
					cursor.toArray(function(err, docs) {
					    db.close();
					    if (err || (docs.length == 0)) {
					    	nextFn(err, null);
					    } else {
	   					    console.log("found " + docs.length + " documents in " + myCollection);
						    var queryResults = [];
					    	for(var i=0; i<docs.length; i++) {
								queryResults[queryResults.length] = docs[i];
						    }
						    nextFn(err, queryResults);
						}
					});
			    });
			});
	});
}

var createDocument = function (newDoc, collection, nextFn) {
    // perform the {insert} on the collection and invoke the nextFn when done
	mongo.connect(localstr, {}, function(error, client){
	     client.collection(collection, function(err, col) {
	             col.insert(newDoc, {safe:true}, function (err, result) { 
					if (err) console.warn(err.message);
					console.log("Created " + collection + ": insert results are " + JSON.stringify(result));
	             	nextFn(err, result); 
	             });
	     });
	});
}

// ## END OF INTERNAL WORKER FUNCTIONS

// ## BEGIN EXPORTED FUNCTIONS

// Insert user into Mongo
exports.createUser = function(newUser, nextFn) {
	createDocument(newUser, 'plateUser', nextFn);
}

// Insert order into Mongo
exports.createOrder = function(newOrder, nextFn) {
	createDocument(newOrder, 'order', nextFn);
}

// Insert menu item into Mongo
exports.addMenuItem = function(menuitem, nextFn) {
	createDocument(menuitem, 'menuitem', nextFn);
}

//Fetch the order history of this userId
exports.getMenuItem = function(menuItemId, nextFn) {
	getObjectById(menuItemId, 'menuitem', nextFn);
}

//Fetch the order history of this userId
exports.getOrderHistory = function(userId, nextFn) {
	var queryParams = {};
	queryParams['userid'] = userId;
	getObjectsByQueryParams(queryParams, 'order', nextFn);
}

//Get the users by this userLogin
exports.fetchUsersByLogin = function(userLogin, nextFn) {
	var queryParams = {};
	queryParams['login'] = userLogin;
	getObjectsByQueryParams(queryParams, 'plateUser', nextFn);
}

//Fetch all users
exports.getAllUsers = function(nextFn) {
	var queryParams;
	getObjectsByQueryParams(queryParams, 'plateUser', nextFn);
}

//Fetch a user by userid
exports.findUserById = function(userId, nextFn) {
	getObjectById(userId, 'plateUser', nextFn);
}

//Fetch a user by userid
exports.findUserByEmail = function(login, nextFn) {
	var queryParams = {};
	queryParams['email'] = login;
	getObjectsByQueryParams(queryParams, 'plateUser', nextFn);
}