import React, {  useEffect, useState } from "react";
import Cookies from "universal-cookie";
import Board from "../Board/Board";
import Control from "../Control/Control";
import MovesList from "../Control/bits/MovesList";
import TakeBack from "../Control/bits/TakeBack";
import { useAppContext } from "../../contexts/Context";

function RoomControl() {
  const { socket } = useAppContext();
  // State Varibles
  // Available Rooms
  const [availableRooms, setAvailableRooms] = useState({});
  // Which Room State
  const [room, setRoom] = useState("");
  const [waitRoom, setWaitRoom] = useState(false);
  // User Info
  const [user, setUser] = useState({ userId: null, username: null });
  // Opponent Info
  const [opponent, setOpponent] = useState({ userId: null, username: null });

  // Functions
  const createRoom = () => {
    // Emit a socket.io event to create a new room with user.userId as room name
    socket.emit("create_room", user);
    socket.on("room_created", (roomName) => {
      socket.emit("join_room", { user, roomName });
    });
    // Set room
    setRoom(user.userId);
    setWaitRoom(true);
    const cookies = new Cookies();
    cookies.set("pieceColor", "w");
    cookies.set("roomName", user.userId);
  };

  const joinRoom = (roomName) => {
    // Join the selected room using socket.io
    socket.emit("join_room", { user, roomName });
    socket.on("room_full", () => {
      console.log("Room is full. You cannot join.");
    });
    // Set the selected room and opponent if the room is not full
    socket.on("room_joined", () => {
      // Set the selected room and send user info to opponent
      setRoom(roomName);
      setWaitRoom(false);
      setOpponent({
        userId: roomName,
        username: availableRooms[roomName].creator,
      });
      giveOpponentDetails(user);
      const cookies = new Cookies();
      cookies.set("pieceColor", "b");
      cookies.set("opponentId", roomName);
      cookies.set("opponentUsername", availableRooms[roomName].creator);
      cookies.set("roomName", roomName);
    });
  };

  const leaveRoom = () => {
    var roomName = room;
    socket.emit("leave_room", { user, roomName });

  };

  const leaveRoomOnRefresh = () => {
    if (room) {
      const roomName = room;
      socket.emit("leave_room", { user, roomName });
    }
  };

  const giveOpponentDetails = (user) => {
    socket.emit("give_opponent_details", user);
  };

  // const createTestingRoom = () => {
    
  // }
  
  // React Functions
  // Retrieve user info from cookies when the component mounts
  useEffect(() => {
    const cookies = new Cookies();
    const userId = cookies.get("userId");
    const username = cookies.get("username");
    setUser({ userId, username });
    const getAvailableRooms = () => {
      socket.emit("get_available_rooms");
    };
    // Request available rooms from the server
    getAvailableRooms();
    // Listen for available rooms from the server
    socket.on("available_rooms", (rooms) => {
      setAvailableRooms(rooms);
    });
    socket.on("game_turn", (gameTurn) => {
      cookies.set("gameTurn", gameTurn);
    });
    socket.on("room_left", () => {
      setRoom("");
      setWaitRoom(false);
      setOpponent({ userId: null, username: null });
    });
    // Listen for opponent details from the server only once
    const opponentDetailsListener = (opponent) => {
      if (opponent.userId !== user.userId) {
        setOpponent(opponent);
        setWaitRoom(false);
        cookies.set("opponentId", opponent.userId);
        cookies.set("opponentUsername", opponent.username);
      }
    };
    socket.on("opponent_details", opponentDetailsListener);
    // Clean up the event listener when the component unmounts
    return () => {
      socket.off("opponent_details", opponentDetailsListener);
    };
  }, [user.userId, socket]);

  useEffect(() => {
    // Add an event listener to handle page refresh
    window.addEventListener("beforeunload", leaveRoomOnRefresh);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("beforeunload", leaveRoomOnRefresh);
    };
  });

  return (
    <div className="RoomControl">
      {room ? (
        waitRoom ? (
          <>
            {/* this is the waiting room once it's selected... */}
            <h1>Reached Waiting Room State</h1>
            <p>Room Name: {room}</p>
            <p>Opponent: {opponent.username}</p>
            <p>You: {user.username}</p>
            <button onClick={leaveRoom}>Leave Game</button>
          </>
        ) : (
          <div className="GameInfo">
            {/* in-game state */}
            <h1>Reached In-Game State</h1>
            <p>Room Name: {room}</p>
            <p>Opponent: {opponent.username}</p>
            <p>You: {user.username}</p>
            <div className="Game">
              <Board setRoom={setRoom} setWaitRoom={setWaitRoom} setOpponent={setOpponent} />
              <Control>
                <MovesList />
                <TakeBack />
              </Control>
            </div>
            <button onClick={leaveRoom}>Leave Game</button>
          </div>
        )
      ) : (
        <>
          {/* Display user info */}
          <div>
            <h1>Username: {user.username}</h1>
          </div>
          {/* Room selection screen */}
          {/* <button onClick={createTestingRoom}>Make Testing Room</button> */}
          <button onClick={createRoom}>Make Room</button>
          {Object.keys(availableRooms).map((roomId) => (
            <div key={roomId}>
              {/* Display roomName as username if mapping exists */}
              <span>{`${availableRooms[roomId].creator}'s room`}</span>
              <span>{` ${availableRooms[roomId].count}/2`}</span>
              <button onClick={() => joinRoom(roomId)}>Join Room</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default RoomControl;
