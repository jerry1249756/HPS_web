import { createContext } from "react";

const AppContext = createContext({
  sourceLang: "",
  targetLang: "",
  setSourceLang: () => {},
  setTargetLang: () => {},
});

export default AppContext;
