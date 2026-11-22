const searchInput = document.querySelector("#searchInput");

const conferenceResults = document.querySelector("#conferenceResults");
const speakerAnalytics = document.querySelector("#speakerResults");
const decadeAnalytics = document.querySelector("#yearResults");

let currentTalkList = [];

searchInput.value = localStorage.getItem("lastConferenceSearch") || "";

function renderConferenceResults(talks) {

  conferenceResults.innerHTML = "";

  const activeConferenceFilter = document.querySelector("#activeConferenceFilter");

  // Limit displayed talks . . . change number in .slice(0, A) where A is the number displayed

  talks
    .slice(0, 25)
    .forEach(talk => {

      const conferenceDate =
        talk.month === 4
          ? `April ${talk.year}`
          : talk.month === 10
            ? `October ${talk.year}`
            : `${talk.month}/${talk.year}`;

      conferenceResults.innerHTML += `
          <div class="conference-card">
        
            <h4>${talk.title}</h4>
        
            <p class="conference-meta">
              ${talk.speaker} •
              ${talk.session} •
              ${conferenceDate}
            </p>
        
            <button
              class="match-toggle"
              data-count="${talk.matches.length}">
        
              ▼ Show ${talk.matches.length} Match(es)
        
            </button>
        
            <div class="match-list" hidden>
        
              ${talk.matches.map(match => `
                <div class="match-entry">
        
                  <strong>
                    Paragraph ${match.paragraph}
                  </strong>
        
                  <p>${match.text}</p>
        
                </div>
              `).join("")}
        
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

}

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
        paragraph: result.paragraph, text: result.text});

    });

    const talkList = Object.values(talks);
    
    currentTalkList = talkList;

    talkList.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return b.month - a.month;

    });
    
    renderConferenceResults(talkList);

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
          <p class="analytics-item speaker-filter"
          data-speaker="${speaker}">
          <span class="label">${speaker}</span>
          <span class="count">${count}</span></p>`;
          });

    document
      .querySelectorAll(".speaker-filter")
      .forEach(item => {

        item.addEventListener(
          "click",
          () => {

            const speaker = item.dataset.speaker;

            activeConferenceFilter.innerHTML = `
            <p class="active-filter">Showing: <strong>${speaker}</strong>
            <button id="clearConferenceFilter">Clear Filter</button></p>`;
            
            const filteredTalks =
              currentTalkList.filter(
                talk =>
                  talk.speaker === speaker
              );

            renderConferenceResults(
              filteredTalks
            );

            document
              .querySelector("#clearConferenceFilter")
              ?.addEventListener(
                "click",
                () => {

                  activeConferenceFilter.innerHTML = "";

                  renderConferenceResults(
                    currentTalkList
                  );

                }
              );

          }
        );

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

        // decadeAnalytics.innerHTML += `<p class="analytics-item"><span class="label">${decade}s</span><span class="count">${count}</span></p>`;
      
        decadeAnalytics.innerHTML += `
          <p class="analytics-item decade-filter"
          data-decade="${decade}">
          <span class="label">${decade}s</span>
          <span class="count">${count}</span></p>`;
        
        document
          .querySelectorAll(".decade-filter")
          .forEach(item => {

            item.addEventListener(
              "click",
              () => {

                const decade =
                  Number(item.dataset.decade);

                activeConferenceFilter.innerHTML = `
                  <p class="active-filter">
                    Showing:
                    <strong>${decade}s</strong>
        
                    <button id="clearConferenceFilter">
                      Clear Filter
                    </button>
                  </p>
                `;

                const filteredTalks =
                  currentTalkList.filter(
                    talk =>
                      Math.floor(talk.year / 10) * 10
                      === decade
                  );

                renderConferenceResults(
                  filteredTalks
                );

                document
                  .querySelector("#clearConferenceFilter")
                  ?.addEventListener(
                    "click",
                    () => {

                      activeConferenceFilter.innerHTML = "";

                      renderConferenceResults(
                        currentTalkList
                      );

                    }
                  );

              }
            );

          });
      
      });

  } catch (error) {

    console.error(error);

    conferenceResults.textContent =
      `Error: ${error.message}`;
  }
}