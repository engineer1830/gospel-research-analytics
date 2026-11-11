export function normalizeScriptureBook(book) {

  const aliases = {

    // =========================
    // Book of Mormon
    // =========================

    "The First Book of Nephi": "1 Nephi",
    "First Nephi": "1 Nephi",

    "The Second Book of Nephi": "2 Nephi",
    "Second Nephi": "2 Nephi",

    "Third Nephi": "3 Nephi",
    "Fourth Nephi": "4 Nephi",

    "The Book of Jacob": "Jacob",
    "The Book of Enos": "Enos",
    "The Book of Jarom": "Jarom",
    "The Book of Omni": "Omni",

    "The Words of Mormon": "Words of Mormon",

    "The Book of Mosiah": "Mosiah",
    "The Book of Alma": "Alma",
    "The Book of Helaman": "Helaman",

    "The Book of Third Nephi": "3 Nephi",
    "The Book of Fourth Nephi": "4 Nephi",

    "The Book of Mormon": "Mormon",
    "The Book of Ether": "Ether",
    "The Book of Moroni": "Moroni",

    // =========================
    // Doctrine and Covenants
    // =========================

    "Doctrine & Covenants":
      "Doctrine and Covenants",

    "D&C":
      "Doctrine and Covenants",

    // =========================
    // Pearl of Great Price
    // =========================

    "The Articles of Faith":
      "Articles of Faith",

    "Joseph Smith History":
      "Joseph Smith—History",

    "Joseph Smith-History":
      "Joseph Smith—History",

    "Joseph Smith Matthew":
      "Joseph Smith—Matthew",

    "Joseph Smith-Matthew":
      "Joseph Smith—Matthew",

    // =========================
    // New Testament Variants
    // =========================

    "Corinthians":
      "1 Corinthians",

    "First Corinthians":
      "1 Corinthians",

    "Second Corinthians":
      "2 Corinthians",

    "Timothy":
      "1 Timothy",

    "First Timothy":
      "1 Timothy",

    "Second Timothy":
      "2 Timothy",

    "Peter":
      "1 Peter",

    "First Peter":
      "1 Peter",

    "Second Peter":
      "2 Peter",

    "First John":
      "1 John",

    "Second John":
      "2 John",

    "Third John":
      "3 John",

    "First Thessalonians":
      "1 Thessalonians",

    "Second Thessalonians":
      "2 Thessalonians",

    "First Samuel":
      "1 Samuel",

    "Second Samuel":
      "2 Samuel",

    "First Kings":
      "1 Kings",

    "Second Kings":
      "2 Kings",

    "First Chronicles":
      "1 Chronicles",

    "Second Chronicles":
      "2 Chronicles"

  };

  return aliases[book] || book;
}

export function normalizeReferenceBook(book) {

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

export function parseReference(reference) {

  const match =
    reference.match(
      /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/
    );

  if (!match) {
    return null;
  }

  return {
    book:
      normalizeReferenceBook(match[1]),

    chapter:
      match[2],

    startVerse:
      Number(match[3]),

    endVerse:
      Number(match[4] || match[3])
  };
}

export function classifyVolume(book) {

  book = normalizeScriptureBook(book);

  const volumeMap = {

    // Old Testament

    "Genesis": "Old Testament",
    "Exodus": "Old Testament",
    "Leviticus": "Old Testament",
    "Numbers": "Old Testament",
    "Deuteronomy": "Old Testament",

    "Joshua": "Old Testament",
    "Judges": "Old Testament",
    "Ruth": "Old Testament",

    "1 Samuel": "Old Testament",
    "2 Samuel": "Old Testament",

    "1 Kings": "Old Testament",
    "2 Kings": "Old Testament",

    "1 Chronicles": "Old Testament",
    "2 Chronicles": "Old Testament",

    "Ezra": "Old Testament",
    "Nehemiah": "Old Testament",
    "Esther": "Old Testament",

    "Job": "Old Testament",
    "Psalms": "Old Testament",
    "Proverbs": "Old Testament",
    "Ecclesiastes": "Old Testament",
    "Song of Solomon": "Old Testament",

    "Isaiah": "Old Testament",
    "Jeremiah": "Old Testament",
    "Lamentations": "Old Testament",
    "Ezekiel": "Old Testament",
    "Daniel": "Old Testament",

    "Hosea": "Old Testament",
    "Joel": "Old Testament",
    "Amos": "Old Testament",
    "Obadiah": "Old Testament",
    "Jonah": "Old Testament",
    "Micah": "Old Testament",
    "Nahum": "Old Testament",
    "Habakkuk": "Old Testament",
    "Zephaniah": "Old Testament",
    "Haggai": "Old Testament",
    "Zechariah": "Old Testament",
    "Malachi": "Old Testament",

    // New Testament

    "Matthew": "New Testament",
    "Mark": "New Testament",
    "Luke": "New Testament",
    "John": "New Testament",

    "Acts": "New Testament",

    "Romans": "New Testament",

    "1 Corinthians": "New Testament",
    "2 Corinthians": "New Testament",

    "Galatians": "New Testament",
    "Ephesians": "New Testament",
    "Philippians": "New Testament",
    "Colossians": "New Testament",

    "1 Thessalonians": "New Testament",
    "2 Thessalonians": "New Testament",

    "1 Timothy": "New Testament",
    "2 Timothy": "New Testament",

    "Titus": "New Testament",
    "Philemon": "New Testament",

    "Hebrews": "New Testament",
    "James": "New Testament",

    "1 Peter": "New Testament",
    "2 Peter": "New Testament",

    "1 John": "New Testament",
    "2 John": "New Testament",
    "3 John": "New Testament",

    "Jude": "New Testament",
    "Revelation": "New Testament",

    // Book of Mormon

    "1 Nephi": "Book of Mormon",
    "2 Nephi": "Book of Mormon",

    "Jacob": "Book of Mormon",
    "Enos": "Book of Mormon",
    "Jarom": "Book of Mormon",
    "Omni": "Book of Mormon",

    "Words of Mormon": "Book of Mormon",

    "Mosiah": "Book of Mormon",
    "Alma": "Book of Mormon",
    "Helaman": "Book of Mormon",

    "3 Nephi": "Book of Mormon",
    "4 Nephi": "Book of Mormon",

    "Mormon": "Book of Mormon",
    "Ether": "Book of Mormon",
    "Moroni": "Book of Mormon",

    // Doctrine and Covenants

    "Doctrine and Covenants":
      "Doctrine and Covenants",

    // Pearl of Great Price

    "Moses": "Pearl of Great Price",

    "Abraham": "Pearl of Great Price",

    "Joseph Smith—Matthew":
      "Pearl of Great Price",

    "Joseph Smith-History":
      "Pearl of Great Price",

    "Joseph Smith—History":
      "Pearl of Great Price",

    "Articles of Faith":
      "Pearl of Great Price"
  };

  return volumeMap[book] || "Unknown";
}

