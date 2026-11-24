const searchInput = document.querySelector("#searchInput");

const conferenceResults = document.querySelector("#conferenceResults");
const speakerAnalytics = document.querySelector("#speakerResults");
const decadeAnalytics = document.querySelector("#yearResults");
const insightResults = document.querySelector("#insightResults");
const loadingStatus = document.querySelector("#loadingStatus");

const talkCache = {};

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
            <span class="speaker-link"
            data-speaker="${talk.speaker}">${talk.speaker}</span> •
            ${talk.session} •

            <span class="conference-link"
            data-year="${talk.year}"
            data-month="${talk.month}">
            ${conferenceDate}</span></p>
        
            <button
              class="match-toggle"
              data-count="${talk.matches.length}">
        
              ▼ Show ${talk.matches.length} Match(es)
            </button>

            <div class="match-list" hidden>
              ${talk.matches.map(match => `
                <div class="match-entry">
                <strong>Paragraph ${match.paragraph}</strong>
                <p>${match.text}</p>
                </div>
            `).join("")}
            </div>

            <button class="full-talk-toggle"
            data-id="${talk.talkId}">
            ▼ View Full Talk
            </button>
            <div class="full-talk-content" hidden></div>
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

  document
    .querySelectorAll(".full-talk-toggle")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const talkId = button.dataset.id;

          let fullTalk;

          const fullTalkContainer = button.nextElementSibling;

          if (fullTalkContainer.innerHTML.trim()) {

            fullTalkContainer.hidden = !fullTalkContainer.hidden;

            button.textContent =
              fullTalkContainer.hidden
                ? "▼ View Full Talk"
                : "▲ Hide Full Talk";

            console.log("Toggled existing talk:", talkId);

            return;
          }

          if (talkCache[talkId]) {

            console.log("Loaded from Cache:", talkId);

            fullTalk = talkCache[talkId];

          } else {

            console.log("Fetched from API:", talkId);

            const response =
              await fetch(`https://openscriptureapi.org/api/conference/v1/lds/en/talk/${talkId}`);

            fullTalk = await response.json();

            talkCache[talkId] = fullTalk;
          }

          fullTalkContainer.innerHTML = `

            <div class="full-talk-view">
              <h4>${fullTalk.title}</h4>  
              <p><strong>${fullTalk.speaker}</strong></p>
              <p>${fullTalk.role || ""}</p>
          
              ${fullTalk.content.paragraphs
              .map(paragraph => `
                  <p>${paragraph.text}</p>
                `)
              .join("")}
          
            </div>
          
          `;

          fullTalkContainer.hidden = false;

          button.textContent =
            fullTalkContainer.hidden
              ? "▼ View Full Talk"
              : "▲ Hide Full Talk";

        }
      );

    });

  document
    .querySelectorAll(".speaker-link")
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const speaker =
            item.dataset.speaker;

          activeConferenceFilter.innerHTML = `
            <p class="active-filter">
              Showing:
              <strong>${speaker}</strong>
  
              <button id="clearConferenceFilter">
                Clear Filter
              </button>
            </p>
          `;

          const filteredTalks =
            currentTalkList
              .filter(
                talk =>
                  talk.speaker === speaker
              )
              .sort(
                (a, b) =>
                  b.matches.length -
                  a.matches.length
              );

          renderConferenceResults(
            filteredTalks
          );

          renderInsights(
            filteredTalks, speaker
          );

          document
            .querySelector("#clearConferenceFilter")
            ?.addEventListener(
              "click",
              () => {

                activeConferenceFilter.innerHTML = "";

                insightResults.innerHTML = "";

                renderConferenceResults(currentTalkList
                );

              }
            );

        }
      );

    });

  document
    .querySelectorAll(".conference-link")
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const year =
            Number(item.dataset.year);

          const month =
            Number(item.dataset.month);

          const conferenceDate =
            month === 4
              ? `April ${year}`
              : `October ${year}`;

          activeConferenceFilter.innerHTML = `
            <p class="active-filter">
              Showing:
              <strong>${conferenceDate}</strong>
  
              <button id="clearConferenceFilter">
                Clear Filter
              </button>
            </p>
          `;

          const filteredTalks =
            currentTalkList.filter(
              talk =>
                talk.year === year &&
                talk.month === month
            );

          renderConferenceResults(
            filteredTalks
          );

          renderInsights(
            filteredTalks, conferenceDate
          );

          document
            .querySelector("#clearConferenceFilter")
            ?.addEventListener(
              "click",
              () => {

                activeConferenceFilter.innerHTML = "";

                insightResults.innerHTML = "";

                renderConferenceResults(currentTalkList);

              }
            );

        }
      );

    });

}

