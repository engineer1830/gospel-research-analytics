import {normalizeScriptureBook, classifyVolume, parseReference} from "./normalization.mjs";

const lookupScripture = document.querySelector("#lookupScripture");
const verseResults = document.querySelector("#verseResults");

const scriptureAnalytics = document.querySelector("#scriptureAnalytics");
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

    const {
      book,
      chapter,
      startVerse,
      endVerse
    } = parsed;

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

      const data =
        await response.json();

      combinedText +=
        `${data.reference}\n` +
        `${data.text}\n\n`;

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
  
  const searchTerm =
    searchScripture.value.trim();

  if (!searchTerm) {
    return;
  }

  try {

    const limit = 100;

    // ==========================================
    // First Page
    // ==========================================

    const firstResponse =
      await fetch(
        `https://openscriptureapi.org/api/scriptures/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=0&word_frequency=true`
      );

    const firstData =
      await firstResponse.json();

    const total =
      firstData.total;

    let allResults =
      [...firstData.results];

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

      const data =
        await response.json();

      allResults.push(
        ...data.results
      );

    }

    // ==========================================
    // Analytics Container
    // ==========================================

    scriptureAnalytics.innerHTML =
      `
          <h3>
              Total Matches:
              ${total}
          </h3>

          <h3>
              Records Analyzed:
              ${allResults.length}
          </h3>
      `;

    // ==========================================
    // Book Analytics
    // ==========================================

    const bookCounts = {};

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

    scriptureAnalytics.innerHTML +=
      `
  <h3>Volume Analytics</h3>
`;

    sortedVolumes.forEach(
      ([volume, count]) => {

        scriptureAnalytics.innerHTML +=
          `
          <p>
              ${volume}: ${count}
          </p>
      `;
      }
    );

    const sortedBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]);

    scriptureAnalytics.innerHTML +=
      `
          <h3>Top Books</h3>
      `;

    sortedBooks.forEach(
      ([book, count]) => {

        scriptureAnalytics.innerHTML +=
          `
                  <p>${book}: ${count}</p>
              `;
      }
    );

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

      scriptureAnalytics.innerHTML +=
        `
              <h3>Related Terms</h3>
          `;

      firstData.wordFrequency.forEach(
        item => {

          scriptureAnalytics.innerHTML +=
            `
                      <p>${item.word}: ${item.count}</p>
                  `;
        }
      );
    }

    // ==========================================
    // Raw Results
    // ==========================================

    scriptureResults.textContent =
      JSON.stringify(
        {
          query:
            firstData.query,

          total:
            firstData.total,

          results:
            allResults.slice(
              0,
              25
            )
        },
        null,
        2
      );

  }
  catch (error) {

    console.error(error);

    scriptureResults.textContent = `Error: ${error.message}`;
  }
}