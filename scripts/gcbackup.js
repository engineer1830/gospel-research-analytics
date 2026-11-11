import {normalizeScriptureBook} from "./normalization.mjs";

const searchBtn = document.querySelector("#searchBtn");
const searchInput = document.querySelector("#searchInput");

const results = document.querySelector("#conferenceResults");
const speakerResults = document.querySelector("#speakerResults");
const yearResults = document.querySelector("#yearResults");

const lookupBtn = document.querySelector("#lookupBtn");
const lookupScripture = document.querySelector("#lookupScripture");
const verseResults = document.querySelector("#verseResults");

const searchScriptureBtn = document.querySelector("#searchScriptureBtn");
const searchScripture = document.querySelector("#searchScripture");
const scriptureResults = document.querySelector("#scriptureResults");

const scriptureAnalytics = document.querySelector("#scriptureAnalytics");
const book = normalizeScriptureBook(result.book);

searchBtn.addEventListener("click", searchConference);
lookupBtn.addEventListener("click", lookupVerse);
searchScriptureBtn.addEventListener("click", searchScriptures);

async function searchConference() {
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

        // Get remaining pages 
        // (for operations, it should be offset < total, but for proof of concept I have set total = 500 for faster pulls)
        for (let offset = limit; offset < 500; offset += limit) {

            const response = await fetch(
                `https://openscriptureapi.org/api/conference/v1/lds/en/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}&offset=${offset}`
            );

            const data = await response.json();

            allResults.push(...data.results);

            console.log(
                `Fetched ${allResults.length} of ${total}`
            );
        }

        console.log("Final Result Count:", allResults.length);

        // Display sample JSON
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

async function lookupVerse() {

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

function normalizeBook(book) {

    const aliases = {

        "d&c":
            "doctrineandcovenants",

        "d & c":
            "doctrineandcovenants",

        "dc":
            "doctrineandcovenants",

        "doctrine and covenants":
            "doctrineandcovenants",

        "doctrine & covenants":
            "doctrineandcovenants",

        "jsh":
            "josephsmithhistory",

        "joseph smith history":
            "josephsmithhistory",

        "aof":
            "articlesoffaith",

        "articles of faith":
            "articlesoffaith"
    };

    const key =
        book
            .toLowerCase()
            .trim();

    return aliases[key]
        || key.replace(/\s+/g, "");
}

function parseReference(reference) {

    const match =
        reference.match(
            /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/
        );

    if (!match) {
        return null;
    }

    return {
        book:
            normalizeBook(match[1]),

        chapter:
            match[2],

        startVerse:
            Number(match[3]),

        endVerse:
            Number(match[4] || match[3])
    };
}

async function searchScriptures() {

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

            console.log(
                `Fetched ${allResults.length} of ${total}`
            );
        }

        console.log(
            "Final Result Count:",
            allResults.length
        );

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

                const book =
                    result.book;

                bookCounts[book] =
                    (bookCounts[book] || 0) + 1;
            }
        );

        const sortedBooks =
            Object.entries(bookCounts)
                .sort(
                    (a, b) => b[1] - a[1]
                );

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

        scriptureResults.textContent =
            `Error: ${error.message}`;
    }
}