import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Container,
  FormControl,
  Box,
  Select,
  MenuItem,
  Stack,
  Typography,
  Grid,
  Modal,
} from "@mui/material";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import instruction from "./../introduction.gif";
import { useNavigate } from "react-router-dom";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

import "./style.css";
import SyncIcon from "@mui/icons-material/Sync";
import HearingIcon from "@mui/icons-material/Hearing";
import HearingDisabledIcon from "@mui/icons-material/HearingDisabled";
import CampaignIcon from "@mui/icons-material/Campaign";

/*
language code:
German: de
English: en
Franch: fr
Japanese: ja
Korean: ko
*/

let gestureRecognizer;
let prev_state = false;
let lastFingerY = 0.5;

const Home = () => {
  const languages = [
    { language: "English", code: "en" },
    { language: "German", code: "de" },
    { language: "Franch", code: "fr" },
    { language: "Chinese (Traditional)", code: "zh-tw" },
    { language: "Japanese", code: "ja" },
    { language: "Korean", code: "ko" },
  ];

  // language state
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("zh-tw");
  const [translText, setTranslText] = useState("");
  const [record, setRecord] = useState([]);
  const [stage, setStage] = useState(0);

  // finger recoginition state
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  // video element open state
  const [open, setOpen] = useState(false);

  const { transcript, listening, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const navigate = useNavigate();

  // reference for video element
  const videoEl = useRef(null);
  const canvasEl = useRef(null);

  const translTask = async () => {
    let splited = [];
    let temp = "";
    let temp_record = record.slice();
    if (transcript !== undefined) {
      if (sourceLang !== "zh-tw") {
        splited = transcript.split(/[.!?]/);
      } else {
        splited = transcript.split("。");
      }

      splited.forEach(async (text) => {
        if (text !== "") {
          var url =
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
            sourceLang +
            "&tl=" +
            targetLang +
            "&dt=t&q=" +
            encodeURI(text);

          await axios.get(url).then((res) => {
            const data = res.data;
            temp += data[0][0][0];
          });

          setTranslText(temp);

          temp_record.push(
            { text: transcript, language: sourceLang },
            { text: temp, language: targetLang }
          ); // asynchronus update
          if (temp_record.length > 10) {
            temp_record = temp_record.slice(-10);
          }
          setRecord(temp_record);
        }
      });
    }

    // const { data } = await axios.post(
    //   "https://translation.googleapis.com/language/translate/v2",
    //   {},
    //   {
    //     params: {
    //       q: text,
    //       target: targetlang,
    //       format: "text",
    //       key: "AIzaSyCHUCmpR7cT_yDFHC98CZJy2LTms-IwDlM",
    //     },
    //   }
    // );
  };

  const options = {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
      delegate: "GPU",
    },
    numHands: 1,
    runningMode: "IMAGE",
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
          // video.addEventListener("loadeddata", predict);
        })
        .catch((err) => {
          console.log(err);
        });
      setOpen(true);
    }
  };

  const handlePlay = (text) => {
    const synth = window.speechSynthesis;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = targetLang;
    synth.speak(u);

    handleSwap();

    setTimeout(() => {
      SpeechRecognition.startListening({ language: targetLang });
    }, 4000);
  };

  const handleSource = (e) => {
    setSourceLang(languages.find(({ code }) => code === e.target.value).code);
  };

  const handleTarget = (e) => {
    setTargetLang(languages.find(({ code }) => code === e.target.value).code);
  };

  const handleSwap = () => {
    let temp = targetLang;
    setTargetLang(sourceLang);
    setSourceLang(temp);
  };

  const getPictureAndPredict = () => {
    let canvas = canvasEl.current;
    let ctx = canvas.getContext("2d");
    let video = videoEl.current;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const results = gestureRecognizer.recognize(canvas);

    let state = false;

    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        const tempX = (1 - landmarks[8].x) * 1920;
        const tempY = landmarks[8].y * 1080;

        setPosX(tempX);
        setPosY(tempY);
        if (stage === 0 && lastFingerY - landmarks[8].y > 0.2) {
          console.log("swipe up!", landmarks[8].y, lastFingerY);
          setStage(stage + 1);
        }

        if (
          Math.pow(landmarks[4].x - landmarks[8].x, 2) +
            Math.pow(landmarks[4].y - landmarks[8].y, 2) <
          0.002
        ) {
          state = true;
          if (stage === 1) {
            setStage(stage + 1);
          }
        }

        // click by squeezing
        if (prev_state === false && state === true) {
          // console.log("squeeze");
          const hearingButtonRect = document
            .getElementById("hearing-button")
            .getBoundingClientRect();
          const playingButtonRect = document
            .getElementById("play-button")
            .getBoundingClientRect();
          const swappingButtonRect = document
            .getElementById("swap-button")
            .getBoundingClientRect();

          if (
            tempX > hearingButtonRect.left &&
            tempX < hearingButtonRect.right &&
            tempY > hearingButtonRect.top &&
            tempY < hearingButtonRect.bottom
          ) {
            SpeechRecognition.startListening({ language: sourceLang });
          } else if (
            tempX > playingButtonRect.left &&
            tempX < playingButtonRect.right &&
            tempY > playingButtonRect.top &&
            tempY < playingButtonRect.bottom
          ) {
            handlePlay(translText);
          } else if (
            tempX > swappingButtonRect.left &&
            tempX < swappingButtonRect.right &&
            tempY > swappingButtonRect.top &&
            tempY < swappingButtonRect.bottom
          ) {
            handleSwap();
          }
        }

        prev_state = state;
        lastFingerY = landmarks[8].y;
      }
    }
  };

  useEffect(() => {
    if (!listening) {
      translTask();
    }
  }, [listening]);

  useEffect(() => {
    // called when component is mount

    setUp();
    getVideo();
  }, []);

  useEffect(() => {
    const task = setInterval(() => {
      if (gestureRecognizer) {
        getPictureAndPredict();
      }
    }, 10);
    return () => {
      clearInterval(task);
    };
  });

  return (
    <>
      <Container
        sx={{
          paddingLeft: "0px",
          paddingRight: "0px",
          marginLeft: "0px",
          marginRight: "0px",
        }}
        disableGutters
        maxWidth={false}
      >
        <Box
          sx={{
            backgroundColor: "#4285f4",
            paddingTop: "3vh",
            paddingBottom: "3vh",
            borderRadius: "20px",
          }}
        >
          <Stack
            direction="row"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: "20px",
              marginLeft: "10vw",
              marginRight: "10vw",
              paddingBottom: "3vh",
              paddingTop: "3vh",
            }}
          >
            <FormControl
              variant="standard"
              sx={{
                minWidth: "12vw",
                marginRight: "5vw",
              }}
            >
              <Select
                value={sourceLang}
                onChange={handleSource}
                label="SourceLang"
                sx={{
                  fontSize: "xx-large",
                  width: "20vw",
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {languages.map((item) => (
                  <MenuItem value={item.code} key={item.code}>
                    {item.language}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              onClick={() => {
                handleSwap();
              }}
              id="swap-button"
            >
              <SyncIcon sx={{ fontSize: "50px" }} />
            </Button>

            <FormControl
              variant="standard"
              sx={{ minWidth: "12vw", marginLeft: "5vw" }}
            >
              <Select
                value={targetLang}
                onChange={handleTarget}
                label="TargetLang"
                sx={{ fontSize: "xx-large", width: "20vw" }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {languages.map((item) => (
                  <MenuItem value={item.code} key={item.code}>
                    {item.language}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {!browserSupportsSpeechRecognition ? (
          <span>Browser does not support speech recognition</span>
        ) : (
          <div>{/* <p>{transcript}</p> */}</div>
        )}

        <div
          style={{
            marginTop: "3vh",
            borderRadius: "20px",
            border: "4px solid black",
            borderWidth: "8px",
            paddingLeft: "5vw",
            paddingRight: " 5vw",
            height: "60vh",
          }}
        >
          <Stack direction="column">
            {record.length > 0 ? (
              record.map(({ text, language }) => (
                <Typography
                  style={{
                    paddingTop: "1vh",
                    color: language === sourceLang ? "#DB4437" : "#000000",
                    textAlign: language === sourceLang ? "left" : "right",
                  }}
                  variant="h4"
                >
                  {text}
                </Typography>
              ))
            ) : (
              <p>No record yet</p>
            )}
          </Stack>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "1vh",
          }}
        >
          <Grid container>
            <Grid
              item
              xs={6}
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                onClick={() => {
                  if (!listening) {
                    SpeechRecognition.startListening({ language: sourceLang });
                  }
                }}
                sx={{
                  border: listening ? "5px solid #0f9d58" : "",
                  borderRadius: "20px",
                }}
                id="hearing-button"
              >
                {listening ? (
                  <HearingIcon sx={{ fontSize: "50px" }} />
                ) : (
                  <HearingDisabledIcon sx={{ fontSize: "50px" }} />
                )}
              </Button>
            </Grid>
            <Grid
              item
              xs={6}
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                onClick={() => {
                  handlePlay(translText);
                }}
                id="play-button"
              >
                <CampaignIcon sx={{ fontSize: "50px" }} />
              </Button>
            </Grid>
            <Grid
              item
              xs={6}
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontSize: "20px", marginTop: "1px" }}>
                Squeeze your finger to translate
              </Typography>
            </Grid>
            <Grid
              item
              xs={6}
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontSize: "20px", marginTop: "1px" }}>
                Squeeze your finger to play
              </Typography>
            </Grid>
          </Grid>
        </div>
      </Container>
      <div
        style={{
          position: "absolute",
          left: posX,
          top: posY,
          backgroundColor: "#fc2c03",
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          zIndex: 10,
        }}
      />
      <video
        id="video"
        autoPlay
        ref={videoEl}
        style={{ zIndex: 1, display: "none" }}
      />
      <Modal
        open={stage === 1 || stage === 0}
        sx={{ backdropFilter: "blur(5px)", zIndex: 1 }}
      >
        <Box
          sx={{
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {stage === 0 ? (
            <img src={instruction} alt="instruction" />
          ) : (
            <div>Hello</div>
          )}
        </Box>
      </Modal>

      <canvas
        id="canvas"
        ref={canvasEl}
        style={{ width: 1080, height: 720, display: "none" }}
      />
    </>
  );
};

export default Home;
