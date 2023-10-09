import "./Pieces.css";
import Piece from "./Piece";
import { useEffect, useRef, useCallback } from "react"; // useState
// import { createPosition } from "../../helper";
import { useAppContext } from "../../contexts/Context";
import { clearCandidates, makeNewMove } from "../reducer/actions/move";
import arbiter from "../../arbiter/arbiter";
import { openPromotion } from "../reducer/actions/popup";
import { getCastleDirections } from "../../arbiter/getMoves";
import {
  updateCastling,
  detectStalemate,
  detectInsufficientMaterial,
  detectCheckmate,
} from "../reducer/actions/game";
import { copyPosition, getNewMoveNotation } from "../../helper";
import Cookies from "universal-cookie";

const Pieces = () => {
  // const [state, setState] = useState(createPosition());
  const ref = useRef();
  const { appState, dispatch, socket } = useAppContext();

  const currentPosition = appState.position[appState.position.length - 1];

  const calculateCoords = (e) => {
    const { width, left, top } = ref.current.getBoundingClientRect();
    const size = width / 8;
    const y = Math.floor((e.clientX - left) / size);
    const x = 7 - Math.floor((e.clientY - top) / size);
    return { x, y };
  };

  const updateCastlingState = ({ piece, rank, file }) => {
    const direction = getCastleDirections({
      castleDirection: appState.castleDirection,
      piece,
      rank,
      file,
    });
    if (direction) {
      dispatch(updateCastling(direction));
    }
  };

  const openPromotionBox = ({ rank, file, x, y }) =>
    dispatch(openPromotion({ rank: Number(rank), file: Number(file), x, y }));

  const move = (e) => {
    const { x, y } = calculateCoords(e);
    const [piece, rank, file] = e.dataTransfer.getData("text").split(",");
    // Getting info from cookies
    const cookies = new Cookies();
    const gameTurn = cookies.get("gameTurn");
    const pieceColor = cookies.get("pieceColor");
    const roomName = cookies.get("roomName");
    if (gameTurn === pieceColor) {
      if (appState.candidateMoves?.find((m) => m[0] === x && m[1] === y)) {
        const opponent = piece.startsWith("b") ? "w" : "b";
        const castleDirection =
          appState.castleDirection[`${piece.startsWith("b") ? "w" : "b"}`];

        if ((piece === "wp" && x === 7) || (piece === "bp" && x === 0)) {
          openPromotionBox({ rank, file, x, y });
          return;
        }
        if (piece.endsWith("r") || piece.endsWith("k")) {
          updateCastlingState({ piece, rank, file });
        }
        const newPosition = arbiter.performMove({
          position: currentPosition,
          piece,
          rank,
          file,
          x,
          y,
        });

        const newMove = getNewMoveNotation({
          piece,
          rank,
          file,
          x,
          y,
          position: currentPosition,
        });

        dispatch(makeNewMove({ newPosition, newMove }));

        if (arbiter.insufficientMaterial(newPosition)) {
          dispatch(detectInsufficientMaterial());
        } else if (
          arbiter.isStalemate(newPosition, opponent, castleDirection)
        ) {
          dispatch(detectStalemate());
        } else if (
          arbiter.isCheckMate(newPosition, opponent, castleDirection)
        ) {
          dispatch(detectCheckmate(piece[0]));
        }
        const newGameTurn = gameTurn === "w" ? "b" : "w";
        cookies.set("gameTurn", newGameTurn);
        socket.emit("sending_move", { x, y, piece, rank, file, roomName });
      }
    }
    dispatch(clearCandidates());
  };

  const moveRecieved = useCallback(({ x, y, rank, piece, file, gameTurn }) => {
    const cookies = new Cookies();
    cookies.set("gameTurn", gameTurn);
    const opponent = piece.startsWith("b") ? "w" : "b";
    const castleDirection =
      appState.castleDirection[`${piece.startsWith("b") ? "w" : "b"}`];

    const newPosition = arbiter.performMove({
      position: currentPosition,
      piece,
      rank,
      file,
      x,
      y,
    });

    const newMove = getNewMoveNotation({
      piece,
      rank,
      file,
      x,
      y,
      position: currentPosition,
    });

    dispatch(makeNewMove({ newPosition, newMove }));

    if (arbiter.insufficientMaterial(newPosition)) {
      dispatch(detectInsufficientMaterial());
    } else if (arbiter.isStalemate(newPosition, opponent, castleDirection)) {
      dispatch(detectStalemate());
    } else if (arbiter.isCheckMate(newPosition, opponent, castleDirection)) {
      dispatch(detectCheckmate(piece[0]));
    }
  },[appState, currentPosition, dispatch]);

  const onDrop = (e) => {
    e.preventDefault();
    move(e);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const upgradePiece = useCallback(({ option, promotionSquare, color, gameTurn }) => {
    const cookies = new Cookies();
    cookies.set("gameTurn", gameTurn);
    const newPosition = copyPosition(
      appState.position[appState.position.length - 1]
    );

    newPosition[promotionSquare.rank][promotionSquare.file] = "";
    newPosition[promotionSquare.x][promotionSquare.y] = color + option;

    const newMove = getNewMoveNotation({
      ...promotionSquare,
      piece: color + "p",
      promotesTo: option,
      position: appState.position[appState.position.length - 1],
    });

    dispatch(makeNewMove({ newPosition, newMove }));
  },[appState, dispatch]);

  useEffect(() => {
    // Getting info from cookies
    const cookies = new Cookies();
    const pieceColor = cookies.get("pieceColor");

    // Handling opponents moves
    const handleMoveReceived = ({ x, y, rank, piece, file, gameTurn }) => {
      if (gameTurn === pieceColor) {
        moveRecieved({ x, y, rank, piece, file, gameTurn });
      }
    };
    socket.on("move_received", handleMoveReceived);

    // Handling opponent upgrades
    const handleUpgradePiece = ({option, promotionSquare, color, gameTurn}) => {
      upgradePiece({ option, promotionSquare, color, gameTurn });
    };
    socket.on("piece_upgraded", handleUpgradePiece);

    return () => {
      // Clean up the subscription when the component unmounts
      socket.off("move_received", handleMoveReceived);
      socket.off("piece_upgraded", handleUpgradePiece);
    };
  }, [moveRecieved, upgradePiece, socket]);

  return (
    <div className="pieces" ref={ref} onDrop={onDrop} onDragOver={onDragOver}>
      {currentPosition.map((r, rank) =>
        r.map((f, file) =>
          currentPosition[rank][file] ? (
            <Piece
              key={rank + "-" + file}
              rank={rank}
              file={file}
              piece={currentPosition[rank][file]}
            />
          ) : null
        )
      )}
    </div>
  );
};

export default Pieces;
