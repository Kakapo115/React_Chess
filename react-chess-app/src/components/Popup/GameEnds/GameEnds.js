import { useAppContext } from "../../../contexts/Context";
import { Status } from "../../../constant";
import "./GameEnds.css";
import { setupNewGame } from "../../reducer/actions/game";
import Cookies from "universal-cookie";
import { useEffect } from "react";

const GameEnds = ({ onClosePopup }) => {
  const {
    appState: { status },
    dispatch,
    socket,
  } = useAppContext();

  const cookies = new Cookies();
  const roomName = cookies.get("roomName");
  const user = {
    userId: cookies.get("userId"),
    username: cookies.get("username"),
  };

  const isWin = status.endsWith("wins");

  const newGame = () => {
    socket.emit("send_restart_game", roomName);
    console.log("send_restart_game");
    dispatch(setupNewGame());
  };

  const leaveRoom = () => {
    socket.emit("leave_room", { user, roomName });
  };

  useEffect(() => {
    const cookies = new Cookies();
    socket.on("restart_game_received", () => {
      console.log("restart_game_received");
      dispatch(setupNewGame());
      var gameTurn = "w";
      cookies.set("gameTurn", gameTurn);
    });
  }, [dispatch, socket]);

  if (status === Status.ongoing || status === Status.promoting) return null;

  return (
    <div className="popup-inner popup--inner__center">
      <h1>{isWin ? status : "Draw"}</h1>
      <p>{!isWin && status}</p>
      <div className={status}></div>
      <button onClick={newGame}>New Game</button>
      <button onClick={leaveRoom}>Leave Room</button>
    </div>
  );
};

export default GameEnds;
