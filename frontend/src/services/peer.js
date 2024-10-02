

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
        }
    }

    async setLocalDescription(ans) {
        if (this.peer) {
          await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
        }
      }

    async getOffer() {
        if(this.peer){
            const offer = await this.peer.createOffer()
            await this.peer.setLocalDescription(new RTCSessionDescription(offer))
            return offer;
        }
    }

    async getAnswer(offer){
        if(this.peer){
            await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
            const ans = await this.peer.createAnswer();
            await this.peer.setLocalDescription(new RTCSessionDescription(ans))
            return ans
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