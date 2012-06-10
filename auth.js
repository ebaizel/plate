var everyauth = require('everyauth');
var getData = require('./getData');
var bcrypt = require('bcrypt');
//everyauth.debug = true;

everyauth.password
  .getLoginPath('/login') // Uri path to the login page
  .postLoginPath('/login') // Uri path that your login form POSTs to
  .loginView('login.jade')
  .loginFormFieldName('email')
  .loginHumanName('email')
  .loginKey('email')
  .authenticate( function (login, password) {
      var promise
        , errors = [];
      if (!login) errors.push('Missing login.');
      if (!password) errors.push('Missing password.');
      if (errors.length) return errors;

      promise = this.Promise();

      //findUser passes an error or user to a callback after finding the
      //user by login
      getData.findUserByEmail( login, function (err, user) {
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
//    var login = newUserAttrs.login;
    var password = newUserAttrs.password;

    if (!email || !firstName || !lastName || !password) { 
      // return an error
      console.log("incomplete data during validate registration ");
      console.log(email + firstName + lastName + password);
      errors.push('please complete all fields and try again');
      return promise.fulfill(errors);
    }

    // check if user already exists
    getData.fetchUsersByLogin(newUserAttrs.email, function(err, users) {

      if (!users) {
        // no users exist with this login; continue
        console.log("email is available.  create user.");
        //return promise.fulfill(errors);
        return promise.fulfill(null);
      } else {
        console.log("Error: email " + newUserAttrs.email + " is already taken.");
        errors.push("email " + newUserAttrs.email + " is already taken. Please try to be more original.");
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

exports.auth = everyauth;