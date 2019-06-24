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
var Env = require("./core/env");

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

app.post('/api/msg', async function (req, res) {
  let token = req.body.token;
  let user = JSON.parse(Encryption.decrypt(token));
  if (UserRepo.login(user.username, user.password)) {
    let msg = await MessagesRepo.getInRoom(req.body.room_id);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(msg));
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
  let user = JSON.parse(Encryption.decrypt(socket.handshake.query.token));
  delete user.password;

  let dataConnect = {
    user_id : user._id,
    connect_id : socket.id
  }
  socket.emit('data-connect', dataConnect);

  socket.on('create-room', async function(data) {
    let users = data.users ? data.users : [user._id];
    if (users.length ==2) {
      let room = await RoomRepo.findRoom2(users[0], users[1]);
      if (room) {
        socket.join(room._id);
        socket.emit("event-join-room", room._id);
        return;
      }
    }
    let room = {
      name: data.name ? data.name : user.username,
      created_by: user._id,
      user_in_room: users,
      created_at: new Date(),
      deleted: false
    }
    let roomCreate = await RoomRepo.create(room);
    socket.join(roomCreate._id);
    socket.emit("event-join-room", roomCreate._id);
  })

  socket.on('join-room', function(room) {
    if (checkExistRoom(room)) {
      socket.join(room);
    } else {
      console.log('Join room failed');
      socket.emit("Error", "Can't join room");
    }
  });

  socket.on('chat', function(data) {
    let msg = {
      user: user,
      message: data.msg,
      room_id: data.room,
    };
    MessagesRepo.insert(msg);
    io.sockets.in(data.room).emit("chat", {msg: data.msg, user: user});
  });

  socket.on('typing', function(data) {
    socket.broadcast.to(data.room).emit('typing', user.username);
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

if (!Env.get("APP_KEY")) {
  console.log("\x1b[31m%s\x1b[0m", "APP KEY is empty");
  process.exit()
}
