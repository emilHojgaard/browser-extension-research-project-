/*global chrome*/
import Login from "./Login";
import { checkReadability } from "./checkReadability";
import { setCurrentURL, getSourceAsDOM } from "./functions";
import { isProbablyReaderable } from "@mozilla/readability";
import logo from "../images/zeeguu128.png";
import { useState, useEffect } from "react";
import Zeeguu_API from "../../src/zeeguu-react/src/api/Zeeguu_API";
import {
  ButtonContainer,
  PrimaryButton,
  HeadingContainer,
  PopUp,
  BottomButton,
  NotifyButton,
  BottomContainer,
  NotReadableContainer,
} from "./Popup.styles";

//for isProbablyReadable options object
const minLength = 120;
const minScore = 20;

export default function Popup({ loggedIn, setLoggedIn }) {
  let api = new Zeeguu_API("https://api.zeeguu.org");
  const [user, setUser] = useState();
  const [tab, setTab] = useState();
  const [isReadable, setIsReadable] = useState();
  const [languageSupported, setLanguageSupported] = useState(true);
  const [article, setArticle] = useState();

  useEffect(() => {
    chrome.storage.local.get("userInfo", function (result) {
      setUser(result.userInfo);
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setTab(tabs[0]);
    });
  }, []);


  useEffect(() => {
    if (tab !== undefined) {
      // Language check
    //  api.findOrCreateArticle(info, (result_dict) =>{
    //    if(result_dict.includes("Language not supported")){
    //    setLanguageSupported(false)
    //    }
    //  });

      // Readability check
      const documentFromTab = getSourceAsDOM(tab.url);
      const isProbablyReadable = isProbablyReaderable(
        documentFromTab,
        minLength,
        minScore
      );
      const ownIsProbablyReadable = checkReadability(tab.url);

      if (!isProbablyReadable || !ownIsProbablyReadable) {
        setIsReadable(false);
      } else {
        setIsReadable(true);
      }
    }
  }, [tab]);

  async function openModal() {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["./main.js"],
      func: setCurrentURL(tab.url),
    });
    ///window.close();
  }

  function handleSuccessfulSignIn(userInfo, session) {
    setUser({
      session: session,
      name: userInfo.name,
      learned_language: userInfo.learned_language,
      native_language: userInfo.native_language,
    });
    chrome.storage.local.set({ userInfo: userInfo });
    chrome.storage.local.set({ sessionId: session });
  }

  function handleSignOut(e) {
    e.preventDefault();
    setLoggedIn(false);
    setUser(null);
    chrome.storage.local.set({ loggedIn: false });
    chrome.storage.local.remove(["sessionId"]);
    chrome.storage.local.remove(["userInfo"]);
  }  

  if (loggedIn === false) {
    return (
      <PopUp>
        <HeadingContainer>
          <img src={logo} alt="Zeeguu logo" />
        </HeadingContainer>
        <Login
          setLoggedIn={setLoggedIn}
          handleSuccessfulSignIn={handleSuccessfulSignIn}
          api={api}
        />
      </PopUp>
    );
  }

  if (loggedIn === true) {
    if (user === undefined || isReadable === undefined) {
      return (
        <PopUp>
          <div className="loader"></div>
        </PopUp>
      );
    }

    return (
      <PopUp>
        <HeadingContainer>
          <img src={logo} alt="Zeeguu logo" />
        </HeadingContainer>

        {user ? <p>Welcome {user.name}</p> : null}
        {isReadable === true && (
          <ButtonContainer>
            <PrimaryButton primary onClick={openModal}>
              Read article
            </PrimaryButton>
          </ButtonContainer>
        )}
        {languageSupported === false && (
          <NotReadableContainer>
            <p>Article language not supported</p>
            <NotifyButton>Do you want us to support this?</NotifyButton>
          </NotReadableContainer>
        )}
        {isReadable === false && languageSupported === true && (
          <NotReadableContainer>
            <p>Article is not readable</p>
            <NotifyButton>Should this be readable?</NotifyButton>
          </NotReadableContainer>
        )}

        <BottomContainer>
          <BottomButton
            onClick={() =>
              window.open("https://zeeguu.org/account_settings", "_blank")
            }
          >
            Settings
          </BottomButton>
          <BottomButton onClick={handleSignOut}>Logout</BottomButton>
        </BottomContainer>
      </PopUp>
    );
  }
}
