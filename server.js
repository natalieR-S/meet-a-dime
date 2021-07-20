const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
var api = require("./api.js");
const { instrument } = require("@socket.io/admin-ui");
require("dotenv").config();

var admin = require("firebase-admin");

var serviceAccount = require("./fireauth");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function decodeIDToken(req, res, next) {
  // console.log(req.headers);
  // console.log("space");
  // console.log(req.headers.authorization);
  if (
    req &&
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      // console.log(decodedToken);
      req["currentUser"] = decodedToken;
    } catch (err) {
      console.log(err);
    }
  }
  next();
}

const PORT = process.env.PORT || 5000;

const app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://meetadime.herokuapp.com/",
      "https://admin.socket.io",
    ],
    credentials: true,
  },
});

// Socket.io admin UI related stuff (as of yet, not working..)
instrument(io, {
  auth: false,
});

http.listen(process.env.PORT || 5000, function () {
  var host = http.address().address;
  var port = http.address().port;
  console.log("App listening to port: ", port);
});

// io.on("connection", (socket) => {
//   console.log(`Socket id: ${socket.id}`);
// });

io.on("connection", (socket) => {
  console.log(`User connected with socket id: ${socket.id}`);

  // // On a private message, relay this to the correct room.
  // socket.on("private", (msg, to, from) => {
  //   console.log(from, "tried to say ", msg, " to ", to);
  //   socket.to(to).emit("private", msg, to, from);
  // });
  // Join the room, then call the callback to alert that join occurred.
  // This gets called on the client side.
  socket.on("join-room", (user, room, callback) => {
    console.log(">>>>> User", user, "joined room", room);
    socket.join(room);
    callback("joined");
  });

  socket.on("leave-room", (user, room) => {
    console.log("> User", user, "left room", room);
    socket.leave(room);
    socket.to(room).emit("abandoned", "Your match left the session.");
    socket.disconnect(0);
  });

  socket.on("leave-room-silently", (user, room) => {
    console.log("> User", user, "left room silently.", room);
    socket.leave(room);
    socket.disconnect(0);
  });

  // Send a message to a particular room.
  socket.on(
    "send-to-room",
    (user, room, message, messageID, isOffline, callback) => {
      socket.to(room).emit("message", message, user, messageID);
      // console.log();
      // console.log(message, "with id", messageID);
      callback(isOffline, message);
    }
  );

  socket.on("seen-message", (user, room, messageID, callback) => {
    // console.log("seen event recieved");
    // console.log(room);
    io.in(room).emit("seen", messageID);
    callback();
  });

  // Images!
  socket.on("send-image-to-room", (user, room, message, messageID) => {
    console.log("recieved an image");
    socket.to(room).emit("image", message, user, messageID);
  });
});

app.set("port", process.env.PORT || 5000);

app.use(cors());
app.use(decodeIDToken); // for firebase authentication.
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

api.setApp(app, admin);

// app.listen(PORT, () => {
//   console.log("Server listening on port " + PORT);
// });

///////////////////////////////////////////////////// For Heroku deployment
// Server static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("frontend/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
  });
}
