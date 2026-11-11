import {searchConference} from "./conferenceapi.mjs";
import {searchScriptures, lookupVerse} from "./scriptureapi.mjs";

const searchBtn = document.querySelector("#searchBtn");
const lookupBtn = document.querySelector("#lookupBtn");
const searchScriptureBtn = document.querySelector("#searchScriptureBtn");

searchBtn.addEventListener("click", searchConference);
lookupBtn.addEventListener("click", lookupVerse);
searchScriptureBtn.addEventListener("click", searchScriptures);