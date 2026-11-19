const searchInput = document.querySelector("#searchInput");

const conferenceResults = document.querySelector("#conferenceResults");
const speakerAnalytics = document.querySelector("#speakerResults");
const decadeAnalytics = document.querySelector("#yearResults");
  
export async function searchConference() {
  const searchTerm = searchInput.value.trim();

  if (!searchTerm) {
    return;
    }

  speakerAnalytics.innerHTML = "";
  conferenceResults.innerHTML = "";
  decadeAnalytics.innerHTML = "";

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
    
    allResults
      .slice(0, 25)
      .forEach(result => {

        const conferenceDate =
          result.month === 4
            ? `April ${result.year}`
            : result.month === 10
              ? `October ${result.year}`
              : `${result.month}/${result.year}`;

        const excerpt =
          result.text.length > 250
            ? result.text.substring(0, 250) + "..."
            : result.text;

        conferenceResults.innerHTML += `
        <div class="conference-card">
  
          <h4>${result.title}</h4>
  
          <p class="conference-meta">
            ${result.speaker} •
            ${result.session} •
            ${conferenceDate}
          </p>
  
          <p>${excerpt}</p>
  
        </div>
      `;

      });

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

    sortedSpeakers
      .slice(0, 5)
      .forEach(([speaker, count]) => {

        speakerAnalytics.innerHTML += `
            <p class="analytics-item"><span class="label">${speaker}</span><span class="count">${count}</span></p>`;
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
      .sort((a, b) => Number(b[0]) - Number(a[0]));

    console.table(sortedDecades);

    sortedDecades
      .slice(0, 5)
      .forEach(([decade, count]) => {

        decadeAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${decade}s</span><span class="count">${count}</span></p>`;
      });

  } catch (error) {

    console.error(error);

    conferenceResults.textContent =
      `Error: ${error.message}`;
  }
}