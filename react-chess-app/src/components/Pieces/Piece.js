import { useAppContext } from "../../contexts/Context";
import arbiter from "../../arbiter/arbiter";
import { generateCandidateMoves } from "../reducer/actions/move";
import Cookies from "universal-cookie";

const Piece = ({ rank, file, piece }) => {
  const { appState, dispatch } = useAppContext();
  const { turn, position: currentPosition, castleDirection } = appState;

  const onDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${piece},${rank},${file}`);
    setTimeout(() => {
      e.target.style.display = "none";
    }, 0);

    const cookies = new Cookies();
    const myTurn = cookies.get("pieceColor");
    const gameTurn = cookies.get("gameTurn");
    if (myTurn === piece[0] && gameTurn === myTurn) {
      const candidateMoves = arbiter.getValidMoves({
        position: currentPosition[currentPosition.length - 1],
        prevPosition: currentPosition[currentPosition.length - 2],
        castleDirection: castleDirection[myTurn],
        piece,
        rank,
        file,
      });
      dispatch(generateCandidateMoves({ candidateMoves }));
    }
  };

  const onDragEnd = (e) => {
    e.target.style.display = "block";
  };

  return (
    <div
      className={`piece ${piece} p-${file}${rank}`}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    />
  );
};

export default Piece;
