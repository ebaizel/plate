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



var mongostr = "mongodb://ebaizel:incoming36@ds033757.mongolab.com:33757/heroku_app5057630";
var localstr = "mongodb://localhost:27017/plate";

// var connect = require('connect');
// //var mongo = require('mongodb');
// var db = null;

// function setupDB() {
// 	mongo.connect(localstr, {}, function(error, database){
// 		console.log("connected, db: " + database);

// 		db = database;

// 		database.addListener("error", function(error){
// 			console.log("Error connecting to MongoLab");
// 		});
// 	});
// };



//Generic worker function to run a find query
exports.runQuery = function(myCollection, query, options, nextFn) {

    // perform the {query} on the collection and invoke the nextFn when done
//    var db = new Db(dbname, new Server(host, port, {}), {native_parser:false});
	mongo.connect(localstr, {}, function(error, db){
	    db.open(function(err, db) {
			db.collection(myCollection, function(err, collection) {

				var optionsArray = {};
				if (typeof(options) != 'undefined') {
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
	});
}

//Fetch the accounts for this orgId
exports.fetchAccountsForOrg = function(req, nextFn) {

	var orgId = req.params.orgId;
	var fromDate;
	var toDate;
	
	var queryParams = {};
	queryParams['providerOrgId'] = orgId;
	var optionsString; 
	require('./getData').runQuery('account', queryParams, optionsString, function(results) {
		nextFn(results);
	});
}

// Insert user into Mongo
exports.createUser = function(newUser, nextFn) {

    // perform the {insert} on the collection and invoke the nextFn when done
//    var db = new Db(dbname, new Server(host, port, {}), {native_parser:false});
	mongo.connect(localstr, {}, function(error, db){
		db.open(function(err, client){
		    client.createCollection("plateUser", function(err, col) {
		         client.collection("plateUser", function(err, col) {
		                 col.insert(newUser, {safe:true}, function (err, result) { 
							if (err) console.warn(err.message);
							console.log("^^^ Created User: insert results are " + JSON.stringify(result));
		                 	nextFn(err, result); 
		                 });
		         });
		    });
		});
	});
}

// Insert order into Mongo
exports.createOrder = function(newOrder, nextFn) {

    // perform the {insert} on the collection and invoke the nextFn when done
//    var db = new Db(dbname, new Server(host, port, {}), {native_parser:false});
	mongo.connect(localstr, {}, function(error, db){
		db.open(function(err, client){
		    client.createCollection("order", function(err, col) {
		         client.collection("order", function(err, col) {
		                 col.insert(newOrder, {safe:true}, function (err, result) { 
							if (err) console.warn(err.message);
							console.log("^^^ Created Order: insert results are " + JSON.stringify(result));
		                 	nextFn(err, result); 
		                 });
		         });
		    });
		});
	});
}

//Fetch the order history of this userId
exports.getOrderHistory = function(userId, nextFn) {
	console.log("in getOrderHistory");
	var queryParams = {};
	queryParams['userid'] = userId;
	var optionsString; 
	require('./getData').runQuery('order', queryParams, optionsString, function(err, results) {
		nextFn(err, results);
	});
}


//Fetch the users by this userLogin
exports.fetchUsersByLogin = function(userLogin, nextFn) {
	console.log("in fetchusersbylogin");
	var queryParams = {};
	queryParams['login'] = userLogin;
	var optionsString; 
	require('./getData').runQuery('plateUser', queryParams, optionsString, function(err, results) {
		nextFn(err, results);
	});
}

//Fetch a user by userid
exports.findUserById = function(userId, nextFn) {
	var queryParams = {};
	queryParams['_id'] = new ObjectID(userId);
	var optionsString; 
	require('./getData').runQuery('plateUser', queryParams, optionsString, function(err, results) {
		nextFn(err, results);
	});
}

//Fetch a user by userid
exports.findUserByLogin = function(login, nextFn) {
	
	var queryParams = {};
	queryParams['login'] = login;
	var optionsString; 
	this.runQuery('plateUser', queryParams, optionsString, function(err, results) {
		if (err) nextFn(err, null);

		console.log("in getdata.finduserbylogin the results are " + results);
		console.log("in getdata.finduserbylogin the results jsonstringified are " + JSON.stringify(results));
		nextFn(err, results);
	});
}