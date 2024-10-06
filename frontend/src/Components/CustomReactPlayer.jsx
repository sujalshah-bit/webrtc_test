import  { useState } from "react";
import ReactPlayer from "react-player";

// eslint-disable-next-line react/prop-types
const CustomReactPlayer = ({ myStream, isVideoOff = false, streamKey = "", isMuted = false }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const fullScreenStyles = isFullScreen
  ? {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 9999,
      backgroundColor: "black",
    }
  : {
      width: "500px", // Normal size when not in full screen
      height: "250px",
      position: "relative", // Keeps it within its normal container
    };

  return (
    <div style={fullScreenStyles}>
            {!isVideoOff ? (
              <ReactPlayer
                key={streamKey}
                playing
                muted={isMuted}
                height="100%"
                width="100%"
                url={myStream}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  backgroundColor: "#333",
                  color: "white",
                  fontSize: "20px",
                }}
              >
                Video is off
              </div>
            )}

            {/* Full Screen Toggle Button */}
            <button
              onClick={toggleFullScreen}
              style={{
                position: "absolute",
                top: isFullScreen ? "20px" : "10px", // Adjust the button's position
                right: "10px", // Aligns to the right
                zIndex: 10000, // Ensure it stays on top of video player
                backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background for better visibility
                color: "white", // Button text color
                padding: "10px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              {isFullScreen ? "Exit Full Screen" : "Full Screen"}
            </button>
          </div>
    
  );
};

export default CustomReactPlayer;
