const { v4: uuidv4 } = require("uuid");

// Server
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const server = http.createServer(app);

// Middleware
const cors = require("cors");
const { count } = require("console");
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.post("/createUser", async (req, res) => {
  try {
    const { username } = req.body;
    const userId = uuidv4();

    res.json({ userId, username });
  } catch (e) {
    res.json(e);
  }
});

// Define a rooms object to store the number of clients in each room
const rooms = {};

// Websocket events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", ({ user, roomName }) => {
    const username = user.username;
    const userId = user.userId;
    if (rooms[roomName] && rooms[roomName].count < 2) {
      socket.join(roomName);
      rooms[roomName].count += 1;
      socket.emit("room_joined");
      console.log(
        `Socket User ID: ${socket.id}, Username: ${username} joined room ${userId} as its ${rooms[roomName].count} member`
      );
      // If there are now 2 users in the room, determine room creator and send opponent details
      if (rooms[roomName].count === 2) {
        const opponentDetails = { userId, username };
        if (rooms[roomName] === userId) {
          const opponentDetails = {
            userId: userId,
            username: username,
          };
        } else {
          const opponentDetails = {
            userId: rooms[roomName],
            username: rooms[roomName].creator,
          };
        }
        // Emit opponent details to all users in the room except the sender
        socket.to(roomName).emit("opponent_details", opponentDetails);
        socket.to(roomName).emit("game_turn", rooms[roomName].turn);
      }
    } else {
      // If the room is full, notify the client
      socket.emit("room_full");
      console.log(
        `Socket User ID: ${socket.id}, Username: ${username} Tried To Join room ${userId} But It Was Full`
      );
    }
    // After updating rooms[], emit the updated list of available rooms
    io.emit("available_rooms", rooms);
  });

  // Listen for the "create_room" event from the client
  socket.on("create_room", (user) => {
    const username = user.username;
    const userId = user.userId;
    if (!rooms[userId]) {
      rooms[userId] = { count: 0, creator: username, turn: "w" }; // Store the creator's username and the rooms current turn.
      console.log("room " + userId + ` created by ${username}`);
    }
    socket.emit("room_created", userId);
    // After creating a room, emit the updated list of available rooms
    io.emit("available_rooms", rooms);
  });

  socket.on("get_available_rooms", () => {
    socket.emit("available_rooms", rooms);
  });

  socket.on("give_opponent_details", (user) => {
    socket.emit("opponent_details", user);
  });

  socket.on("leave_room", ({ user, roomName }) => {
    socket.emit("room_left");
    socket.leave(roomName);
    console.log(`User: ${user.username}, left room: ${roomName}`);
    // Check if the room exists before updating its properties
    if (rooms[roomName]) {
      rooms[roomName].count -= 1;

      // Remove the room from the server if no one's in the room.
      if (rooms[roomName].count === 0) {
        // Remove room from rooms list
        delete rooms[roomName];
      }

      io.emit("available_rooms", rooms);
    } else {
      console.error(`Room ${roomName} does not exist.`);
    }
  });

  socket.on("sending_move", ({ x, y, rank, piece, file, roomName }) => {
    // Check if rooms[roomName] exists before accessing its properties
    if (rooms[roomName]) {
      rooms[roomName].turn = rooms[roomName].turn === "w" ? "b" : "w";
      const gameTurn = rooms[roomName].turn;

      socket
        .to(roomName)
        .emit("move_received", { x, y, rank, piece, file, gameTurn });
    } else {
      // Handle the case where rooms[roomName] does not exist
      console.error(`Room ${roomName} does not exist.`);
    }
  });

  socket.on("sending_takeback", (roomName) => {
    socket.to(roomName).emit("received_takeback");
  });

  socket.on("piece_upgrade", ({ option, roomName, promotionSquare, color }) => {
    rooms[roomName].turn = rooms[roomName].turn === "w" ? "b" : "w";
    const gameTurn = rooms[roomName].turn;
    socket
      .to(roomName)
      .emit("piece_upgraded", { option, promotionSquare, color, gameTurn });
  });

  socket.on("send_restart_game", (roomName) => {
    rooms[roomName].turn = rooms[roomName].turn === "w";
    socket.to(roomName).emit("restart_game_received");
  });
});

server.listen(8000, () => {
  console.log("listening on port 8000");
});
