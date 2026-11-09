


const searchBtn = document.querySelector("#searchBtn");
const searchInput = document.querySelector("#searchInput");
const results = document.querySelector("#results");
const speakerResults = document.querySelector("#speakerResults");

searchBtn.addEventListener("click", searchConference);

async function searchConference() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        return;
    }

    try {

        let allResults = [];

        for (let offset = 0; offset < 300; offset += 100) {

            const url =
                `https://openscriptureapi.org/api/conference/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=100&offset=${offset}`;

            console.log("Fetching:", url);

            const response = await fetch(url);
            const data = await response.json();

            console.log(
                `Offset ${offset}:`,
                data.results[0].talkId
            );

            allResults.push(...data.results);
        }

        console.log("Combined Results:", allResults.length);

        // Show a sample of the combined data
        results.textContent =
            JSON.stringify(allResults.slice(0, 5), null, 2);

        // Build speaker analytics
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
                Combined Results: ${allResults.length}
            </h3>
        `;

        sortedSpeakers.forEach(([speaker, count]) => {
            speakerResults.innerHTML += `
                <p>${speaker}: ${count}</p>
            `;
        });

    } catch (error) {

        console.error(error);

        results.textContent =
            `Error: ${error.message}`;
    }
}