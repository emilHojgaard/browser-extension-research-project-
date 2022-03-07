/*global chrome*/
import { useEffect, useState } from "react";
import { StyledModal, StyledButton, StyledHeading, StyledPersonalCopy} from "./Modal.styles";
import InteractiveText from "../../zeeguu-react/src/reader/InteractiveText"
import { TranslatableText } from "../../zeeguu-react/src/reader/TranslatableText"
import { getImage } from "../Cleaning/generelClean";
import { interactiveTextsWithTags } from "./interactivityFunctions";
import { getNativeLanguage } from "../../popup/functions";
import * as s from "../../zeeguu-react/src/reader/ArticleReader.sc"
import strings from "../../zeeguu-react/src/i18n/definitions"

let FREQUENCY_KEEPALIVE = 30 * 1000; // 30 seconds
let previous_time = 0; // since sent a scroll update

export function Modal({ title, content, modalIsOpen, setModalIsOpen, api, url, language }) {
  const [interactiveTextArray, setInteractiveTextArray] = useState();
  const [interactiveTitle, setInteractiveTitle] = useState();
  const [articleImage, setArticleImage] = useState();
  const [translating, setTranslating] = useState(true);
  const [pronouncing, setPronouncing] = useState(false);
  const [articleId, setArticleId] = useState();
  const [nativeLang, setNativeLang] = useState();
  
  useEffect(() => {
    if (content !== undefined) {
      let info = {
        url: url,
        htmlContent: content,
        title: title,
      };
      api.findCreateArticle(info, (articleId) => setArticleId(JSON.parse(articleId)));
    }
    getNativeLanguage().then((result)=>
      setNativeLang(result)
    )
  }, []);

  useEffect(() => {
    if (articleId !== undefined) {
      let articleInfo = {
        url: url,
        content: content,
        id: articleId.article_id,
        title: title,
        language: language,
        starred: false,
      };
      let image = getImage(content);
      setArticleImage(image);
  
      let arrInteractive = interactiveTextsWithTags(content, articleInfo, api);
      setInteractiveTextArray(arrInteractive);
  
      let itTitle = new InteractiveText(title, articleInfo, api);
      setInteractiveTitle(itTitle);
      api.logReaderActivity(api.OPEN_ARTICLE,  articleId.article_id);

      window.addEventListener("focus", onFocus);
      window.addEventListener("blur", onBlur);

      let getModalClass = document.getElementsByClassName("Modal")
      if ((getModalClass !== undefined) && (getModalClass !== null)){
        setTimeout(() => {
          if(getModalClass.item(0) != undefined){
            getModalClass.item(0).addEventListener("scroll", onScroll);
          }
        }, 0);
      }
    }
      
  }, [articleId]);

localStorage.setItem("native_language", nativeLang)

function onFocus() {
  api.logReaderActivity(api.ARTICLE_FOCUSED, articleId.article_id);
}
function onBlur() {
  api.logReaderActivity(api.ARTICLE_UNFOCUSED, articleId.article_id);
}

const handleClose = () => {
  location.reload();
  setModalIsOpen(false);
  api.logReaderActivity("ARTICLE CLOSED", articleId.article_id);
  window.removeEventListener("focus", onFocus);
  window.removeEventListener("blur", onBlur);
  document.getElementById("scrollHolder") !== null &&
  document
    .getElementById("scrollHolder")
    .removeEventListener("scroll", onScroll);
};

function onScroll() {
  let _current_time = new Date();
  let current_time = _current_time.getTime();
console.log(previous_time)
  if (previous_time === 0) {
    api.logReaderActivity(api.SCROLL, articleId.article_id);
    previous_time = current_time;
  } else {
    if (current_time - previous_time > FREQUENCY_KEEPALIVE) {
      api.logReaderActivity(api.SCROLL, articleId.article_id);
      previous_time = current_time;
      console.log(previous_time)
    } else {
    }
  }
}

function handlePostCopy() {
  api.makePersonalCopy(articleId, (message) => alert(message));
};
  
function toggle(state, togglerFunction) {
  togglerFunction(!state);
}

  if (interactiveTextArray === undefined) {
    return <p>Loading</p>;
  }

  return (
    <div>
      <StyledModal
        isOpen={modalIsOpen}
        className="Modal"
        overlayClassName="Overlay"
        id="scrollHolder"
      >
         <StyledHeading >
          <StyledButton role="button" onClick={handleClose} id="qtClose">
            X
          </StyledButton>
          <s.Toolbar  style={{"display": "flex", "justify-content": "flex-end"}}>
          <button
            className={translating ? "selected" : ""}
            onClick={(e) => toggle(translating, setTranslating)}
          >
            <img
              src={chrome.runtime.getURL("images/translate.svg")} 
              alt={strings.translateOnClick}
            />
            <span className="tooltiptext">{strings.translateOnClick}</span>
          </button>
          <button
            className={pronouncing ? "selected" : ""}
            onClick={(e) => toggle(pronouncing, setPronouncing)}
          >
            <img src={chrome.runtime.getURL("images/sound.svg")}  alt={strings.listenOnClick} />
            <span className="tooltiptext">{strings.listenOnClick}</span>
          </button>
        </s.Toolbar>
        </StyledHeading>
        <StyledPersonalCopy onClick={handlePostCopy}>
          Make Personal Copy
          </StyledPersonalCopy>
        <h1>
          <TranslatableText
            interactiveText={interactiveTitle}
            translating={translating}
            pronouncing={pronouncing}
          />
        </h1>
        {articleImage === undefined ? null : <img id="zeeguuImage" alt={articleImage.alt} src={articleImage.src}></img>}
        {interactiveTextArray.map((paragraph) => {
            const CustomTag = `${paragraph.tag}`;
            if ((paragraph.tag === "P") || (paragraph.tag === "H3") || (paragraph.tag === "H2") || (paragraph.tag === "H4") || (paragraph.tag === "H5")){
            return (
              <CustomTag>
                <TranslatableText
                  interactiveText={paragraph.text}
                  translating={translating}
                  pronouncing={pronouncing}
                />
              </CustomTag>
            )}
          if((paragraph.tag ==="OL") || (paragraph.tag ==="UL")){
            let list = Array.from(paragraph.list)
            return (
              <CustomTag>
              {list.map((paragraph, i) => {
                return(
                <li key={i}>
                <TranslatableText
                  interactiveText={paragraph.text}
                  translating={translating}
                  pronouncing={pronouncing}
                />
                </li>)})}
                </CustomTag>
            )
          }
        })}
      </StyledModal>
      
    </div>
  );
}
