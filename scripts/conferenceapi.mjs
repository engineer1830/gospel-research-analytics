const searchInput = document.querySelector("#searchInput");

const conferenceResults = document.querySelector("#conferenceResults");
const speakerAnalytics = document.querySelector("#speakerResults");
const decadeAnalytics = document.querySelector("#yearResults");

const insightResults = document.querySelector("#insightResults");
const loadingStatus = document.querySelector("#loadingStatus");

const activeConferenceFilter = document.querySelector("#activeConferenceFilter");
const resultsSummary = document.querySelector("#resultsSummary");

const studyCompanion = document.querySelector("#studyCompanion");
const studyCompanionReading = document.querySelector("#studyCompanionReading");

const talkCache = {};

let currentTalkList = [];
let currentDisplayedTalks = [];

function sortTalks(talks) {

  const sortOption = document.querySelector("#sortOption").value;

  const sorted = [...talks];

  if (sortOption === "relevance") {

    sorted.sort((a, b) => {

      const matchDifference = b.matches.length - a.matches.length;

      if (matchDifference !== 0) {
        return matchDifference;
      }
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  else {
    sorted.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  console.log(
    "Sort:",
    sortOption,
    "Top Result:",
    sorted[0]?.title,
    "Matches:",
    sorted[0]?.matches?.length
  );

  return sorted;

}

searchInput.value = localStorage.getItem("lastConferenceSearch") || "";

document
  .querySelector("#sortOption")
  .addEventListener(
    "change",
    () => {

      console.log(
        "Sort Changed:",
        document.querySelector("#sortOption").value
      ); // To be removed...............................

      renderConferenceResults(sortTalks(currentDisplayedTalks));
    }
  );

function renderResultsSummary(talks) {

  const sortOption = document.querySelector("#sortOption").value;

  const activeFilter =
    activeConferenceFilter.textContent
      .replace("Showing:", "")
      .replace("Clear Filter", "")
      .trim()
    || "All Results";

  const sortLabel =
    sortOption === "relevance"
      ? "Most Relevant"
      : "Most Recent";

  const speakerCount =
    new Set(
      talks.map(
        talk => talk.speaker
      )
    ).size;

  resultsSummary.innerHTML = `
      <div class="summary-card">
        <div class="summary-metric summary-filter">
          <span class="summary-number">${activeFilter}</span>
          <span class="summary-label">Active Filter</span>
        </div>
  
        <div class="summary-metric">
          <span class="summary-number">${Math.min(talks.length, 25)}</span>
          <span class="summary-label">Showing</span>
        </div>
        <div class="summary-metric">
        <span class="summary-number"> ${speakerCount}</span>
        <span class="summary-label">Speakers</span>
      </div>
        <div class="summary-metric">
          <span class="summary-number"> ${sortLabel}</span>
          <span class="summary-label">
            Sorted By
          </span>
        </div>
      </div>
    `;
}

function renderConferenceResults(talks) {

  currentDisplayedTalks = talks;
  renderResultsSummary(talks);
  conferenceResults.innerHTML = "";

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

        button.classList.toggle("toggle-open", !matchList.hidden);

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

            button.classList.toggle(
              "toggle-open",
              !fullTalkContainer.hidden
            );

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
          }
          else {

            console.log("Fetched from API:", talkId); // To be deleted when ready
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

          button.classList.add("toggle-open");

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

          renderConferenceResults(sortTalks(filteredTalks));
          renderInsights(filteredTalks, speaker);
          renderStudyCompanion(filteredTalks);

          document
            .querySelector("#clearConferenceFilter")
            ?.addEventListener(
              "click",
              () => {

                activeConferenceFilter.innerHTML = "";
                insightResults.innerHTML = "";
                renderConferenceResults(sortTalks(currentTalkList));
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

          renderConferenceResults(sortTalks(filteredTalks));
          renderInsights(filteredTalks, conferenceDate);
          renderStudyCompanion(filteredTalks);

          document
            .querySelector("#clearConferenceFilter")
            ?.addEventListener(
              "click",
              () => {

                activeConferenceFilter.innerHTML = "";
                insightResults.innerHTML = "";
                renderConferenceResults(sortTalks(currentTalkList));
              }
            );
        }
      );
    });

}

const stopWords = new Set([
  "the",
  "and",
  "that",
  "with",
  "have",
  "will",
  "this",
  "from",
  "they",
  "their",
  "them",
  "into",
  "your",
  "you",
  "for",
  "our",
  "are",
  "was",
  "were",
  "his",
  "her",
  "she",
  "him",
  "has",
  "had",
  "not",
  "but",
  "all",
  "can",
  "through",
  "there",
  "what",
  "when",
  "where",
  "which",
  "would",
  "could",
  "should",
  "about",
  "said",
  "know",
  "then",
  "than",
  "lord",
  "jesus",
  "christ",
  "life",
  "those",
  "people",
  "church",
  "gospel",
  "father",
  "heavenly",
  "savior",
  "today",
  "many",
  "every",
  "upon",
  "unto",
  "been",
  "more",
  "such",
  "much",
  "very",
  "upon",
  "unto",
  "their",
  "these",
  "those",
  "great",
  "many",
  "every",
  "might",
  "shall",
  "also",
  "often"
]);



function renderStudyCompanion(talks) {

  const wordCounts = {};

  if (!talks.length) {
    studyCompanion.innerHTML = "";
    return;
  }

  const recommendedTalk =
    [...talks]
      .sort(
        (a, b) =>
          b.matches.length -
          a.matches.length
      )[0];

  const speakerTotals = {};

  talks.forEach(talk => {

    speakerTotals[talk.speaker] =
      (speakerTotals[talk.speaker] || 0)
      + talk.matches.length;
  });

  const recommendedSpeaker =
    Object.entries(speakerTotals)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  const conferenceTotals = {};
  const conferenceMetadata = {};

  talks.forEach(talk => {

    const conferenceKey =
      talk.month === 4
        ? `April ${talk.year}`
        : `October ${talk.year}`;

    conferenceMetadata[conferenceKey] = {
      year: talk.year,
      month: talk.month
    };

    conferenceTotals[conferenceKey] =
      (conferenceTotals[conferenceKey] || 0)
      + talk.matches.length;

  });

  const recommendedConference =
    Object.entries(conferenceTotals)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  talks.forEach(talk => {

    talk.matches.forEach(match => {

      const words =
        match.text
          .toLowerCase()
          .replace(/[^a-z\s]/g, "")
          .split(/\s+/);

      words.forEach(word => {

        if (
          word.length < 4 ||
          stopWords.has(word)
        ) {
          return;
        }

        wordCounts[word] =
          (wordCounts[word] || 0) + 1;

      });
    });
  });

  const topThemes =
    Object.entries(wordCounts)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 8);

  const conferenceInfo = conferenceMetadata[recommendedConference[0]];

  studyCompanion.innerHTML = `
    <div class="study-companion-card">

      <h3>
        Study Companion
      </h3>

      <div class="companion-grid">

        <div class="companion-item">
          <h4>📖 Recommended Talk</h4>
          <p class="companion-talk" data-id="${recommendedTalk.talkId}">${recommendedTalk.title}</p>
          <span>${recommendedTalk.matches.length} matches</span>
        </div>

        <div class="companion-item">
          <h4>🎙 Recommended Speaker</h4>
          <p class="companion-speaker" data-speaker="${recommendedSpeaker[0]}">${recommendedSpeaker[0]}</p>
          <span>${recommendedSpeaker[1]} matches</span>
        </div>

        <div class="companion-item">
          <h4>📅 Recommended Conference</h4>
          <p class="companion-conference" data-year="${conferenceInfo.year}" data-month="${conferenceInfo.month}">${recommendedConference[0]}</p>
          <span>${recommendedConference[1]} matches</span>
        </div>
        <div class="companion-item">
          <h4>📚 Top Themes</h4>
          <div class="theme-list">
          ${topThemes.map(
    ([word]) =>
      `<span class="theme-tag">${word}</span>`
  ).join("")}
        </div>
      </div>
    </div>
  </div>
  `;

  document
    .querySelector(".companion-speaker")
    ?.addEventListener(
      "click",
      () => {

        const speaker =
          document.querySelector(
            ".companion-speaker"
          ).dataset.speaker;

        const filteredTalks =
          currentTalkList.filter(
            talk =>
              talk.speaker === speaker
          );

        activeConferenceFilter.innerHTML = `
        <p class="active-filter">
          Showing:
          <strong>${speaker}</strong>

          <button id="clearConferenceFilter">Clear Filter</button></p>
      `;

        renderConferenceResults(sortTalks(filteredTalks));
        renderInsights(filteredTalks, speaker);
        renderStudyCompanion(filteredTalks);
      }
    );

  document
    .querySelector(".companion-conference")
    ?.addEventListener(
      "click",
      () => {

        const year =
          Number(
            document.querySelector(
              ".companion-conference"
            ).dataset.year
          );

        const month =
          Number(
            document.querySelector(
              ".companion-conference"
            ).dataset.month
          );

        const filteredTalks =
          currentTalkList.filter(
            talk =>
              talk.year === year &&
              talk.month === month
          );

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

        renderConferenceResults(sortTalks(filteredTalks));
        renderInsights(filteredTalks, conferenceDate);
        renderStudyCompanion(filteredTalks);
      }
    );

  document
    .querySelector(".companion-talk")
    ?.addEventListener(
      "click",
      async () => {

        const talkId =
          document.querySelector(
            ".companion-talk"
          ).dataset.id;

        let fullTalk;

        if (talkCache[talkId]) {

          fullTalk = talkCache[talkId];

        }
        else {

          const response =
            await fetch(
              `https://openscriptureapi.org/api/conference/v1/lds/en/talk/${talkId}`
            );

          fullTalk = await response.json();
          talkCache[talkId] = fullTalk;

        }

        console.log(
          currentTalkList.find(
            talk =>
              talk.talkId === talkId
          )
        );

        studyCompanionReading.innerHTML = `
        <div class="companion-reading-card">
          <div class="reading-header">
          <h3>Study Companion Reading</h3>

          <button id="clearReading" class="clear-reading">Clear Reading</button>
          </div>
          <h4>${fullTalk.title}</h4>
          <p><strong>${fullTalk.speaker}</strong></p>

          <p>${fullTalk.role || ""}</p>
          ${fullTalk.content.paragraphs
            .map(
              paragraph =>
                `<p>${paragraph.text}</p>`
            )
            .join("")}
        </div>
`;

        document
          .querySelector("#clearReading")
          ?.addEventListener(
            "click",
            () => {
              studyCompanionReading.innerHTML = "";
            }
          );
      }
    );
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
            <span>${mostRelevantTalk.matches.length}matches</span>
          </div>
        ` : ""}
    
        ${mostRelevantConference ? `
          <div class="recommendation-card">
            <h4>Most Relevant Conference</h4>
            <p>${mostRelevantConference[0]}</p>
            <span>${mostRelevantConference[1]} matches</span>
          </div>
        ` : ""}
      </div>
    `;
}

export async function searchConference() {

  const searchTerm = searchInput.value.trim();
  localStorage.setItem("lastConferenceSearch", searchTerm);

  if (!searchTerm) { return; }

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
    console.log("Total Matches:", total); // To be removed when completed

    // Get remaining pages (for operations, it should be offset < total, but for troubleshooting, set total = 500 or 100 for faster pulls)
    for (let offset = limit; offset < total; offset += limit) {

      const response = await fetch(
        `https://openscriptureapi.org/api/conference/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
      );

      const data = await response.json();
      allResults.push(...data.results);
      console.table(allResults.slice(0, 10));
      const percent = Math.round((allResults.length / total) * 100);
      let loadingMessage = "Searching Conference Talks...";

      if (percent >= 95) { loadingMessage = "✓ Study Insights Ready"; }
      else if (percent >= 75) { loadingMessage = "Generating Study Insights..."; }
      else if (percent >= 50) { loadingMessage = "Building Conference Analytics..."; }
      else if (percent >= 25) { loadingMessage = "Collecting Conference Results..."; }

      loadingStatus.innerHTML = `
      <div class="loading-card">
      <div class="spinner"></div>
      <h3>${loadingMessage}</h3>
      <p>Loaded ${allResults.length} of ${total} matches</p>
      <div class="progress-bar">
      <div class="progress-fill" style="width:${percent}%"></div>
      </div>
      <p>${percent}% Complete</p>
    </div>`;
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

      talks[result.talkId].matches.push({ paragraph: result.paragraph, text: result.text });
    });

    const talkList = Object.values(talks);
    currentTalkList = talkList;
    loadingStatus.innerHTML = "";
    renderConferenceResults(sortTalks(talkList));
    renderStudyCompanion(talkList);
    const speakerCounts = {};

    talkList.forEach(talk => {
      const speaker = talk.speaker;
      speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
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

            renderConferenceResults(sortTalks(filteredTalks));
            renderInsights(filteredTalks, speaker);
            renderStudyCompanion(filteredTalks);

            document
              .querySelector("#clearConferenceFilter")
              ?.addEventListener(
                "click",
                () => {

                  activeConferenceFilter.innerHTML = "";
                  insightResults.innerHTML = "";
                  renderConferenceResults(sortTalks(currentTalkList));
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

      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    });

    const sortedDecades =
      Object.entries(decadeCounts)
        .sort((a, b) => b[1] - a[1]);

    console.table(sortedDecades);

    decadeAnalytics.innerHTML = "";

    sortedDecades
      .slice(0, 7)
      .forEach(([decade, count]) => {

        decadeAnalytics.innerHTML += `
          <p class="analytics-item decade-filter"
          data-decade="${decade}">
          <span class="label">${decade}s</span>
          <span class="count">${count}</span></p>`;
      });

    document.querySelectorAll(".decade-filter").forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const decade = Number(item.dataset.decade);

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

          renderConferenceResults(sortTalks(filteredTalks));
          renderInsights(filteredTalks, `${decade}s`);
          renderStudyCompanion(filteredTalks);

          document
            .querySelector("#clearConferenceFilter")
            ?.addEventListener(
              "click",
              () => {

                activeConferenceFilter.innerHTML = "";
                insightResults.innerHTML = "";
                renderConferenceResults(sortTalks(currentTalkList));
              }
            );
        }
      );
    });

  } catch (error) {
    console.error(error);
    conferenceResults.textContent = `Error: ${error.message}`;
  }
}