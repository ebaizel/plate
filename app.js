var express = require('express');
var routes = require('./routes');
var auth = require('./auth').auth;
var samurai = require('./payments').samurai;

app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'cheese board'}));
  //  var sessionServer = new Server('127.0.0.1', 27017, { auto_reconnect: true }, {});
  //  app.use(express.session({ store: new MongoStore({ native_parser: false }) }));
  app.use(auth.middleware());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  GLOBAL.mongoConnString = "mongodb://mongo:r1sky@ds033757.mongolab.com:33757/heroku_app5057630";
  // GLOBAL.mongoConnString = "mongodb://localhost:27017/plate";
  // GLOBAL.mongoHost = 'localhost';
  // GLOBAL.mongoPort = 27017;
  // GLOBAL.mongoDBName = 'plate';
});

app.configure('production', function(){
  app.use(express.errorHandler());
  GLOBAL.mongoConnString = "mongodb://mongo:r1sky@ds033757.mongolab.com:33757/heroku_app5057630";
  // GLOBAL.mongoHost = 'ds033757.mongolab.com';
  // GLOBAL.mongoPort = 33757;
  // GLOBAL.mongoDBName = 'heroku_app5057630';
});

// getData uses configs so must come after above app.configure
var getData = require('./getData');
auth.helpExpress(app);
auth.debug = true;

// ===== ROUTING TABLES =====

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

app.get('/payment', authed, function(req, res, nextFn){
  console.log("in app get /payment");
  res.render('payment.jade', { samurai: samurai });
});

app.get('/paymentverification', authed, function(req, res, nextFn){
  console.log("in app get /paymentverification");
  var paymentMethodToken = req.query['payment_method_token'];
  //Add this token to the user's account


  //Get this token's details to display them
  var paymentMethod = samurai.PaymentMethod.find(paymentMethodToken,
    function(err, paymentMethod) {
      console.log(paymentMethod.isSensitiveDataValid);  // => true if the credit_card[card_number] passed checksum
                                                      //    and the cvv (if included) is a number of 3 or 4 digits
      var paymentMethods = [];
      paymentMethods[0]= paymentMethod;
      res.render('paymentmethods.jade', { paymentMethods : paymentMethods });
  });
});

app.get('/users', authed, function(req, res, nextFn){
  console.log("in app get /users");
  getData.getAllUsers(function(err, allUsers) {
      if (err) {
        req.flash('error', 'sorry but viewing all users is unavailable at the moment');
        res.render('users.jade', { locals: { flash: req.flash() }});
      } else {
        console.log('users list is: ' + JSON.stringify(allUsers));
        res.render('users.jade', { users: allUsers });
      }
  });
});

app.get('/menu', authed, function(req, res, nextFn){
  console.log("in app get /menu");
  // Display a grid of days for which to view the menu
  res.render('menu.jade', { });
});


app.get('/menu/:day', authed, function(req, res, nextFn){
  console.log("in app get /menu/:day");
//  var day = req.query['day'];
  var day = req.params.day;
  if (!day) {
    //set day to today
    day = "20120610";
  }

  // get all the menu items
  getData.getAllMenuItems(false, function(err, menuItems) {
    getData.getMenu(day, function(err, menu) {
        if (err) {
          req.flash('error', 'sorry but viewing menu is unavailable at the moment');
          res.render('menu.jade', { locals: { flash: req.flash() }});
        } else {
          console.log('menu is is: ' + JSON.stringify(menu));
          res.render('menu.jade', { menu: menu, menuItems: menuItems });
        }
    });
  });
});



app.get('/menuitem/1', function(req, res, nextFn) {
//  console.log('getting menu item id: ' + itemid);
  var itemid = '4fd50abccb6abdb30e000001';
  getData.getMenuItem(itemid, function(err, menuitem) {
    res.render('menuitem.jade', { locals: { flash: req.flash() }, menuitem: menuitem[0] });      
  });
});

app.get('/menuitem', function(req, res, nextFn) {
  res.render('menuitem.jade', { locals: { flash: req.flash() } });
});

app.post('/menuitem', function(req, res, nextFn) {

  var menuitem = {};
  
  menuitem.name = req.body.name;
  menuitem.type = req.body.entreeorside;
  menuitem.veg = req.body.vegetarian;
  menuitem.disc = req.body.discontinued;

  if (req.body.desc) {
    menuitem.desc = req.body.desc;
  }

  if (req.body._id) {
    menuitem._id = req.body._id;
  }

  console.log('Adding a new menu item with body: ' + JSON.stringify(menuitem));

  // Create a new order
  getData.addMenuItem( menuitem, function (err, newOrder) {
    if (err) {
      req.flash('error', 'error occurred and menu item was *not* added');        
      res.render('menuitem.jade', { locals: { flash: req.flash() }});
    } else {
      req.flash('info', 'menu item was added');
      res.render('menuitem.jade', { locals: { flash: req.flash() }, menuitem: menuitem });
    }
  });
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


// This is the browser based auth - 401

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


app.listen(process.env.PORT || 1083);
console.log("Plate server listening on port %d in %s mode", app.address().port, app.settings.env);


