const searchInput = document.querySelector("#searchInput");

const conferenceResults = document.querySelector("#conferenceResults");
const speakerAnalytics = document.querySelector("#speakerResults");
const decadeAnalytics = document.querySelector("#yearResults");

searchInput.value = localStorage.getItem("lastConferenceSearch") || "";

export async function searchConference() {

  const searchTerm = searchInput.value.trim();

  localStorage.setItem("lastConferenceSearch", searchTerm);

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
    for (let offset = limit; offset < total; offset += limit) {

      const response = await fetch(
        `https://openscriptureapi.org/api/conference/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
      );

      const data = await response.json();

      allResults.push(...data.results);

      console.log(`Fetched ${allResults.length} of ${total}`);  // This line to be removed when functional
    }

    console.log("Final Result Count:", allResults.length); // This line to be removed when functional

    const talks = {};

    allResults.forEach(result => {

      if (!talks[result.talkId]) {

        talks[result.talkId] = {
          title: result.title,
          speaker: result.speaker,
          session: result.session,
          year: result.year,
          month: result.month,
          matches: []
        };

      }

      talks[result.talkId].matches.push({
        paragraph: result.paragraph, text: result.text
      });

    });

    // Comment this section below out for a moment to review the JSON data


    const talkList =
      Object.values(talks);

    talkList.sort((a, b) => {

      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return b.month - a.month;

    });

    // This is display settings for the results . . . slice changes the number displayed

    talkList
      .slice(0, 25)
      .forEach(talk => {

        const conferenceDate =
          talk.month === 4
            ? `April ${talk.year}`
            : talk.month === 10
              ? `October ${talk.year}`
              : `${talk.month}/${talk.year}`;

        const excerpt =
          talk.matches[0].length > 250
            ? talk.matches[0].substring(0, 250) + "..."
            : talk.matches[0];

        conferenceResults.innerHTML += `
      <div class="conference-card">

        <h4>${talk.title}</h4>

        <p class="conference-meta">
          ${talk.speaker} •
          ${talk.session} •
          ${conferenceDate}
        </p>

        <button class="match-toggle" data-count="${talk.matches.length}">▼ Show ${talk.matches.length} Match(es)</button>
        
        <div class="match-list" hidden>

        ${talk.matches.map(match => `
          <div class="match-entry">
        
            <strong>Paragraph ${match.paragraph}</strong>
            <p>${match.text}</p>
            </div>`).join("")}

        </div>

      </div>
    `;

      });

    document.querySelectorAll(".match-toggle").forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const matchList =
            button.nextElementSibling;

          matchList.hidden =
            !matchList.hidden;

          button.textContent =
            matchList.hidden
              ? `▼ Show ${button.dataset.count} Match(es)`
              : `▲ Hide ${button.dataset.count} Match(es)`;

        }
      );

    });


    // Code to see the JSON data easily

    // const talkList =
    //   Object.values(talks);

    // conferenceResults.textContent =
    //   JSON.stringify(
    //     allResults.slice(0, 5),
    //     null,
    //     2
    //   );

    // End JSON code display

    const speakerCounts = {};

    talkList.forEach(talk => {

      const speaker = talk.speaker;

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

    talkList.forEach(talk => {

      const decade =
        Math.floor(talk.year / 10) * 10;

      decadeCounts[decade] =
        (decadeCounts[decade] || 0) + 1;

    });

    const sortedDecades =
      Object.entries(decadeCounts)
        .sort((a, b) => b[1] - a[1]);

    console.table(sortedDecades);

    sortedDecades
      .slice(0, 7)
      .forEach(([decade, count]) => {

        decadeAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${decade}s</span><span class="count">${count}</span></p>`;
      });

  } catch (error) {

    console.error(error);

    conferenceResults.textContent =
      `Error: ${error.message}`;
  }
}