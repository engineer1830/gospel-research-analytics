import {normalizeScriptureBook, classifyVolume, parseReference} from "./normalization.mjs";

const lookupScripture = document.querySelector("#lookupScripture");
const verseResults = document.querySelector("#verseResults");

const volumeAnalytics = document.querySelector("#volumeAnalytics");
const bookAnalytics = document.querySelector("#bookAnalytics");
const termAnalytics = document.querySelector("#termAnalytics");


const searchScripture = document.querySelector("#searchScripture");
const scriptureResults = document.querySelector("#scriptureResults");

lookupScripture.value = localStorage.getItem("lastReferenceLookup") || "";
searchScripture.value = localStorage.getItem("lastScriptureSearch") || "";

let currentScriptureList = [];

function renderScriptureResults(results) {

  scriptureResults.innerHTML = "";

  results
    .slice(0, 25)
    .forEach(result => {

      const book = normalizeScriptureBook(result.book);

      scriptureResults.innerHTML += `
        <div class="scripture-card">
 
        <h4>${book} ${result.chapter}:${result.verse}</h4>

          <p>${result.text}</p>

        </div>
      `;

    });

}

export async function lookupVerse() {

  const reference = lookupScripture.value.trim();

  localStorage.setItem("lastReferenceLookup", reference);

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

  localStorage.setItem("lastScriptureSearch", searchTerm);

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

    currentScriptureList = allResults;

    console.log(allResults[0]);

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

        volumeAnalytics.innerHTML += `
          <p class="analytics-item volume-filter"
          data-volume="${volume}">
          <span class="label">${volume}</span>
          <span class="count">${count}</span></p>`;
      });

    const sortedBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]);

    sortedBooks
      .slice(0, 5)
      .forEach(([book, count]) => {

        bookAnalytics.innerHTML += `
          <p class="analytics-item book-filter"
          data-book="${book}"><span class="label">${book}</span>
          <span class="count">${count}</span></p>`;
      });
    
    document
      .querySelectorAll(".book-filter")
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const book =
              item.dataset.book;

            const filteredResults =
              currentScriptureList.filter(
                result => {

                  const normalizedBook =
                    normalizeScriptureBook(
                      result.book
                    );

                  return (
                    normalizedBook === book
                  );

                }
              );

            renderScriptureResults(
              filteredResults
            );

            activeScriptureFilter.innerHTML = `
              <p class="active-filter">
    
                Showing:
                <strong>${book}</strong>
    
                <button
                  id="clearScriptureFilter">
    
                  Clear Filter
    
                </button>
    
              </p>
            `;

            document
              .querySelector("#clearScriptureFilter")
              ?.addEventListener(
                "click",
                () => {

                  activeScriptureFilter.innerHTML = "";

                  renderScriptureResults(
                    currentScriptureList
                  );

                }
              );

          }
        );

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

          termAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${item.word}</span><span class="count">${item.count}</span></p>`;
        });
    }

    // ==========================================
    // Scripture Results
    // ==========================================

    renderScriptureResults(allResults);

    const activeScriptureFilter =
      document.querySelector(
        "#activeScriptureFilter"
      );
    
    document
      .querySelectorAll(".volume-filter")
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const volume =
              item.dataset.volume;

            const filteredResults =
              currentScriptureList.filter(
                result => {

                  const book =
                    normalizeScriptureBook(
                      result.book
                    );

                  return (
                    classifyVolume(book)
                    === volume
                  );

                }
              );
            
            renderScriptureResults(
              filteredResults
              );

            activeScriptureFilter.innerHTML = `
              <p class="active-filter">
    
                Showing:
                <strong>${volume}</strong>
    
                <button
                  id="clearScriptureFilter">
    
                  Clear Filter
    
                </button>
    
              </p>
            `;

            document
              .querySelector("#clearScriptureFilter")
              ?.addEventListener(
                "click",
                () => {

                  activeScriptureFilter.innerHTML = "";

                  renderScriptureResults(
                    currentScriptureList
                  );
                }
              );
          }
        );

      });
    

  }
  catch (error) {

    console.error(error);

    scriptureResults.textContent =
      `Error: ${error.message}`;

  }

}