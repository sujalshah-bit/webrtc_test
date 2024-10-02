import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function VideoCall() {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  
  const config = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  };

  useEffect(() => {
    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleNewICECandidateMsg);

    return () => {
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, []);

  const startCall = async () => {
    peerConnection.current = new RTCPeerConnection(config);
    peerConnection.current.onicecandidate = handleICECandidateEvent;
    peerConnection.current.ontrack = handleTrackEvent;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    
    stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit('offer', { sdp: offer, target: 'peer_socket_id' }); // Replace with the target user's socket ID
  };

  const handleReceiveOffer = async (offer) => {
    peerConnection.current = new RTCPeerConnection(config);
    peerConnection.current.onicecandidate = handleICECandidateEvent;
    peerConnection.current.ontrack = handleTrackEvent;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    
    stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    socket.emit('answer', { sdp: answer, target: offer.source });
  };

  const handleReceiveAnswer = async (answer) => {
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer.sdp));
  };

  const handleNewICECandidateMsg = async (message) => {
    try {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { target: 'peer_socket_id', candidate: event.candidate }); // Replace with peer's socket ID
    }
  };

  const handleTrackEvent = (event) => {
    setRemoteStream(event.streams[0]);
    remoteVideoRef.current.srcObject = event.streams[0];
  };

  const startScreenSharing = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    setIsScreenSharing(true);
    screenStream.getTracks().forEach(track => {
      const sender = peerConnection.current.getSenders().find(s => s.track.kind === 'video');
      sender.replaceTrack(track);
    });
  };

  const stopScreenSharing = () => {
    const stream = localVideoRef.current.srcObject;
    const videoTrack = stream.getVideoTracks()[0];
    const sender = peerConnection.current.getSenders().find(s => s.track.kind === 'video');
    sender.replaceTrack(videoTrack);
    setIsScreenSharing(false);
  };

  return (
    <div>
      <div>
        <video ref={localVideoRef} autoPlay muted />
        <video ref={remoteVideoRef} autoPlay />
      </div>
      <button onClick={startCall}>Start Call</button>
      <button onClick={isScreenSharing ? stopScreenSharing : startScreenSharing}>
        {isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
      </button>
    </div>
  );
}
