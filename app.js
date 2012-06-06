var bcrypt = require('bcrypt');
var everyauth = require('everyauth');
//var everyauth = require('/Users/emileleon/Documents/workspace/GitHub/everyauth');
//var everyauth = require('/Users/emileleon/node_modules/everyauth');
var express = require('express');
var routes = require('./routes');
var MongoStore = require('express-session-mongo');


everyauth.debug = true;

everyauth.password
  .getLoginPath('/login') // Uri path to the login page
  .postLoginPath('/login') // Uri path that your login form POSTs to
  .loginView('login.jade')
  .authenticate( function (login, password) {
      var promise
        , errors = [];
      if (!login) errors.push('Missing login.');
      if (!password) errors.push('Missing password.');
      if (errors.length) return errors;

      promise = this.Promise();

      //findUser passes an error or user to a callback after finding the
      //user by login
      getData.findUserByLogin( login, function (err, user) {
        if (err) {
          errors.push(err.message || err);
          return promise.fulfill(errors);
        }
        if (!user) {
          errors.push('User with login ' + login + ' does not exist.');
          return promise.fulfill(errors);
        }
        //console.log("##  password and user.hash and user are " + password + " and " + user[0].hash + " and " + JSON.stringify(user));
        bcrypt.compare(password, user[0].hash, function (err, didSucceed) {
          if (err) {
            return promise.fail(err);
            console.log('err during bcrypt password comparison');
            errors.push('Wrong password.');
            return promise.fulfill(errors);
          }
          if (didSucceed) {
            console.log("SUCCESS!  password is valid.");

            return promise.fulfill(user[0]);
          }

          console.log("error passwords are not same");
          errors.push('Wrong password. Remember, cheaters never win.');
          return promise.fulfill(errors);
        });
      });

      return promise;
  })
  .loginSuccessRedirect('/order') // Where to redirect to after a login

    // If login fails, we render the errors via the login view template,
    // so just make sure your loginView() template incorporates an `errors` local.
    // See './example/views/login.jade'

  .getRegisterPath('/register') // Uri path to the registration page
  .postRegisterPath('/register') // The Uri path that your registration form POSTs to
  .registerView('register.jade')
  .extractExtraRegistrationParams( function (req) {
    return {
        email: req.body.email
      , name: {
            first: req.body.firstName
          , last: req.body.lastName
        }
    }
  })
  .validateRegistration( function (newUserAttrs) {

    // Validate the registration input
    // Return undefined, null, or [] if validation succeeds
    // Return an array of error messages (or Promise promising this array)
    // if validation fails
    //
    // e.g., assuming you define validate with the following signature
    // var errors = validate(login, password, extraParams);
    // return errors;
    //
    // The `errors` you return show up as an `errors` local in your jade template

    var errors = [];
    var promise = this.Promise();

    // Make sure the user has their email address and first and last name and password (twice)
    var email = newUserAttrs.email;
    var firstName = newUserAttrs.name.first;
    var lastName = newUserAttrs.name.last;
    var login = newUserAttrs.login;
    var password = newUserAttrs.password;

    if (!email || !firstName || !lastName || !login || !password) { 
      // return an error
      console.log("incomplete data during validate registration ");
      console.log(email + firstName + lastName + login + password);
      errors.push('please complete all fields and try again');
      return promise.fulfill(errors);
    }

    // check if user already exists
    getData.fetchUsersByLogin(newUserAttrs.login, function(err, users) {

      if (!users) {
        // no users exist with this login; continue
        console.log("login is available.  create user.");
        //return promise.fulfill(errors);
        return promise.fulfill(null);
      } else {
        console.log("Error: username " + newUserAttrs.login + " is already taken.");
        errors.push("User name " + newUserAttrs.login + " is already taken. Please try to be more original.");
        return promise.fulfill(errors);
      }
    });

    return promise;

  })
  .registerUser( function (newUserAttrs) {
    var promise = this.Promise()
      , password = newUserAttrs.password;

    delete newUserAttrs['password']; // Don't store password
    newUserAttrs.salt = bcrypt.genSaltSync(10);
    newUserAttrs.hash = bcrypt.hashSync(password, newUserAttrs.salt);

    // Create a new user in your data store
    getData.createUser( newUserAttrs, function (err, createdUser) {
      if (err) return promise.fail(err);
      return promise.fulfill(createdUser[0]);
    });

    return promise;

  })
  .registerSuccessRedirect('/login'); // Where to redirect to after a successful registration


