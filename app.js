var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var MongoDB = require("./database/MongoDB");
var { UsersDB, UserRepo } = require("./database/userUB");
var { MessagesDB, MessagesRepo } = require("./database/messageDB");
var { RoomsDB, RoomRepo } = require("./database/roomDB");
var Encryption = require("./core/encrypt");
var Env = require("./core/env");
var Constanst = require("./core/constant");

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.post('/login', async function (req, res) {
  let user = await UserRepo.login(req.body.username, req.body.password);
  delete user.friends;
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

app.post('/api/notify', async function (req, res) {
  let token = req.body.token;
  let user = JSON.parse(Encryption.decrypt(token));
  if (UserRepo.login(user.username, user.password)) {
    let notify = await MessagesRepo.notifyMsg(user);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(notify));
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

async function personalChat(socket, user, friend_id, isSecret=false) {
  let room = await RoomRepo.findRoomPersonal(user._id, friend_id, isSecret);
  if (room) {
    socket.join(room._id);
    socket.emit("event-join-room", room._id);
    UserRepo.updateRoom(user._id, room._id, new Date);
  } else {
    room = {
      name: user.name,
      created_by: user._id,
      user_in_room: [user._id, friend_id],
      type: isSecret ? Constanst.ROOM_TYPE.PERSONAL_CHAT_SECRET : Constanst.ROOM_TYPE.PERSONAL_CHAT,
      created_at: new Date(),
      deleted: false
    }
    let roomCreate = await RoomRepo.create(room);

    socket.join(roomCreate._id);
    socket.emit("event-join-room", roomCreate._id);
    UserRepo.updateRoom(user._id, roomCreate._id, new Date);
    UserRepo.updateRoom(friend_id, roomCreate._id, new Date);
  }
}

async function groupChat(socket, user, users, isPublic=false) {
  users = users ? users : [user._id];
  let room = {
    name: data.group_name,
    created_by: user._id,
    user_in_room: users,
    type: isPublic? Constanst.ROOM_TYPE.GROUP_CHAT_PUBLIC : Constanst.ROOM_TYPE.GROUP_CHAT_PRIVATE,
    created_at: new Date(),
    deleted: false
  }
  let roomCreate = await RoomRepo.create(room);
  socket.join(roomCreate._id);
  socket.emit("event-join-room", roomCreate._id);
  UserRepo.updateRoom(user.username, roomCreate._id, new Date);
}

async function getNotify(user) {
  return await MessagesRepo.notifyMsg(user);
}

const ioSocket = io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
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

ioSocket.on('connection', async function (socket) {
  let user = JSON.parse(Encryption.decrypt(socket.handshake.query.token));
  delete user.password;

  let dataConnect = {
    user_id: user._id,
    connect_id: socket.id
  }

  socket.emit('data-connect', dataConnect);

  socket.on('create-room', async function (data) {
    switch (data.type) {
      case Constanst.ROOM_TYPE.PERSONAL_CHAT:
        personalChat(socket, user, data.user_id);
        break;

      case Constanst.ROOM_TYPE.PERSONAL_CHAT_SECRET:
        personalChat(socket, user, data.user_id, true);
        break;

      case Constanst.ROOM_TYPE.GROUP_CHAT_PUBLIC:
        if (user.permission != Constanst.ROLE_USER.ADMIN) {
          socket.emit("Error", "Can't create public group");
        }
        groupChat(socket, user, data.users, true);
        break;

      case Constanst.ROOM_TYPE.GROUP_CHAT_PRIVATE:
        if (UserRepo.friendCount(user.username) < 10) {
          socket.emit("Error", "Can't create group");
        }
        groupChat(socket, user, data.users);
        break;

      default:
        socket.emit("Error", "Can't create group");
        break;
    }
  })

  socket.on('join-room', function (room) {
      socket.join(room);
      socket.emit("event-join-room", room);
      UserRepo.updateRoom(user.username, room, new Date);
  });

  socket.on('chat', async function (data) {
    let msg = {
      user: user,
      message: data.msg,
      room_id: data.room,
      created_at: new Date()
    };

    let room = await RoomsDB.findOne({_id: data.room});
    if (room.type != Constanst.ROOM_TYPE.PERSONAL_CHAT_SECRET) {
      MessagesRepo.insert(msg);
    }

    io.sockets.in(data.room).emit("chat", { msg: data.msg, user: user });
  });

  socket.on('received', async function (data) {
    UserRepo.updateRoom(user._id, data.room_id, new Date);
  });

  socket.on('typing', function (data) {
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