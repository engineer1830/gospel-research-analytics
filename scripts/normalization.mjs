export function normalizeScriptureBook(book) {

  const aliases = {

    "The First Book of Nephi": "1 Nephi",
    "The Second Book of Nephi": "2 Nephi",

    "Third Nephi": "3 Nephi",
    "Fourth Nephi": "4 Nephi",

    "The Book of Jacob": "Jacob",
    "The Book of Enos": "Enos",
    "The Book of Jarom": "Jarom",
    "The Book of Omni": "Omni",

    "The Book of Alma": "Alma",

    "Doctrine and Covenants":
      "Doctrine and Covenants",

    "The Articles of Faith":
      "Articles of Faith"
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