import { useAppContext } from "../../../contexts/Context";
import { takeBack } from "../../reducer/actions/move";
import Cookies from "universal-cookie";
import { useEffect } from "react";

const TakeBack = () => {
  const { dispatch, socket } = useAppContext();
  const cookies = new Cookies();
  const roomName = cookies.get("roomName");
  const gameTurn = cookies.get("gameTurn");

  const doTakeBack = () => {
    socket.emit("sending_takeback", roomName);
    dispatch(takeBack());
    const newGameTurn = gameTurn === "w" ? "b" : "w";
    cookies.set("gameTurn", newGameTurn);
  };

  useEffect(() => {
    socket.on("received_takeback", () => {
      dispatch(takeBack());
      const newGameTurn = gameTurn === "w" ? "b" : "w";
      cookies.set("gameTurn", newGameTurn);
    });
  });

  return (
    <div>
      <button onClick={doTakeBack}>Take Back</button>
    </div>
  );
};
export default TakeBack;
