

class PeerService {
    constructor() {
        if (!this.peer) {
            this.peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:global.stun.twilio.com:3478",
                        ],
                    },
                ],
            });
            this.dataChannel = null;  // This will store the Data Channel instance
        }
    }

    async setLocalDescription(ans) {
        if (this.peer) {
            await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
        }
    }

    async getOffer() {
        if (this.peer) {
            const offer = await this.peer.createOffer()
            await this.peer.setLocalDescription(new RTCSessionDescription(offer))
            return offer;
        }
    }

    async getAnswer(offer) {
        if (this.peer) {
            await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans))
            return ans
        }
    }

    createDataChannel() {
        if (this.peer) {
            // Creating a data channel on the peer
            this.dataChannel = this.peer.createDataChannel("chat");

            // Add event listeners for the data channel
            this.dataChannel.onopen = () => {
                console.log("Data Channel is open");
            };

            this.dataChannel.onmessage = (event) => {
                console.log("Message from Data Channel:", event.data);
                // Handle the received message here
            };
        }
    }

    receiveDataChannel() {
        if (this.peer) {
            // Listen for a data channel on the remote peer
            this.peer.ondatachannel = (event) => {
                this.dataChannel = event.channel;

                this.dataChannel.onopen = () => {
                    console.log("Data Channel is open");
                };

                this.dataChannel.onmessage = (event) => {
                    console.log("Message from Data Channel:", event.data);
                    // Handle the received message here
                };
            };
        }
    }

    // Optional: Handle ICE candidates
    addIceCandidateHandler(callback) {
        this.peer.onicecandidate = (event) => {
            if (event.candidate) {
                callback(event.candidate);
            }
        };
    }

}

export default new PeerService;