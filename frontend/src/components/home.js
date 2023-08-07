import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

/*
language code:
German: de
English: en
Franch: fr
Japanese: ja
Korean: ko
*/

const Home = () => {
  const languages = [
    { language: "English", code: "en" },
    { language: "German", code: "de" },
    { language: "Franch", code: "fr" },
    { language: "Chinese (Traditional)", code: "zh-tw" },
  ];

  const [sourceLang, setSourceLang] = useState("");
  const [targetLang, setTargetLang] = useState("zh-tw");
  const [translText, setTranslText] = useState("");
  const [utterance, setUtterance] = useState(null);
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const translTask = async () => {
    // let temp = "";
    // var url =
    //   "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    //   sourceLang +
    //   "&tl=" +
    //   targetLang +
    //   "&dt=t&q=" +
    //   encodeURI(transcript);

    // await axios.get(url).then((res) => {
    //   const data = res.data;
    //   console.log(data[0][0][0]);
    //   temp += data[0][0][0];
    // });
    // console.log(temp);

    // setTranslText(temp);
    let splited = [];
    let temp = "";
    if (transcript !== undefined) {
      console.log(transcript);
      if (sourceLang !== "zh-tw") {
        splited = transcript.split(/[.!?]/);
      } else {
        splited = transcript.split("。");
      }
      console.log(splited);

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
            console.log(data[0][0][0]);
            temp += data[0][0][0];
          });
          console.log(temp);

          setTranslText(temp);
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

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(translText);
    u.lang = targetLang;
    setUtterance(u);

    return () => {
      synth.cancel();
    };
  }, [translText, targetLang]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    synth.speak(utterance);
  };

  const handleSource = (e) => {
    setSourceLang(languages.find(({ code }) => code === e.target.value).code);
  };

  const handleTarget = (e) => {
    setTargetLang(languages.find(({ code }) => code === e.target.value).code);
  };

  return (
    <Container>
      <p>Set Source Language: </p>
      <FormControl variant="standard" sx={{ minWidth: "12vw" }}>
        <InputLabel>Source Language</InputLabel>
        <Select value={sourceLang} onChange={handleSource} label="SourceLang">
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
      <p>Set Target Language: </p>
      <FormControl variant="standard" sx={{ minWidth: "12vw" }}>
        <InputLabel>Target Language</InputLabel>
        <Select value={targetLang} onChange={handleTarget} label="TargetLang">
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
      <p>{translText}</p>
      <Button
        onClick={() => {
          translTask();
        }}
      >
        Press Me for translation
      </Button>
      <Button
        onClick={() => {
          handlePlay();
        }}
      >
        Press for play
      </Button>
      {!browserSupportsSpeechRecognition ? (
        <span>Browser does not support speech recognition</span>
      ) : (
        <div>
          <p>Microphone: {listening ? "on" : "off"}</p>
          <Button
            onClick={() => {
              SpeechRecognition.startListening({ language: sourceLang });
            }}
          >
            Start
          </Button>
          <Button
            onClick={async () => {
              SpeechRecognition.stopListening();
              await translTask();
            }}
          >
            Stop
          </Button>
          <Button onClick={resetTranscript}>Reset</Button>
          <p>{transcript}</p>
        </div>
      )}
    </Container>
  );
};

export default Home;
