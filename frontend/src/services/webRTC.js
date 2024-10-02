import io from 'socket.io-client';

class WebRTCHandler {
  constructor(serverUrl, localVideoRef, remoteVideoRef) {
    this.serverUrl = serverUrl;
    this.localVideoRef = localVideoRef;
    this.remoteVideoRef = remoteVideoRef;
    this.socket = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.screenStream = null;

    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }
    ];
  }

  log(message, value) {
    console.log(`[WebRTCHandler] ${message} Value: ${value}`);
  }

  error(message) {
    console.error(`[WebRTCHandler] ${message}`);
  }

  async initialize() {
    this.socket = io(this.serverUrl);

    this.socket.on('offer', this.handleOffer);
    this.socket.on('answer', this.handleAnswer);
    this.socket.on('ice-candidate', this.handleIceCandidate);

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localVideoRef.current.srcObject = this.localStream;
    } catch (err) {
      this.error('Error accessing media devices: ' + err);
    }
  }

  async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', event.candidate);
        this.log('ICE candidate emitted', event.candidate);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      this.log('ICE connection state: ' + this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.log('Connection state: ' + this.peerConnection.connectionState);
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteVideoRef.current.srcObject = event.streams[0];
      this.log('Remote track received', event.streams[0]);
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.log('Peer connection created');
  }

  setupDataChannel() {
    this.dataChannel.onopen = () => this.log('Data channel opened');
    this.dataChannel.onmessage = (event) => this.log('Data channel message: ' + event.data);
  }

  async startCall() {
    await this.createPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel('chat');
    this.setupDataChannel();

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.socket.emit('offer', this.peerConnection.localDescription);
      this.log('Offer sent', this.peerConnection.localDescription);
    } catch (err) {
      this.error('Error creating offer: ' + err);
    }
  }

  handleOffer = async (offer) => {
    await this.createPeerConnection();

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket.emit('answer', this.peerConnection.localDescription);
      this.log('Answer sent', this.peerConnection.localDescription);
    } catch (err) {
      this.error('Error handling offer: ' + err);
    }
  };

  handleAnswer = async (answer) => {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      this.log('Answer received', answer);
    } catch (err) {
      this.error('Error handling answer: ' + err);
    }
  };

  handleIceCandidate = async (candidate) => {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      this.log('ICE candidate added',candidate);
    } catch (err) {
      this.error('Error handling ICE candidate: ' + err);
    }
  };

  closeConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    this.log('Peer connection closed');
  }
}

export default WebRTCHandler;