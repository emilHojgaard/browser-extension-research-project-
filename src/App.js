/*global chrome*/
import "./App.css";
import Popup from "./popup/Popup";
import { useState } from "react";
import Congratulations from "./zeeguu-react/src/exercises/Congratulations";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  chrome.cookies.get({ url: "https://www.zeeguu.org", name: "sessionID" },
    function (cookie) {
      if (cookie) {
        chrome.storage.local.set({ loggedIn: true }, () =>
          console.log(
            "Cookie is present, loggedIn set to true in local storage"
          )
        );
        chrome.storage.local.set({ sessionId: cookie.value }, () =>
          console.log("sessionid is set in local storage")
        );
      } else {
        console.log("No cookie");
      }
    }
  );

  chrome.storage.local.get("loggedIn", function (data) {
    if (data.loggedIn === undefined || data.loggedIn === false) {
      setLoggedIn(false);
    } else if (data.loggedIn === true) {
      setLoggedIn(true);
    }
    console.log("is loggedin? ", loggedIn);
  });

  return <Popup loggedIn={loggedIn} setLoggedIn={setLoggedIn} />;
}

export default App;
