const searchInput = document.querySelector("#searchInput");

const results = document.querySelector("#conferenceResults");
const speakerResults = document.querySelector("#speakerResults");
const yearResults = document.querySelector("#yearResults");

export async function searchConference() {
  const searchTerm = searchInput.value.trim();

  if (!searchTerm) {
    return;
    }

  try {

    const limit = 100;

    // Get first page
    const firstResponse = await fetch(
      `https://openscriptureapi.org/api/conference/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=0`
    );

    const firstData = await firstResponse.json();

    const total = firstData.total;

    let allResults = [...firstData.results];

    console.log("Total Matches:", total);

    // Get remaining pages (for operations, it should be offset < total, but for proof of concept I have set total = 500 for faster pulls)
    for (let offset = limit; offset < 500; offset += limit) {

      const response = await fetch(
        `https://openscriptureapi.org/api/conference/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
      );

      const data = await response.json();

      allResults.push(...data.results);

      console.log(`Fetched ${allResults.length} of ${total}`);  // This line to be removed when functional
    }

    console.log("Final Result Count:", allResults.length); // This line to be removed when functional

    // Display sample JSON - to be removed when operational . . . or determine what is displayed
    results.textContent =
      JSON.stringify(allResults.slice(0, 10), null, 2);

    // ==========================================
    // Speaker Analytics
    // ==========================================

    const speakerCounts = {};

    allResults.forEach(result => {

      const speaker = result.speaker;

      speakerCounts[speaker] =
        (speakerCounts[speaker] || 0) + 1;

    });

    const sortedSpeakers =
      Object.entries(speakerCounts)
        .sort((a, b) => b[1] - a[1]);

    speakerResults.innerHTML = `
          <h3>
              Total Matches: ${total}<br>
              Records Analyzed: ${allResults.length}
          </h3>
      `;

    sortedSpeakers.forEach(([speaker, count]) => {

      speakerResults.innerHTML += `
              <p>${speaker}: ${count}</p>
          `;

    });

    // ==========================================
    // Decade Analytics
    // ==========================================

    const decadeCounts = {};

    allResults.forEach(result => {

      const decade =
        Math.floor(result.year / 10) * 10;

      decadeCounts[decade] =
        (decadeCounts[decade] || 0) + 1;

    });

    const sortedDecades =
      Object.entries(decadeCounts)
      .sort((a, b) => Number(a[0]) - Number(b[0]));

    console.table(sortedDecades);

    // yearResults.innerHTML = `
    //     <h3>Decade Analytics</h3>
    // `;

    yearResults.innerHTML = "";

    sortedDecades.forEach(([decade, count]) => {

      yearResults.innerHTML += `
                  <p>${decade}s: ${count}</p>
              `;

    });

  } catch (error) {

    console.error(error);

    results.textContent =
      `Error: ${error.message}`;
  }
}