everyauth.everymodule.userPkey = '_id';

everyauth.everymodule
//  .userPkey('_id')
  .findUserById( function (userId, callback) {
    console.log("()()(  IN FIND BY USER ID of everyauth");
    getData.findUserById(userId, function(err, user) {
      callback(err, user);
    })
  
    // User.findById(userId, callback);
    // callback has the signature, function (err, user) {...}
  });

app = module.exports = express.createServer();

everyauth.helpExpress(app);

//var sessionServer = new Server('127.0.0.1', 27017, { auto_reconnect: true }, {});
//app.use(expr.session({ store: new MongoStore() }));

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'cheese board'}));
//  app.use(express.session({ store: new MongoStore({ native_parser: false }) }));
  app.use(everyauth.middleware());
  app.use(app.router);


  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  GLOBAL.mongoHost = 'localhost';
  GLOBAL.mongoPort = 27017;
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
  GLOBAL.mongoHost = '10.162.214.174';
  GLOBAL.mongoPort = 27017;
});

// getData uses configs so must come after above app.configure
var getData = require('./getData');

app.get('/login', function(req, res, nextFn){
  console.log("in app.get");
  nextFn();
});

app.get('/', function(req, res, nextFn){
  console.log("in app get /");
  res.render('index.jade', {title: 'Plate'});
});

app.post('/order', function(req, res, nextFn) {
  console.log('POSTing an order with body: ' + JSON.stringify(req.body));

  var order = {};
  order.entree = req.body.entree;
  order['side'] = req.body.side;
  order.userid = req.session.auth.userId;

  if (req.body.comment) {
    order.comment = req.body.comment;
  }


  // Create a new order
  getData.createOrder( order, function (err, newOrder) {
    if (err) {
      req.flash('error', 'error occurred and order was *not* placed');        
      res.render('order.jade', { locals: { flash: req.flash() }});
    } else {
      req.flash('info', 'order was posted');
      res.render('order.jade', { locals: { flash: req.flash() }, newOrder: newOrder });
    }
  });
});


app.get('/order', authed, function(req, res, nextFn){

  // show the values stored in the session
  for (var k in req['session']) {
      // use hasOwnProperty to filter out keys from the Object.prototype
      if (req['session'].hasOwnProperty(k)) {
          console.log('key is: ' + k + ', value is: ' + JSON.stringify(req['session'][k]));
      }
  }
  
  if ((req.session) && (req.session.auth) && (req.session.auth.loggedIn)) {
    console.log("user is logged INNNN");
    res.render('order.jade', { });
  } else {
    console.log("user is NOT logged in");
    res.redirect('/login');
  }

});


app.get('/history', authed, function(req, res, nextFn){

  if ((req.session) && (req.session.auth) && (req.session.auth.loggedIn)) {

    getData.getOrderHistory( req.session.auth.userId, function(err, orderHistory) {
      if (err) {
        req.flash('error', 'sorry but order history is unavailable at the moment');
        res.render('orderHistory.jade', { locals: { flash: req.flash() }});
      } else {
        console.log('order history is: ' + JSON.stringify(orderHistory));
        res.render('orderHistory.jade', { orderHistory: orderHistory });
      }
    });
  } else {
    res.redirect('/login');
  }

});




function authed(req, res, nextFn) {

    var header=req.headers['authorization']||'',        // get the header
      token=header.split(/\s+/).pop()||'',            // and the encoded auth token
      auth=new Buffer(token, 'base64').toString(),    // convert from base64
      parts=auth.split(/:/),                          // split on colon
      username=parts[0],
      pass=parts[1];  
    
    if (username == 'plate' && pass == 'plate123') {
      nextFn();
    } else {
      res.setHeader("WWW-Authenticate", "Basic realm=\"Secure Area\"");
      res.writeHead(401, {'Content-Type': 'text/html'});  
      res.end('you need to login');
    }
}


app.listen(1083);
console.log("Plate server listening on port %d in %s mode", app.address().port, app.settings.env);


