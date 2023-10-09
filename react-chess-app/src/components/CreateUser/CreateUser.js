import React, { useState } from "react";
import Cookies from "universal-cookie";
import Axios from "axios";

function CreateUser({ setIsAuth }) {
  const [user, setUser] = useState("");
  const cookies = new Cookies();

  const createUser = () => {
    Axios.post("/createUser", user).then((res) => {
      const { userId, username } = res.data;

      cookies.set("userId", userId);
      cookies.set("username", username);
      setIsAuth(true);
    });
  };
  return (
    <div className="createUser">
      <label>Create Username</label>
      <input
        placeholder="Enter a username"
        onChange={(event) => {
          setUser({ ...user, username: event.target.value });
        }}
      />
      <button onClick={createUser}>Enter As User...</button>
    </div>
  );
}

export default CreateUser;
