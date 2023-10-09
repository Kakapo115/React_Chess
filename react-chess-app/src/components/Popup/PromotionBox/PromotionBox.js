import { useAppContext } from "../../../contexts/Context";
import { copyPosition, getNewMoveNotation } from "../../../helper";
import { clearCandidates, makeNewMove } from "../../reducer/actions/move";
import "./PromotionBox.css";
import Cookies from "universal-cookie";

const PromotionBox = ({ onClosePopup }) => {
  const options = ["q", "r", "b", "n"];
  const cookies = new Cookies();
  const roomName = cookies.get("roomName");
  const { appState, dispatch, socket } = useAppContext();
  const { promotionSquare } = appState;
  const color = promotionSquare && promotionSquare.x === 7 ? "w" : "b";

  const getPromotionBoxPosition = () => {
    const style = {};

    if (promotionSquare.x === 7) {
      style.top = "-12.5%";
    } else {
      style.top = "97.5%";
    }

    if (promotionSquare.y <= 1) {
      style.left = "0%";
    } else if (promotionSquare.y >= 6) {
      style.right = "0%";
    } else {
      style.left = `${12.5 * promotionSquare.y - 20}%`;
    }
    return style;
  };

  const upgradePiece = (option) => {
    console.log("upgrading to piece " + option);
    const newPosition = copyPosition(
      appState.position[appState.position.length - 1]
    );

    newPosition[promotionSquare.rank][promotionSquare.file] = "";
    newPosition[promotionSquare.x][promotionSquare.y] = color + option;

    dispatch(clearCandidates());

    const newMove = getNewMoveNotation({
      ...promotionSquare,
      piece: color + "p",
      promotesTo: option,
      position: appState.position[appState.position.length - 1],
    });

    dispatch(makeNewMove({ newPosition, newMove }));
  };

  const onClick = (option) => {
    onClosePopup();

    upgradePiece(option);

    // emit change to opponent
    socket.emit("piece_upgrade", { option, roomName, promotionSquare, color });
  };

  if (!promotionSquare) {
    return null;
  }

  return (
    <div
      className="popup-inner promotion-choices"
      style={getPromotionBoxPosition()}
    >
      {options.map((option) => (
        <div
          className={`piece ${color}${option}`}
          key={option}
          onClick={() => onClick(option)}
        ></div>
      ))}
    </div>
  );
};

export default PromotionBox;
