const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');
const { Socket } = require("dgram");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
    console.log("New WebSocket connection");

    socket.on("join", (options, callback) => {
        // Add user to the room 
        const { error, user } = addUser({
            id: socket.id,
            ...options
        })

        if (error) {
            return callback(error)
        }


        socket.join(user.room);

        socket.emit("message", generateMessage("Welcome", 'Admin'));
        socket.broadcast
            .to(user.room)
            .emit("message", generateMessage(`${user.username} has joined`, user.username));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
            //socket.emit, io.emit, socket.broadcast.emit
            // io.toemit, socket.broadcast.to.emit
    });

    socket.on("sendMessage", (message, callback) => {
        const userSendMessage = getUser(socket.id)
        const filter = new Filter();

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed");
        }

        io.to(userSendMessage.room).emit("message", generateMessage(message, userSendMessage.username));
        callback();
    });

    socket.on("disconnect", () => {
        const userDisconnect = removeUser(socket.id)
        if (userDisconnect) {
            io.to(userDisconnect.room).emit("message", generateMessage(`${userDisconnect.username} has left`, 'Admin'));
            io.to(userDisconnect.room).emit('roomData', {
                room: userDisconnect.room,
                users: getUsersInRoom(userDisconnect.room)
            })
        }
    });

    socket.on("sendLocation", (position, callback) => {
        const userLocal = getUser(socket.id)
        console.log(userLocal)

        const location = `https://www.google.com/maps?q=${position.latitude},${position.longitude}`;
        io.to(userLocal.room).emit("locationMessage", generateMessage(location, userLocal.username));
        callback();
    });
});

app.get("", (req, res) => {
    res.render("index");
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});