function renderInsights(talks, label) {

  const talkCount = talks.length;
  const speakerCount = new Set(talks.map(talk => talk.speaker)).size;
  const paragraphCount = talks.reduce((total, talk) => total + talk.matches.length, 0);
  const mostRelevantTalk = talks.length > 0 ? [...talks].sort((a, b) => b.matches.length - a.matches.length)[0] : null;
  const conferenceTotals = {};

  talks.forEach(talk => {

    const conferenceKey =
      talk.month === 4
        ? `April ${talk.year}`
        : `October ${talk.year}`;

    conferenceTotals[conferenceKey] =
      (conferenceTotals[conferenceKey] || 0)
      + talk.matches.length;

  });

  const mostRelevantConference =
    Object.entries(conferenceTotals)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  insightResults.innerHTML = `
      <h3>Insight Summary</h3>
    
      <div class="insight-card">
    
        <div class="insight-header">
          <h3>Insights for ${label}</h3>
        </div>
    
        <div class="insight-metrics">
    
          <div class="metric-card">
            <div class="metric-number">
              ${talkCount}
            </div>
            <div class="metric-label">
              Talks Found
            </div>
          </div>
    
          <div class="metric-card">
            <div class="metric-number">
              ${paragraphCount}
            </div>
            <div class="metric-label">
              Paragraph Matches
            </div>
          </div>
    
          <div class="metric-card">
            <div class="metric-number">
              ${speakerCount}
            </div>
            <div class="metric-label">
              Speakers Found
            </div>
          </div>
    
        </div>
    
        ${mostRelevantTalk ? `
          <div class="recommendation-card">
    
            <h4>Most Relevant Talk</h4>
    
            <p>${mostRelevantTalk.title}</p>
    
            <span>
              ${mostRelevantTalk.matches.length}
              matches
            </span>
    
          </div>
        ` : ""}
    
        ${mostRelevantConference ? `
          <div class="recommendation-card">
    
            <h4>Most Relevant Conference</h4>
    
            <p>${mostRelevantConference[0]}</p>
    
            <span>
              ${mostRelevantConference[1]}
              matches
            </span>
    
          </div>
        ` : ""}
    
      </div>
    `;
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
  insightResults.innerHTML = "";

  loadingStatus.innerHTML = `
  <div class="loading-card">
    <div class="spinner"></div>
    <h3>Searching Conference Talks...</h3>
    <p>Gathering talks and building analytics.</p>
  </div>
`;


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

      console.table(allResults.slice(0, 10));

      const percent = Math.round((allResults.length / total) * 100);

      let loadingMessage =
        "Searching Conference Talks...";

      if (percent >= 95) {
        loadingMessage =
          "✓ Study Insights Ready";
      }
      else if (percent >= 75) {
        loadingMessage =
          "Generating Study Insights...";
      }
      else if (percent >= 50) {
        loadingMessage =
          "Building Conference Analytics...";
      }
      else if (percent >= 25) {
        loadingMessage =
          "Collecting Conference Results...";
      }

      loadingStatus.innerHTML = `
      <div class="loading-card">
      <div class="spinner"></div>
      <h3>${loadingMessage}</h3>
      <p>Loaded ${allResults.length} of ${total} matches</p>
      <div class="progress-bar">
      <div class="progress-fill" style="width:${percent}%"></div>
      </div>
      <p>${percent}% Complete</p>
  </div>
`;
    }

    console.log("Final Result Count:", allResults.length); // This line to be removed when functional

    const talks = {};

    allResults.forEach(result => {

      if (!talks[result.talkId]) {

        talks[result.talkId] = {
          talkId: result.talkId,
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

    const talkList = Object.values(talks);

    currentTalkList = talkList;

    talkList.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }

      return b.month - a.month;

    });

    loadingStatus.innerHTML = "";

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
              currentTalkList
                .filter(
                  talk =>
                    talk.speaker === speaker
                )
                .sort(
                  (a, b) =>
                    b.matches.length -
                    a.matches.length
                );

            renderConferenceResults(
              filteredTalks
            );

            renderInsights(
              filteredTalks, speaker
            );

            document
              .querySelector("#clearConferenceFilter")
              ?.addEventListener(
                "click",
                () => {

                  activeConferenceFilter.innerHTML = "";

                  insightResults.innerHTML = "";

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

                renderInsights(
                  filteredTalks,
                  `${decade}s`
                );


                document
                  .querySelector("#clearConferenceFilter")
                  ?.addEventListener(
                    "click",
                    () => {

                      activeConferenceFilter.innerHTML = "";

                      insightResults.innerHTML = "";

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