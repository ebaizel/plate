// var host = GLOBAL.mongoHost;
// var port = GLOBAL.mongoPort;
// var dbname = GLOBAL.mongoDBName;
// //var localstr = "mongodb://mongo:r1sky@ds033757.mongolab.com:33757/heroku_app5057630";
// var localstr = "mongodb://localhost:27017/plate";

// var mongodb= require('mongodb'),
//   server = new mongodb.Server(host, port, {
//     auto_reconnect: true
//   }),
//   platedb = new mongodb.Db(dbname, server);

// // callback: (err, db)
// function openDatabase(callback) {
//   platedb.open(function(err, db) {
//     if (err)
//       return callback(err);

//     console.log('Database connected');

//     return callback(null, db);
//   });
// }

// // callback: (err, collection)
// function authenticate(db, username, password, callback) {
//   db.authenticate(username, password, function(err, result) {
//     if (err) {
//       return callback (err);
//     }
//     if (result) {
//       var collection = new mongodb.Collection(db, 'test');

//       // always, ALWAYS return the error object as the first argument of a callback
//       return callback(null, collection);
//     } else {
//       return callback (new Error('authentication failed'));
//     }
//   });
// }

// function runQuery(myCollection, query, options, nextFn) {
//   this.openDatabase(function(err, db) {
//     db.authenticate('','', function (err, authResult) {
//       if (err) {
//         return nextFn(err);
//       }
//       if (authResult) {

        
//       }

//   })
//   mongo.connect(localstr, {}, function(error, database){
//       database.open(function(err, db) {
//       db.collection(myCollection, function(err, collection) {

//         var optionsArray = {};
//         if (typeof(options) != 'undefined') {
//           optionsArray = options;
//         } else {
//           optionsArray['limit'] = 100;
//           optionsArray['sort'] = {};
//           optionsArray['sort']['_id']= -1;
//         }

//         optionsArray['slaveOk'] = true;

//           collection.find(query, optionsArray, function (err, cursor){
//             if (err) {
//               console.log("error is: " + err);
//               nextFn(err, null);
//             }
//           cursor.toArray(function(err, docs) {
//               db.close();
//               if (err || (docs.length == 0)) {
//                 nextFn(err, null);
//               } else {
//                   console.log("found " + docs.length + " documents in " + myCollection);
//                 var queryResults = [];
//                 for(var i=0; i<docs.length; i++) {
//                 queryResults[queryResults.length] = docs[i];
//                 }
//                 nextFn(err, queryResults);
//             }
//           });
//           });
//       });
//       });
//   });
// }

// exports.openDatabase = openDatabase;
// exports.authenticate = authenticate;
// exports.runQuery = runQuery;