import { useCallback, useEffect, useState } from "react";
import Nav from "./Nav";
import { useSocket } from "../Context/Socket";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const socket = useSocket();
  const navigate = useNavigate()
  const [detail, setDetail] = useState({ email: "", room: "" });
  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", detail);
    },
    [detail, socket]
  );
  useEffect(() => {
    console.log('lobby')
    const handleJoinRoom = (data) => {
      console.dir(data);
      navigate(`/calling/${data.room}`)
    };
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [navigate, socket]);

  return (
    <div>
      <Nav />
      <form action="">
        <label htmlFor="email">Email Id</label>
        <input
          onChange={(e) => setDetail({ ...detail, email: e.target.value })}
          value={detail.email}
          type="email"
          name="email"
          id="email"
        />
        <br />
        <label htmlFor="room">Room no.</label>
        <input
          onChange={(e) => setDetail({ ...detail, room: e.target.value })}
          value={detail.room}
          type="text"
          name="room"
          id="room"
        />
        <br />
        <button onClick={(e) => handleClick(e)}>join</button>
      </form>
    </div>
  );
};

export default Lobby;
