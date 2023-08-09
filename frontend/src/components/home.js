import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  FormControl,
  Box,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import axios from "axios";
import "./style.css";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import SyncIcon from "@mui/icons-material/Sync";
import HearingIcon from "@mui/icons-material/Hearing";
import HearingDisabledIcon from "@mui/icons-material/HearingDisabled";

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
  const [record, setRecord] = useState([]);
  const { transcript, listening } = useSpeechRecognition();

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

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(translText);
    u.lang = targetLang;
    setUtterance(u);

    return () => {
      synth.cancel();
    };
  }, [translText, targetLang]);

  useEffect(() => {
    if (!listening) {
      translTask();
    }
  }, [listening]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const handlePlay = async () => {
    const synth = window.speechSynthesis;
    synth.speak(utterance);

    await sleep(5000);

    let temp = targetLang;
    setTargetLang(sourceLang);
    setSourceLang(temp);

    SpeechRecognition.startListening({ language: temp });
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

  return (
    <Container
      sx={{ marginLeft: "auto", marginRight: "auto", marginTop: "10vh" }}
    >
      <Stack direction="row">
        <FormControl
          variant="standard"
          sx={{ minWidth: "12vw", marginRight: "5vw" }}
        >
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
        <Button
          onClick={() => {
            handleSwap();
          }}
        >
          <SyncIcon />
        </Button>

        <FormControl
          variant="standard"
          sx={{ minWidth: "12vw", marginLeft: "5vw" }}
        >
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
      </Stack>
      <Box sx={{ borderColor: "#2f57f7", borderWidth: "2px" }}></Box>

      <div>
        <div className="rotated">This is a inverted text.</div>

        <p>Microphone: {listening ? "on" : "off"}</p>
        <Button
          onClick={() => {
            if (!listening) {
              SpeechRecognition.startListening({ language: sourceLang });
            }
          }}
        >
          {listening ? <HearingIcon /> : <HearingDisabledIcon />}
        </Button>
        {/* <p>{transcript}</p> */}
      </div>

      {/* <p>{translText}</p>
      <Button
        onClick={() => {
          translTask();
        }}
      >
        Press Me for translation
      </Button> */}
      <p>
        The microphone will be automatically turned on after the speech is
        finished. It'll also swap the detected language.
      </p>
      <Button
        onClick={() => {
          handlePlay();
        }}
      >
        Press for play
      </Button>
      {record.length > 0 ? (
        record.map(({ text, language }) => <p>{text}</p>)
      ) : (
        <p>No record yet</p>
      )}
    </Container>
  );
};

export default Home;
