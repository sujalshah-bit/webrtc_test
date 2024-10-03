import React, { useEffect, useCallback, useState, useRef } from "react";
import ReactPlayer from "react-player";
import peer from "../services/peer";
import { useSocket } from "../Context/Socket";

const RoomPage = React.memo(() => {

  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(peer);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });
      setMyStream(stream);
      const offer = await peerRef.current.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
    } catch (error) {
      console.error("Error in handleCallUser:", error);
    }
  }, [remoteSocketId, socket]);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      console.dir(myStream)
      console.dir(track)
      peerRef.current.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    try {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });
      setMyStream(stream);
      const ans = await peerRef.current.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    } catch (error) {
      console.error("Error in handleIncomingCall:", error);
    }
  }, [ socket]);


  const handleCallAccepted = useCallback(({ ans }) => {
    peerRef.current.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    try {
      const offer = await peerRef.current.getOffer();
      socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    } catch (error) {
      console.error("Error in handleNegoNeeded:", error);
    }
  }, [remoteSocketId, socket]);

  const handleNegoIncoming = useCallback(async ({ from, offer }) => {
    try {
      const ans = await peerRef.current.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    } catch (error) {
      console.error("Error in handleNegoIncoming:", error);
    }
  }, [socket]);

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peerRef.current.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    const currentPeer = peerRef.current;
    peerRef.current.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    peerRef.current.peer.addEventListener("track", ev => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      console.dir(remoteStream)
      setRemoteStream(remoteStream[0]);
    });

    return () => {
      currentPeer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    const socketEvents = [
      ["user:joined", handleUserJoined],
      ["incomming:call", handleIncomingCall],
      ["call:accepted", handleCallAccepted],
      ["peer:nego:needed", handleNegoIncoming],
      ["peer:nego:final", handleNegoFinal]
    ];

    socketEvents.forEach(([event, handler]) => socket.on(event, handler));

    return () => socketEvents.forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoIncoming, handleNegoFinal]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer playing muted height="250px" width="500px" url={myStream} />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer playing  height="250px" width="500px" url={remoteStream} />
        </>
      )}
    </div>
  )
});

RoomPage.displayName = 'RoomPage';

export default RoomPage;