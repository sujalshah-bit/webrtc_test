// Calling.jsx
import React, { useEffect, useCallback, useRef } from "react";
import peer from "../services/peer";
import { useSocket } from "../Context/Socket";
import { useNavigate } from "react-router-dom";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaStop,
  FaPhoneSlash,
} from "react-icons/fa";
import { RiCameraLensLine } from "react-icons/ri";
import CustomReactPlayer from "./CustomReactPlayer";
import useStore from "../store/videoCallStore";

const Room = React.memo(() => {
  const socket = useSocket();
  const navigate = useNavigate();
  const { 
    // user, 
    currentRoom, 
    isCallActive, 
    myStream, 
    remoteStream, 
    isMuted, 
    isVideoOff,
    isScreenSharing,
    // remoteUser,
    // setUser,
    // setCurrentRoom,
    setRemoteSocketId,
    remoteSocketId,
    setIsCallActive,
    setMyStream,
    setRemoteStream,
    streamKey,
    incrementStreamKey,
    setIsMuted,
    setIsVideoOff,
    setIsScreenSharing,
    // setRemoteUser,
    resetCallState,
    initializeCall
  } = useStore();
  const peerRef = useRef(peer);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, [setRemoteSocketId]);

  const getScreenAndAudio = useCallback(async (preference = "screenShare") => {
    let displayStream;
    if (preference === "screenShare") {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "window" }, // or 'window' or 'application' based on the use case
        audio: false, // This will get the screen without system audio
      });
    } else {
      displayStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
    }

    // Get microphone audio separately
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // Combine video from screen and audio from microphone
    const combinedStream = new MediaStream([
      ...displayStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);
    return combinedStream;
  }, []);

  const replaceTracks = useCallback(
    async (newStream) => {
      const currentPeer = peerRef.current.peer;

      // Replace tracks and stop old ones in a single loop
      await Promise.all(
        myStream.getTracks().map(async (track) => {
          const sender = currentPeer
            .getSenders()
            .find((s) => s.track && s.track.kind === track.kind);

          if (sender) {
            // Replace the track with the one from newStream
            await sender.replaceTrack(
              newStream.getTracks().find((t) => t.kind === track.kind)
            );
          }

          // Stop the old track after replacing
          track.stop();
        })
      );

      // Set the new stream to myStream and force re-render
      setMyStream(newStream);
      incrementStreamKey();

      // Add any new tracks that aren't already sent
      newStream.getTracks().forEach((track) => {
        const sender = currentPeer
          .getSenders()
          .find((s) => s.track && s.track.kind === track.kind);

        if (sender) {
          // Replace the track if sender exists
          sender.replaceTrack(track);
        } else {
          // Add new track if no sender is found
          currentPeer.addTrack(track, newStream);
        }
      });
    },
    [incrementStreamKey, myStream, setMyStream]
  );

  const toggleMute = useCallback(() => {
    const audioTrack = myStream.getAudioTracks()[0];
    console.log(myStream.getAudioTracks());
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
    console.log(myStream.getAudioTracks());
  }, [myStream, setIsMuted]);

  // Example to replace screen share tracks with webcam:
  const handleSwitchToWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .catch((err) => {
          console.error("Could not get video stream:", err);
        });
      console.dir(stream);
      replaceTracks(stream); // Call the replace function with the new webcam stream
      stream.getAudioTracks()[0].enabled = !isMuted;
      stream.getVideoTracks()[0].enabled = !isVideoOff;

    } catch (error) {
      console.error("Error switching to webcam:", error);
    }
  }, [isMuted, isVideoOff, replaceTracks]);

  // Example to replace webcam tracks with screen share:
  const handleSwitchToScreenShare = useCallback(async () => {
    try {
      const stream = await getScreenAndAudio();
      console.log(stream);

      replaceTracks(stream); // Replace with the combined stream
      stream.getAudioTracks()[0].enabled = !isMuted;
      stream.getVideoTracks()[0].enabled = !isVideoOff;
    } catch (error) {
      console.error("Error switching to screen share:", error);
    }
  }, [getScreenAndAudio, isMuted, isVideoOff, replaceTracks]);
  
  const toggleVideo = useCallback(() => {
    const videoTrack = myStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled); // Sync the state with the actual video track status
    }
  }, [myStream, setIsVideoOff]);
  
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        console.log(isScreenSharing);
        // Stop sharing screen and switch back to camera
        handleSwitchToWebcam();
        setIsScreenSharing(false);
      } else {
        console.log(isScreenSharing);
        // Share the screen
        handleSwitchToScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Error in toggleScreenShare:", error);
    }
  }, [handleSwitchToScreenShare, handleSwitchToWebcam, isScreenSharing, setIsScreenSharing]);

  const handleCallUser = useCallback(async () => {
    try {
      // Create Data Channel
      peerRef.current.createDataChannel();
      const stream = await getScreenAndAudio();
      setMyStream(stream);
      initializeCall(currentRoom, stream);
      const offer = await peerRef.current.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
      setIsCallActive(true);
    } catch (error) {
      console.error("Error in handleCallUser:", error);
    }
  }, [currentRoom, getScreenAndAudio, initializeCall, remoteSocketId, setIsCallActive, setMyStream, socket]);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peerRef.current.peer.addTrack(track, myStream);
    }
  }, [myStream]);



  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      try {
        setRemoteSocketId(from);
        // Prepare to receive Data Channel
        peerRef.current.receiveDataChannel();
        const stream = await getScreenAndAudio("webCam");
        setMyStream(stream);
        const ans = await peerRef.current.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans });
        setIsCallActive(true);
        setIsScreenSharing(false)
      } catch (error) {
        console.error("Error in handleIncomingCall:", error);
      }
    },
    [getScreenAndAudio, setIsCallActive, setIsScreenSharing, setMyStream, setRemoteSocketId, socket]
  );

  const handleEndCall = useCallback(() => {
    // Stop all tracks in the local stream
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
    }

    // Close the data channel if it exists
    peerRef.current.reset();

    // Reset state
    resetCallState()

    // Emit an event to inform the other peer that the call has ended
    if (remoteSocketId) {
      socket.emit("call:ended", { to: remoteSocketId });
    }
    navigate("/lobby");
    window.location.reload();
  }, [myStream, navigate, remoteSocketId, resetCallState, socket]);

  const handleCallAccepted = useCallback(
    ({ ans }) => {
      peerRef.current.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    try {
      const offer = await peerRef.current.getOffer();
      socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    } catch (error) {
      console.error("Error in handleNegoNeeded:", error);
    }
  }, [remoteSocketId, socket]);

  const handleNegoIncoming = useCallback(
    async ({ from, offer }) => {
      try {
        const ans = await peerRef.current.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans });
      } catch (error) {
        console.error("Error in handleNegoIncoming:", error);
      }
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peerRef.current.setLocalDescription(ans);
  }, []);

  // Add a new effect to handle the "call:ended" event
  useEffect(() => {
    const handleCallEnded = () => {
      handleEndCall();
    };

    socket.on("call:ended", handleCallEnded);

    return () => {
      socket.off("call:ended", handleCallEnded);
    };
  }, [socket, handleEndCall]);

  useEffect(() => {
    const currentPeer = peerRef.current;
    peerRef.current.peer.addEventListener(
      "negotiationneeded",
      handleNegoNeeded
    );
    peerRef.current.peer.addEventListener("track", (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });

    return () => {
      currentPeer.peer.removeEventListener(
        "negotiationneeded",
        handleNegoNeeded
      );
    };
  }, [handleNegoNeeded, setRemoteStream]);

  useEffect(() => {
    const socketEvents = [
      ["user:joined", handleUserJoined],
      ["incomming:call", handleIncomingCall],
      ["call:accepted", handleCallAccepted],
      ["peer:nego:needed", handleNegoIncoming],
      ["peer:nego:final", handleNegoFinal],
    ];

    socketEvents.forEach(([event, handler]) => socket.on(event, handler));

    return () =>
      socketEvents.forEach(([event, handler]) => socket.off(event, handler));
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoIncoming,
    handleNegoFinal,
  ]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {!isCallActive && remoteSocketId && (
        <button onClick={handleCallUser}>CALL</button>
      )}
      {isCallActive && (
        <>
          <button onClick={toggleMute}>
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button onClick={toggleVideo}>
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button onClick={toggleScreenShare}>
            {isScreenSharing ? <RiCameraLensLine /> : <FaDesktop />}
          </button>
          <button onClick={handleEndCall}>
            <FaPhoneSlash />
          </button>
        </>
      )}
      {/* My Stream Player */}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <CustomReactPlayer
            myStream={myStream}
            isVideoOff={isVideoOff}
            streamKey={streamKey}
            isMuted={isMuted}
          />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <CustomReactPlayer myStream={remoteStream} />
        </>
      )}

      {isCallActive && (
        <div>
          <input
            type="text"
            placeholder="Type your message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value !== "") {
                peerRef.current.dataChannel.send(e.target.value); // Send the message
                e.target.value = ""; // Clear the input after sending
              }
            }}
          />
        </div>
      )}
    </div>
  );
});

Room.displayName = "Room";

export default Room;
