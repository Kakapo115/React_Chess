import "./App.css";
import AppContext from "./contexts/Context";
import { reducer } from "./components/reducer/reducer";
import { useEffect, useReducer, useState } from "react";
import { initGameState } from "../src/constant";
import CreateUser from "./components/CreateUser/CreateUser";
import Cookies from "universal-cookie";
import Axios from "axios";
import RoomControl from "./components/RoomControl/RoomControl";
import io from "socket.io-client";

const socket = io.connect("http://localhost:8000");

function App() {
  Axios.defaults.baseURL = "http://localhost:8000";
  Axios.defaults.withCredentials = true;
  const cookies = new Cookies();
  const userId = cookies.get("userId");
  const [appState, dispatch] = useReducer(reducer, initGameState);
  // const providerState = {
  //   appState,
  //   dispatch,
  // };
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check if userId exists and set isAuth accordingly on app startup
    if (userId !== undefined) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
    }
  }, [userId]); // This effect will run whenever userId changes

  return (
    <AppContext.Provider value={{ appState, dispatch, socket }}>
      <div className="App">
        {isAuth ? <RoomControl /> : <CreateUser setIsAuth={setIsAuth} />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
