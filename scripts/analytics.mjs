import {normalizeScriptureBook} from "./normalization.mjs";

const searchBtn = document.querySelector("#searchBtn");
const searchInput = document.querySelector("#searchInput");

const results = document.querySelector("#conferenceResults");
const speakerResults = document.querySelector("#speakerResults");
const yearResults = document.querySelector("#yearResults");

const lookupBtn = document.querySelector("#lookupBtn");
const lookupScripture = document.querySelector("#lookupScripture");
const verseResults = document.querySelector("#verseResults");

const searchScriptureBtn = document.querySelector("#searchScriptureBtn");
const searchScripture = document.querySelector("#searchScripture");
const scriptureResults = document.querySelector("#scriptureResults");

const scriptureAnalytics = document.querySelector("#scriptureAnalytics");
const book = normalizeScriptureBook(result.book);

searchBtn.addEventListener("click", searchConference);
lookupBtn.addEventListener("click", lookupVerse);
searchScriptureBtn.addEventListener("click", searchScriptures);