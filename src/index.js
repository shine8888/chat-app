const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("join", ({ username, room }) => {
    socket.join(room);

    socket.emit("message", generateMessage("Welcome"));
    socket.broadcast
      .to(room)
      .emit("message", generateMessage(`${username} has joined`));

    //socket.emit, io.emit, socket.broadcast.emit
    // io.toemit, socket.broadcast.to.emit
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }

    io.to("2").emit("message", generateMessage(message));
    callback();
  });

  socket.on("disconnect", () => {
    io.emit("message", generateMessage("User has left"));
  });

  socket.on("sendLocation", (position, callback) => {
    const location = `https://www.google.com/maps?q=${position.latitude},${position.longitude}`;
    io.emit("locationMessage", generateMessage(location));
    callback();
  });
});

app.get("", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
