var mongo = require('mongodb');
var Db = require('mongodb').Db,
  Connection = require('mongodb').Connection,
  Server = require('mongodb').Server,
  BSON = require('mongodb').BSONNative;

var fs = require('fs');
var dbname = 'plate';

var host = GLOBAL.mongoHost;
var port = GLOBAL.mongoPort;

//Generic worker function to run a find query
exports.runQuery = function(myCollection, query, options, nextFn) {

    // perform the {query} on the collection and invoke the nextFn when done
    var db = new Db(dbname, new Server(host, port, {}), {native_parser:false});
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
				    console.log("found " + docs.length + " documents in " + myCollection);
				    db.close();
				    if (err || (docs.length == 0)) {
				    	nextFn(err, null);
				    } else {
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

// Insert into Mongo
exports.createUser = function(newUser, nextFn) {

    // perform the {insert} on the collection and invoke the nextFn when done
    var db = new Db(dbname, new Server(host, port, {}), {native_parser:false});
	db.open(function(err, client){
	    client.createCollection("plateUser", function(err, col) {
	         client.collection("plateUser", function(err, col) {
//	             for (var i = 0; i < 100; i++) {
	                 //col.insert({c:i}, function() {});
	                 col.insert(newUser, {safe:true}, function (err, result) { 
						if (err) console.warn(err.message);
						console.log("^^^ Create User: insert results are " + JSON.stringify(result));
	                 	nextFn(err, result); 
	                 });
//	             }
	         });
	    });
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
	console.log("@@  In finduserbyID");
	var queryParams = {};
	queryParams['_id'] = userId;
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