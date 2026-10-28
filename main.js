const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const form = document.querySelector("#search-form");

const input = document.querySelector("#word-input");

const searchBtn = document.querySelector("#search-btn");

const status = document.querySelector("#status");

const result = document.querySelector("#result");

const favoritesContainer = document.querySelector("#favorites");

const themeBtn = document.querySelector("#theme-btn");

let currentEntry = null;
let favorites = loadFavorites();

function loadfavorites (){
    try {
        const saved= JSON.parse (localStorage.getItem("favorites"));
        return Array.isArray(saved) ? saved :[];

    }
    catch {
        return [];
    }
}

function saveFavorites(){
    try{
        localStorage.setItem ("favorites", JSON.stringify(favorites));
        return true;
    }
    catch{
        showStatus("could not save word to favorites", true);
        return false;
    }
}

function showStatus(message, isError = false){
    status.textContent= message;
    status.className= isError ? "error": "";

}

function createElement(tag, className, text=""){
    const element= document.createElement(tag);
    element.textContent= text;
    return element;
}

async function searchWord(word){
    const cleanWord= word.trim();
    if (!cleanWord){
        showStatus("Enter a word to search", true);
        return;
    }
    searchBtn.disabled= true;
    searchBtn.textContent= "searching"
    result.replaceChildren();
    currentEntry= null;
    showStatus("searching");

    try {
        const response= await fetch( API_URL + encodeURIComponent(cleanWord));
    

    if (response.status == 404){
        throw new Error ('Word not Found')

    }
    if (!response.ok){
        throw new Error('Dictionary Unavailable');

    }
    const data = await response.JSON();

    if (!Array.isArray(data)|| !data.lenght){
        throw new Error('Could Not load Dictionary');
        }
    currentEntry= data[];
    displayWord(currentEntry);
    showStatus('Word Found');
}
    catch(error){
        showStatus(
            error instanceof TypeError ? "try again"
            : error.message || "Try again", true );
        
    }
    finally{
        searchBtn.disabled= false;
        searchBtn.textContent="Search";
        
    }
}

function displayWord (entry){
    const card = createElement("article", "wordCard");
    const heading=  createElement('div', "wordHeading");
    heading.append(createElement("h2", "", entry.word || "unknown word"));

    const phonetic=
    entry.phonetic || entry.phonetics?.find(item =>
        item.text)?.text||"pronunciation Unavailable";
        /* yet to understand */

   const phoneticElement = createElement("p", "phonetic", phonetic);

    const audioUrl = entry.phonetics?.find(item =>
     item.audio)?.audio;
     
    if (audioUrl) {
    const audioBtn = createElement("button", "audio-btn", "Listen");
    audioBtn.type = "button";

     audioBtn.addEventListener("click", () => {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        showStatus("Audio playback failed. Try again.", true);
      });
    });
  heading.append(audioBtn);

}

const isSaved = favorites.some(
    word => word.word.toLowerCase() === entry.word.toLowerCase()
  );

  const saveBtn = createElement(
    "button",
    `save-btn ${isSaved ? "saved" : ""}`,
    isSaved ? " Saved" : " Save word"
  );

  saveBtn.type = "button";
  saveBtn.addEventListener("click", () => toggleFavorite(entry));
  heading.append(saveBtn);

    card.append(heading, phoneticElement);

  (entry.meanings || []).forEach(meaning => {
    card.append(
      createElement("h3", "section-title", meaning.partOfSpeech || "Meaning")
    );

    (meaning.definitions || []).forEach((item, index) => {
      const definition = createElement(
        "div",
        "definition",
        `${index + 1}. ${item.definition || "Definition unavailable"}`
      ); // 

      if (item.example) {
        definition.append(
          createElement("p", "example", `Example: "${item.example}"`)
        );
      }

      card.append(definition);
    });
 const synonyms = [
      ...new Set([
        ...(meaning.synonyms || []),
        ...(meaning.definitions || []).flatMap(item => item.synonyms || [])
      ])
    ];

    if (synonyms.length) {
      card.append(createElement("h4", "", "Synonyms"));

      const tags = createElement("div", "tag-list");

      synonyms.forEach(synonym => {
        tags.append(createElement("span", "tag", synonym));
      });

      card.append(tags);
    }
  });
  const sourceUrl = entry.sourceUrls?.[0];

  if (sourceUrl) {
    const source = document.createElement("a");
    source.href = sourceUrl;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "View source";
    card.append(source);
  }

  result.replaceChildren(card);
}
// Add or remove a word from favorites.
function toggleFavorite(entry) {
  const word = entry.word.toLowerCase();

  if (favorites.some(item => item.word.toLowerCase() === word)) {
    favorites = favorites.filter(
      item => item.word.toLowerCase() !== word
    );
  } else {
    favorites.push({
      word: entry.word,
      phonetic: entry.phonetic || "",
      definition:
        entry.meanings?.[0]?.definitions?.[0]?.definition ||
        "No definition available."
    });
  }

  if (saveFavorites()) {
    renderFavorites();

    if (currentEntry) {
      displayWord(currentEntry);
    }
  }
}

// Display the saved vocabulary list.
function renderFavorites() {
  favoritesContainer.replaceChildren();

  if (!favorites.length) {
    favoritesContainer.append(
      createElement("p", "muted", "No saved words yet")
    );
    return;
  }

  favorites.forEach(item => 
    {
    const card = createElement("div", "favorite-card");
    const details = createElement("div", "");
    details.append(
      createElement("h3", "", item.word),
      createElement("p", "", item.definition)
    );

    const actions = createElement("div", "favorite-actions");

    const viewBtn = createElement("button", "primary-btn", "View");
    viewBtn.type = "button";
    viewBtn.addEventListener("click", () => 
        {
      input.value = item.word;
      searchWord(item.word);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const removeBtn = createElement("button", "remove-btn", "Remove");
    removeBtn.type = "button";
    removeBtn.addEventListener("click", () =>
         {
      favorites = favorites.filter(
        word => word.word.toLowerCase() !== item.word.toLowerCase()
      );

      if (saveFavorites()) {
        renderFavorites();

        if (currentEntry) {
          displayWord(currentEntry);
        }
      }
    });

    actions.append(viewBtn, removeBtn);
    card.append(details, actions);
    favoritesContainer.append(card);
  });
}
// Handle form submission without reloading the page.
form.addEventListener("submit", event => 
    {
  event.preventDefault();
  searchWord(input.value);
});

// Toggle between light and dark themes.
themeBtn.addEventListener("click", () => 
    {  const isDark = document.body.classList.toggle("dark");
  themeBtn.textContent = isDark ? " Light mode" : " Dark mode";
});

renderFavorites();