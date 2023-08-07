import React, { useEffect, useState } from "react";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

let lastVideoTime = -1;
// let lastFingerx = 0.5;
// let lastFingerz = 0;
let gestureRecognizer;
let results = undefined;

const TestButton = ({ posx, posy, width, height, text, isInside }) => {
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: isInside ? "#2e3ef2" : "#0f1db8",
        left: posx,
        top: posy,
        width: width,
        height: height,
      }}
    >
      {text}
    </div>
  );
};

const VideoTest = () => {
  const [open, setOpen] = useState(false);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

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

  // const handleMove = (e) => {
  //   console.log("mouse:", e.clientX);
  // };

  const predict = (e) => {
    const nowInMs = Date.now();
    let video = document.getElementById("video");
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    }

    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        // if (landmarks[11].x - lastFingerx > 0.2) {
        //   console.log("leftswipe");
        // }
        // if (landmarks[11].x - lastFingerx < -0.2) {
        //   console.log("rightswipe");
        // }
        // console.log((1 - landmarks[7].x) * 1920);
        // if (landmarks[7].z - lastFingerz < -0.05) {
        //   console.log("press");
        // }

        setPosX((1 - landmarks[7].x) * 1920);
        setPosY(landmarks[7].y * 1080);
        // console.log(landmarks[11].x, landmarks[11].y); //middle finger's position.
      }
    }

    // if (results.gestures.length > 0) {
    //   const categoryName = results.gestures[0][0].categoryName;
    //   const categoryScore = parseFloat(
    //     results.gestures[0][0].score * 100
    //   ).toFixed(2);
    //   // console.log(categoryName, categoryScore);
    // }

    window.requestAnimationFrame(predict);
  };

  // useEffect(() => {
  //   const task = setInterval(() => {
  //     getPicture();
  //   }, 300);
  //   return () => clearInterval(task);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    // called when component is mount
    setUp();
    // window.addEventListener("mousemove", handleMove);
    return () => {
      //clean up when component will unmount
      // window.removeEventListener("mousemove", handleMove);
      stopVideo();
    };
  }, []);

  const stopVideo = async () => {
    let video = document.getElementById("video");
    video.removeEventListener("loadeddata", predict);
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    setOpen(false);
  };

  const getVideo = () => {
    let video = document.getElementById("video");
    if (open === false) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1280, height: 720 } })
        .then((stream) => {
          console.log(stream);
          video.srcObject = stream;
          video.addEventListener("loadeddata", predict);
        })
        .catch((err) => {
          console.log(err);
        });
      setOpen(true);
    }
  };

  return (
    <>
      <div>Video Test</div>
      <button
        disabled={open === false}
        onClick={() => {
          stopVideo();
        }}
      >
        Click to stop
      </button>
      <button
        disabled={open === true}
        onClick={() => {
          getVideo();
        }}
      >
        Click to start
      </button>

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
      <TestButton
        posx={600}
        posy={100}
        width={150}
        height={75}
        text="press me 1"
        isInside={posX > 600 && posX < 750 && posY > 100 && posY < 175}
      />
      <TestButton
        posx={600}
        posy={200}
        width={150}
        height={75}
        text="press me 2"
        isInside={posX > 600 && posX < 750 && posY > 200 && posY < 275}
      />
      <TestButton
        posx={600}
        posy={300}
        width={150}
        height={75}
        text="press me 3"
        isInside={posX > 600 && posX < 750 && posY > 300 && posY < 375}
      />
      <video id="video" autoPlay />
      {/* { <video id="video" autoPlay style={{ visibility: "hidden" }} />} */}
      <canvas id="canvas" width="1080" height="720"></canvas>
    </>
  );
};
export default VideoTest;
