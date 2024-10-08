import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Components/Home";
import Lobby from "./Components/Lobby";
import Calling from "./Components/Calling";
import Room from "./Components/Room";
import { SocketProvider } from "./Context/Socket";


function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/lobby",
      element: <Lobby />,
    },
    {
      path: "/calling/:id",
      element: <Calling />,
    },
    {
      path: "/room/:id",
      element: <Room />,
    },
  ]);

  return (
    <SocketProvider>
      <RouterProvider router={router} />
    </SocketProvider>
  );
}

export default App;

// const displayMediaOptions = {
//   video: {
//     displaySurface: "browser",
//   },
//   audio: {
//     suppressLocalAudioPlayback: false,
//   },
//   preferCurrentTab: false,
//   selfBrowserSurface: "exclude",
//   systemAudio: "include",
//   surfaceSwitching: "include",
//   monitorTypeSurfaces: "include",
// };
