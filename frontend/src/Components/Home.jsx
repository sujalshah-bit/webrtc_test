import {  useState } from "react";
import ReactPlayer from "react-player";
import Nav from "./Nav";


const Home = () => {
    const [myStream, setMyStream] = useState(null); // State to store webcam stream
    const [screenStream, setScreenStream] = useState(null); // State to store screen-sharing stream
    const [error, setError] = useState(null); // Error state for media access
    const [isScreenSharing, setIsScreenSharing] = useState(false); // Toggle screen sharing
    const [isWebcamSharing, setIsWebcamSharing] = useState(false); // Toggle webcam sharing
  
    // Function to get the user's webcam and microphone stream
    const getMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log("Webcam Stream:", stream);
        setMyStream(stream); // Set the webcam stream
        console.log({ stream });
        setIsWebcamSharing(true);
      } catch (err) {
        setError(err.message);
        console.error("Error accessing media devices:", err);
      }
    };
  
    const stopMediaStream = () => {
      if (myStream) {
        // Stop all video tracks
        myStream.getVideoTracks().forEach((track) => track.stop());
        // Stop all audio tracks
        myStream.getAudioTracks().forEach((track) => track.stop());
        setIsWebcamSharing(true);
  
        console.log("Webcam Stream stopped.");
      }
    };
  
    // Function to capture screen
    const startScreenCapture = async () => {
      const displayMediaOptions = {
        video: {
          displaySurface: "monitor",
        },
        audio: false, // Change to true if you want to capture audio from the system
      };
  
      try {
        const captureStream = await navigator.mediaDevices.getDisplayMedia(
          displayMediaOptions
        );
        setScreenStream(captureStream);
        console.log({ captureStream });
  
        setIsScreenSharing(true);
        console.log("Screen Capture Stream:", captureStream);
      } catch (err) {
        setError(`Error capturing screen: ${err.message}`);
        console.error(`Error: ${err}`);
      }
    };
  
    // Stop screen sharing and switch back to webcam stream
    const stopScreenCapture = () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => {
          console.log(track);
          track.stop();
        }); // Stop the screen capture stream
        setScreenStream(null); // Reset the screen stream
        setIsScreenSharing(false);
      }
    };
  
    // Handle start/stop screen sharing toggle
    const toggleScreenSharing = () => {
      if (isScreenSharing) {
        stopScreenCapture();
      } else {
        startScreenCapture();
      }
    };
  
    // Handle start/stop webcam sharing toggle
    const toogleWebcamSharing = () => {
      if (isWebcamSharing) {
        stopMediaStream();
      } else {
        getMediaStream();
      }
    };
  
    // Fetch webcam stream when the component mounts
    // useEffect(() => {
    //   getMediaStream();
    // }, []);
  return (
    <div>
        <Nav/>
        <h1>WebRTC App</h1>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <div className="video-section">
          <h3>Webcam {isWebcamSharing ? "(Active)" : "(Not Active)"}</h3>
          {myStream && (
            <ReactPlayer
              playing
              muted
              width={"500px"}
              height={"200px"}
              url={myStream}
              controls={true}
            />
          )}
        </div>
        <div className="controls">
          <button onClick={toogleWebcamSharing}>
            {isWebcamSharing ? "Stop webcam Sharing" : "Start webcam Sharing"}
          </button>
        </div>

        <div className="screen-share-section">
          <h3>
            Screen Sharing {isScreenSharing ? "(Active)" : "(Not Active)"}
          </h3>
          {screenStream ? (
            <ReactPlayer
              playing
              width={"300px"}
              height={"200px"}
              url={screenStream}
              controls={true}
            />
          ) : (
            <p>Screen sharing is not active.</p>
          )}
        </div>

        <div className="controls">
          <button onClick={toggleScreenSharing}>
            {isScreenSharing ? "Stop Screen Sharing" : "Start Screen Sharing"}
          </button>
        </div>
      </div>
  )
}

export default Home