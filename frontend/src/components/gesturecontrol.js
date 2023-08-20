import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

let gestureRecognizer;
let results = undefined;
let prev_state = false;
let lastVideoTime = -1;

const GestureControl = () => {
  const [open, setOpen] = useState(false);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  const navigate = useNavigate();
  const videoEl = useRef(null);

  const options = {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
      delegate: "GPU",
    },
    numHands: 1,
    runningMode: "VIDEO",
  };

  const setUp = async () => {
    // fetching the model from mediapipe

    // path/to/wasm/root
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(
      filesetResolver,
      options
    );
  };

  const predict = async (e) => {
    let nowInMs = Date.now();
    let video = videoEl.current;

    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    let state = false;

    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        const tempX = (1 - landmarks[8].x) * 1920;
        const tempY = landmarks[8].y * 1080;

        setPosX(tempX);
        setPosY(tempY);

        if (
          Math.pow(landmarks[4].x - landmarks[8].x, 2) +
            Math.pow(landmarks[4].y - landmarks[8].y, 2) <
          0.002
        ) {
          state = true;
        }

        // click in different routes.
        if (prev_state === false && state === true) {
        }

        prev_state = state;
      }
    }

    window.requestAnimationFrame(predict);
  };

  const getVideo = () => {
    if (open === false) {
      navigator.mediaDevices
        .getUserMedia({
          //   video: { width: 640, height: 480, frameRate: { ideal: 1, max: 3 } },
          video: { width: 1080, height: 720 },
        })
        .then((stream) => {
          console.log(stream);
          let video = videoEl.current;
          video.srcObject = stream;
          video.addEventListener("loadeddata", predict);
        })
        .catch((err) => {
          console.log(err);
        });
      setOpen(true);
    }
  };

  const getPicture = () => {};

  useEffect(() => {
    // called when component is mount
    setUp();
    getVideo();
  }, []);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: posX,
          top: posY,
          backgroundColor: "#fc2c03",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          zIndex: 1,
        }}
      />
      <video
        id="video"
        autoPlay
        ref={videoEl}
        style={{ zIndex: 1, display: "none" }}
      />
      <Outlet />
    </>
  );
};

export default GestureControl;
