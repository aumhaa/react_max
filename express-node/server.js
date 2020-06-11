/* The basic idea is to use a central server to communicate between a web-based
app and MaxMSP.  Here, express is communicating with MaxMSP via node, and works
as the backend of the React app we've built on port 9000.  A mutliplexing socket
is setup on port 9001 to communicate between our realtime objects on both sides.
Express translates communications to a webpage on port 3000.
*/
const createError = require('http-errors');
const express = require("express");
const maxApi = require("max-api");


//var express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cors = require('cors');  //added amounra
const socketIo = require('socket.io');
const http = require("http");
// const pug = require("pug");
// pug is a replacement for the deprecated jade view engine.  there are still some
// problems with this module in regards to jade dependencies, eventually jade
// needs to be upgraded to pug

// const axios = require('axios');

// app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

const port = 9000;  //this is the port used for communication between react and express.
const ip = "http://localhost:9001";  //this is the port used for OSC?
const pagestatsDictId = 'pagestats';

// async wrapper for maxApi.setDict function
const setDict = async(id, value) => {
	await maxApi.setDict(id, value);
}

function arrayfromargs(){
	return Array.prototype.slice.call(arguments, 0);
}

const debug = function(){
	var args = arrayfromargs.apply(this, arguments);
	for(var i in args){
		if(args[i] instanceof Array){
			args[i] = args[i].join(' ');
		}
	}
	//args = args.join(' ');
	maxApi.post(args + '\n');
}


//these routes are used when requesting sites from the react app
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//var testAPIRouter = require('./routes/testAPI');
//added amounra.  testAPIRouter eventually needs to be moved to its own file.

var app = express();
app.set('port', port);

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'jade');

//app.use(cors());  //added amounra
app.use(cors({credentials: true, origin: ['http://localhost:3000', 'http://localhost:9000']}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));

const testRouter = express.Router();

let state = {greeting: "Hello, Welcome to Max!",
	accesses: 0,
	value0: 0,
	value1: 0,
	endpoint: ip,
	response: "undefined"
};

function update_state(){
	if (maxApi) {
		maxApi.getDict("pagestats")
			.then((dict) => {
				state.greeting = "Hello, Welcome to Max!";
				state.accesses = dict.accesses ? dict.accesses : 0;
				state.value0 = dict.value0 ? dict.value0 : 0;
				state.value1 = dict.value1 ? dict.value1 : 0;
			})
			.catch((err) => {
				state.greeting = "Had trouble getting data in Max";
				state.accesses = err;
				state.value0 = 0;
				state.value1 = 0;
			});
	}
}

//testRouter page, eventually put in its own file inside routes
testRouter.get('/', function(req, res, next) {
	//debug('testRouter.get', req, res, next);
  //res.send('API is working properly in Max, testRouter');
	if (maxApi) {
		maxApi.getDict("pagestats")
			.then((dict) => {
				dict.accesses = dict.accesses ? dict.accesses + 1 : 1;
				maxApi.updateDict("pagestats", "accesses", dict.accesses);
				state.greeting = "Hello, Welcome to Max!";
				state.accesses = dict.accesses;
				state.value0 = dict.value0 ? dict.value0 : 0;
				state.value1 = dict.value1 ? dict.value1 : 0;
				res.json(state);
			})
			.catch((err) => {
				state.greeting = "Had getting data in Max";
				state.accesses = err;
				state.value0 = 0;
				state.value1 = 0;
				res.json(state);
			});
	} else {
		res.send("Hello! This simple server is not running inside of Max.");
	}
	//debug('testRouter.get:');
})

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/testAPI', testRouter);   //added amounra

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(port, function () {
	debug("Example app listening on port "+app.get('port')+"!");
	if (maxApi) maxApi.outlet("ready");
});

const server = http.Server(app);

const io = socketIo(server, { origins: '*:*'}).listen(9001);

io.on("connection", socket => {
  maxApi.post("New client connected"),
  socket.on("disconnect", () => maxApi.post("Client disconnected"));
	socket.on("state", (data) => update_max_objects(data));
});

let count = 0;

const getApiAndEmit = async socket => {
	count += 1,
	maxApi.post('count:' + count),
  socket.emit("FromAPI", "Count is: " + count);
};

// this is called from max whenever a value changes
maxApi.addHandler("update_data", async () => {
	update_state(),
	io.emit("FromAPI", state)
});

//this is called (via "state" message to io) by react client to update max
function update_max_objects(data){
	debug('update_max_objects', data.value0, data.value1);
	setDict(pagestatsDictId, data);
	maxApi.outlet('bang');
}

module.exports = app;
