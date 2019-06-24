var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var MongoDB = require("./database/MongoDB");
var {UsersDB, UserRepo} = require("./database/userUB");
var {MessagesDB, MessagesRepo} = require("./database/messageDB");
var {RoomsDB, RoomRepo} = require("./database/roomDB");
var Encryption = require("./core/encrypt");

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/login', async function (req, res) {
  let user = await UserRepo.login(req.body.username, req.body.password);
  if (user) {
    let code = Encryption.encrypt(JSON.stringify(user));
    res.send(code);
  } else {
    res.status(401);
    res.send("0");
  }
});

app.post('/api/users', async function (req, res) {
  let token = req.body.token;
  let user = JSON.parse(Encryption.decrypt(token));
  if (UserRepo.login(user.username, user.password)) {
    let users = await UsersDB.find({});
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(users));
  } else {
    res.send("error");
    res.status(500);
  }
});

app.post('/api/create-room', async function (req, res) {
  let token = req.body.token;
  let user = JSON.parse(Encryption.decrypt(token));
  if (UserRepo.login(user.username, user.password)) {
    let room = {
      name: user.username,
      created_by: user.username,
      user_in_room: [user.username],
      created_at: new Date(),
      deleted: false
    }
    RoomRepo.create(room);
    res.send("success");
  } else {
    res.send("error");
    res.status(500);
  }
});

const ioSocket = io.use(function(socket, next){
  if (socket.handshake.query && socket.handshake.query.token){
    let token = socket.handshake.query.token;
    let user = JSON.parse(Encryption.decrypt(token));
    if (UserRepo.login(user.username, user.password)) {
      next();
    } else {
      next(new Error('Authentication error'));
    }
  } else {
      next(new Error('Authentication error'));
  }    
});

ioSocket.on('connection', function (socket) {
  let dataConnect = {
    list_room : [],
    connect_id : socket.id
  }
  socket.emit('data-connect', dataConnect);

  socket.on('join-room', function (room) {
    if (checkExistRoom(room)) {
      socket.join(room);
    } else {
      console.log('Join room failed');
      socket.emit("Error", "Can't join room");
    }
  });

  socket.on('chat', function (data) {
    io.sockets.in(data.room).emit("chat", {msg: data.msg, user: data.username});
  });

  socket.on('typing', function (data) {
    socket.broadcast.to(data.room).emit('typing', data.user);
  });
});

MongoDB.connectDB().then(() => {
  console.log("connect db ok");
}, (err) => {
  console.log("connect DB error:", err);
});

http.listen(port, function () {
  console.log('listening on *:' + port);
});
