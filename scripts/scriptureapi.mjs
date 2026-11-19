import {normalizeScriptureBook, classifyVolume, parseReference} from "./normalization.mjs";

const lookupScripture = document.querySelector("#lookupScripture");
const verseResults = document.querySelector("#verseResults");

const volumeAnalytics = document.querySelector("#volumeAnalytics");
const bookAnalytics = document.querySelector("#bookAnalytics");
const termAnalytics = document.querySelector("#termAnalytics");


const searchScripture = document.querySelector("#searchScripture");
const scriptureResults = document.querySelector("#scriptureResults");

export async function lookupVerse() {

  const reference =
    lookupScripture.value.trim();

  if (!reference) {
    return;
  }

  try {

    const parsed =
      parseReference(reference);

    if (!parsed) {
      verseResults.textContent =
        "Use format: Alma 32:21 or Alma 32:21-24";
      return;
    }

    const {book, chapter, startVerse, endVerse} = parsed;

    let combinedText = "";

    for (
      let currentVerse = startVerse;
      currentVerse <= endVerse;
      currentVerse++
    ) {

      const response =
        await fetch(
          `https://openscriptureapi.org/api/scriptures/v1/lds/en/book/${book}/${chapter}/${currentVerse}`
        );

      const data = await response.json();

      combinedText += `${data.reference}\n` + `${data.text}\n\n`;

    }

    verseResults.textContent =
      combinedText;

  }
  catch (error) {

    console.error(error);

    verseResults.textContent =
      error.message;
  }
}

export async function searchScriptures() {

  const volumeCounts = {};
  const bookCounts = {};

  volumeAnalytics.innerHTML = "";
  bookAnalytics.innerHTML = "";
  termAnalytics.innerHTML = "";
  
  const searchTerm = searchScripture.value.trim();

  if (!searchTerm) {
    return;
  }

  scriptureResults.innerHTML = "";

  try {

    const limit = 100;

    // ==========================================
    // First Page
    // ==========================================

    const firstResponse =
      await fetch(
        `https://openscriptureapi.org/api/scriptures/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=0&word_frequency=true`
      );

    const firstData = await firstResponse.json();

    const total = firstData.total;

    let allResults = [...firstData.results];

    console.log(
      "Total Matches:",
      total
    );

    // ==========================================
    // Remaining Pages
    // ==========================================

    for (
      let offset = limit;
      offset < total;
      offset += limit
    ) {

      const response =
        await fetch(
          `https://openscriptureapi.org/api/scriptures/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
        );

      const data = await response.json();

      allResults.push(...data.results);

    }

    // ==========================================
    // Book Analytics
    // ==========================================

    

    allResults.forEach(
      result => {

        const book = normalizeScriptureBook(result.book);

        const volume = classifyVolume(book);

        if (volume === "Unknown") {

          console.log(
            "Unknown Book:",
            result.book,
            "→",
            book
          );

        }

        bookCounts[book] =
          (bookCounts[book] || 0) + 1;
        
        volumeCounts[volume] =
          (volumeCounts[volume] || 0) + 1;
      }
    );

    const sortedVolumes =
      Object.entries(volumeCounts)
        .sort((a, b) => b[1] - a[1]);

    sortedVolumes
      .slice(0, 5)
      .forEach(([volume, count]) => {

        volumeAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${volume}</span><span class="count">${count}</span></p>`;
      });

    const sortedBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]);

    sortedBooks
      .slice(0, 5)
      .forEach(([book, count]) => {

        // bookAnalytics.innerHTML += `<p>${book}: ${count}</p>`;
        bookAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${book}</span><span class="count">${count}</span></p>`;
      });

    // ==========================================
    // Word Frequency Analytics
    // ==========================================

    console.log(
      "Word Frequency:",
      firstData.wordFrequency
    );

    if (
      firstData.wordFrequency &&
      firstData.wordFrequency.length
    ) {

      firstData.wordFrequency
        .slice(0, 5)
        .forEach(item => {

          // termAnalytics.innerHTML += `<p>${item.word}: ${item.count}</p>`;
          termAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${item.word}</span><span class="count">${item.count}</span></p>`;
        });
    }

    // ==========================================
    // Scripture Results
    // ==========================================

    allResults
      .slice(0, 25)
      .forEach(result => {

        scriptureResults.innerHTML += `
          <div class="scripture-card">
            <h4>${result.reference}</h4>
            <p>${result.text}</p>
          </div>
        `;

      });

  }
  catch (error) {

    console.error(error);

    scriptureResults.textContent =
      `Error: ${error.message}`;

  }

}