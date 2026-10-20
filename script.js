/* ==========================================================================
   Moodtape
   Pick a mood, get a playlist. Plain JavaScript, no libraries.

   How it works:
   1. MOODS holds all the data (colours + songs).
   2. "state" holds what is happening right now (mood, song, playing or not).
   3. Small functions change the state, then update the screen.
   ========================================================================== */

/* ---------- 1. Data ---------- */

// Each song is [title, artist]. Preview length is how long the fake playback lasts.
const PREVIEW_SECONDS = 30;

const MOODS = [
  {
    id: "focus", name: "Focus", emoji: "🎧",
    headline: "Today I feel focused.",
    tagline: "Calm, wordless music for deep work.",
    bg: "#1d3a5f", ink: "#eef5ff", accent: "#8ecbff",
    tracks: [
      ["Weightless", "Marconi Union"],
      ["Experience", "Ludovico Einaudi"],
      ["Intro", "The xx"],
      ["Time", "Hans Zimmer"],
      ["Clair de Lune", "Claude Debussy"],
      ["River Flows in You", "Yiruma"],
      ["Comptine d'un autre été", "Yann Tiersen"],
      ["Gymnopédie No. 1", "Erik Satie"],
    ],
  },
  {
    id: "gym", name: "Gym", emoji: "💪",
    headline: "Today I feel unstoppable.",
    tagline: "Loud, fast and made for one more rep.",
    bg: "#b92a12", ink: "#fff1e2", accent: "#ffd23f",
    tracks: [
      ["Eye of the Tiger", "Survivor"],
      ["Lose Yourself", "Eminem"],
      ["Stronger", "Kanye West"],
      ["Can't Hold Us", "Macklemore & Ryan Lewis"],
      ["Remember the Name", "Fort Minor"],
      ["Believer", "Imagine Dragons"],
      ["Zinda", "Siddharth Mahadevan"],
      ["Till I Collapse", "Eminem"],
    ],
  },
  {
    id: "heartbreak", name: "Heartbreak", emoji: "💔",
    headline: "Today I feel heartbroken.",
    tagline: "Have a good cry, then feel a little better.",
    bg: "#3b1c4a", ink: "#ffe8f0", accent: "#ff7aa8",
    tracks: [
      ["Someone Like You", "Adele"],
      ["Channa Mereya", "Arijit Singh"],
      ["Tum Hi Ho", "Arijit Singh"],
      ["All Too Well", "Taylor Swift"],
      ["drivers license", "Olivia Rodrigo"],
      ["The Night We Met", "Lord Huron"],
      ["Skinny Love", "Bon Iver"],
      ["Agar Tum Saath Ho", "Alka Yagnik & Arijit Singh"],
    ],
  },
  {
    id: "roadtrip", name: "Road trip", emoji: "🚗",
    headline: "Today I feel like driving.",
    tagline: "Windows down, volume up, no destination.",
    bg: "#f2b632", ink: "#1f1a08", accent: "#0e6e5c",
    tracks: [
      ["Go Your Own Way", "Fleetwood Mac"],
      ["Life Is a Highway", "Tom Cochrane"],
      ["Take Me Home, Country Roads", "John Denver"],
      ["Dil Chahta Hai", "Shankar-Ehsaan-Loy"],
      ["Ilahi", "Arijit Singh"],
      ["Don't Stop Believin'", "Journey"],
      ["Sweet Home Alabama", "Lynyrd Skynyrd"],
      ["Africa", "Toto"],
    ],
  },
  {
    id: "chill", name: "Chill", emoji: "🌿",
    headline: "Today I feel relaxed.",
    tagline: "Slow Sunday energy. Nothing to do.",
    bg: "#bfe3c0", ink: "#14301f", accent: "#2a7f62",
    tracks: [
      ["Sunday Morning", "Maroon 5"],
      ["Banana Pancakes", "Jack Johnson"],
      ["Put Your Records On", "Corinne Bailey Rae"],
      ["Budapest", "George Ezra"],
      ["Dreams", "Fleetwood Mac"],
      ["Cold/Mess", "Prateek Kuhad"],
      ["Sunflower", "Post Malone & Swae Lee"],
      ["Electric Feel", "MGMT"],
    ],
  },
  {
    id: "party", name: "Party", emoji: "🪩",
    headline: "Today I feel like dancing.",
    tagline: "Songs everyone knows the words to.",
    bg: "#ff4fa3", ink: "#1b0a2a", accent: "#fff35c",
    tracks: [
      ["Levitating", "Dua Lipa"],
      ["Uptown Funk", "Mark Ronson ft. Bruno Mars"],
      ["Blinding Lights", "The Weeknd"],
      ["Shut Up and Dance", "Walk the Moon"],
      ["Badtameez Dil", "Benny Dayal"],
      ["Nashe Si Chadh Gayi", "Arijit Singh"],
      ["Get Lucky", "Daft Punk"],
      ["Can't Stop the Feeling!", "Justin Timberlake"],
    ],
  },
];

// A special "mood" that shows every song the user has liked
const LIKED = {
  id: "liked", name: "Liked", emoji: "❤️",
  headline: "My liked songs.",
  tagline: "Everything you saved, from every mood.",
  bg: "#7a0f2a", ink: "#ffe9ec", accent: "#ff9aa9",
  tracks: [],
};

const ALL_VIEWS = [...MOODS, LIKED];

/* ---------- 2. Small helpers ---------- */

const $ = (selector) => document.querySelector(selector);

// Icons are inline SVG so they take the text colour automatically
const svg = (inner, extra = "") =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${inner}</svg>`;
const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  play: svg('<path d="M8 5v14l11-7z"/>', 'fill="currentColor"'),
  pause: svg('<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>', 'fill="currentColor"'),
  prev: svg('<path d="M6 6h2v12H6zM20 6v12L9.5 12z"/>', 'fill="currentColor"'),
  next: svg('<path d="M16 6h2v12h-2zM4 6l10.5 6L4 18z"/>', 'fill="currentColor"'),
  shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>', stroke),
  heart: svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', stroke),
  open: svg('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>', stroke),
};

// Saving to the browser can fail (private mode), so always wrap it
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  },
};

const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const formatTime = (seconds) => {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const youtubeLink = (track) =>
  "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${track.title} ${track.artist}`);

/* ---------- 3. State ---------- */

const state = {
  view: store.get("moodtape-mood", "focus"), // which mood list is on screen
  queue: [],                                 // songs in that list
  current: null,                             // the song that is loaded in the player
  playing: false,
  elapsed: 0,                                // seconds into the 30s preview
  shuffle: false,
  liked: new Set(store.get("moodtape-liked", [])),
};

function buildQueue(viewId) {
  const makeTrack = (mood, [title, artist], i) => ({ id: `${mood.id}:${i}`, title, artist, mood });

  if (viewId === "liked") {
    return MOODS.flatMap((mood) => mood.tracks.map((t, i) => makeTrack(mood, t, i)))
      .filter((track) => state.liked.has(track.id));
  }
  const mood = MOODS.find((m) => m.id === viewId);
  return mood.tracks.map((t, i) => makeTrack(mood, t, i));
}

const currentIndex = () => state.queue.findIndex((t) => state.current && t.id === state.current.id);
const viewMood = () => ALL_VIEWS.find((m) => m.id === state.view);

/* ---------- 4. Drawing the screen ---------- */

const el = {
  headline: $("#headline"),
  moods: $("#moods"),
  plTitle: $("#plTitle"),
  plTag: $("#plTag"),
  tracks: $("#tracks"),
  disc: $("#disc"),
  discEmoji: $("#discEmoji"),
  nowTitle: $("#nowTitle"),
  nowArtist: $("#nowArtist"),
  seek: $("#seek"),
  tNow: $("#tNow"),
  tEnd: $("#tEnd"),
  playBtn: $("#playBtn"),
  prevBtn: $("#prevBtn"),
  nextBtn: $("#nextBtn"),
  shuffleBtn: $("#shuffleBtn"),
  likeBtn: $("#likeBtn"),
};

// Mood buttons at the top
function renderMoodChips() {
  el.moods.innerHTML = "";
  ALL_VIEWS.forEach((mood) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.dataset.mood = mood.id;
    chip.innerHTML = `<span class="chip-emoji" aria-hidden="true">${mood.emoji}</span><span>${esc(mood.name)}</span>`;
    chip.addEventListener("click", () => selectMood(mood.id, true));
    el.moods.appendChild(chip);
  });
  updateChips();
}

function updateChips() {
  el.moods.querySelectorAll(".chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.mood === state.view));
    if (chip.dataset.mood === "liked") {
      chip.querySelector(".chip-count")?.remove();
      if (state.liked.size > 0) {
        const count = document.createElement("span");
        count.className = "chip-count";
        count.textContent = state.liked.size;
        chip.appendChild(count);
      }
    }
  });
}

// The list of songs
function renderTracks() {
  el.tracks.innerHTML = "";

  if (state.queue.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No liked songs yet. Tap the heart on any song to save it here.";
    el.tracks.appendChild(empty);
    return;
  }

  state.queue.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = "track";
    li.dataset.id = track.id;

    const main = document.createElement("button");
    main.type = "button";
    main.className = "track-main";
    main.innerHTML =
      `<span class="idx"><span class="num">${i + 1}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>` +
      `<span class="info"><span class="name">${esc(track.title)}</span><span class="artist">${esc(track.artist)}</span></span>`;
    main.addEventListener("click", () => {
      if (state.current && state.current.id === track.id) togglePlay();
      else playTrack(track);
    });

    const actions = document.createElement("div");
    actions.className = "track-actions";

    const like = document.createElement("button");
    like.type = "button";
    like.className = "icon-btn like";
    like.innerHTML = ICONS.heart;
    like.setAttribute("aria-label", `Like ${track.title}`);
    like.addEventListener("click", () => toggleLike(track.id));

    const open = document.createElement("a");
    open.className = "icon-btn";
    open.href = youtubeLink(track);
    open.target = "_blank";
    open.rel = "noopener";
    open.innerHTML = ICONS.open;
    open.setAttribute("aria-label", `Open ${track.title} on YouTube`);

    actions.append(like, open);
    li.append(main, actions);
    el.tracks.appendChild(li);
  });

  refreshTrackStates();
}

// Highlight the current song and fill in the hearts
function refreshTrackStates() {
  el.tracks.querySelectorAll(".track").forEach((li) => {
    const isCurrent = !!state.current && li.dataset.id === state.current.id;
    li.classList.toggle("current", isCurrent);
    li.classList.toggle("playing", isCurrent && state.playing);
    const heart = li.querySelector(".like");
    heart.setAttribute("aria-pressed", String(state.liked.has(li.dataset.id)));
  });
}

// The now playing card
function renderPlayer() {
  const track = state.current;

  el.disc.classList.toggle("spinning", state.playing);
  el.discEmoji.textContent = track ? track.mood.emoji : viewMood().emoji;

  if (track) {
    el.nowTitle.textContent = track.title;
    el.nowArtist.textContent = track.artist;
  } else {
    el.nowTitle.textContent = "Nothing playing yet";
    el.nowArtist.textContent = "Pick a mood, then pick a song.";
  }

  el.playBtn.innerHTML = state.playing ? ICONS.pause : ICONS.play;
  el.playBtn.setAttribute("aria-label", state.playing ? "Pause" : "Play");

  el.shuffleBtn.setAttribute("aria-pressed", String(state.shuffle));

  const liked = !!track && state.liked.has(track.id);
  el.likeBtn.setAttribute("aria-pressed", String(liked));
  el.likeBtn.setAttribute("aria-label", liked ? "Remove from liked songs" : "Like this song");
  el.likeBtn.disabled = !track;
  el.likeBtn.style.opacity = track ? "" : "0.4";
}

function updateProgress() {
  const fraction = state.elapsed / PREVIEW_SECONDS;
  el.seek.value = Math.round(fraction * 1000);
  el.seek.style.setProperty("--pct", `${fraction * 100}%`);
  el.tNow.textContent = formatTime(state.elapsed);
  el.tEnd.textContent = formatTime(PREVIEW_SECONDS);
}

/* ---------- 5. Actions ---------- */

// Switch the page to a mood: colours, headline, list
function selectMood(id, autoplay) {
  state.view = id;
  state.queue = buildQueue(id);
  const mood = viewMood();

  // Colours: the CSS reads these three variables everywhere
  const root = document.documentElement.style;
  root.setProperty("--bg", mood.bg);
  root.setProperty("--ink", mood.ink);
  root.setProperty("--accent", mood.accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mood.bg);

  // Headline (restart the little slide-in animation)
  el.headline.textContent = mood.headline;
  el.headline.classList.remove("swap");
  void el.headline.offsetWidth;
  el.headline.classList.add("swap");

  el.plTitle.textContent = mood.name;
  el.plTag.textContent = mood.tagline;

  renderTracks();
  updateChips();
  store.set("moodtape-mood", id);

  if (autoplay && state.queue.length > 0) playTrack(state.queue[0]);
  else renderPlayer();
}

function playTrack(track) {
  state.current = track;
  state.elapsed = 0;
  state.playing = true;
  refreshTrackStates();
  renderPlayer();
  updateProgress();
}

function togglePlay() {
  if (!state.current) {
    if (state.queue.length > 0) playTrack(state.queue[0]);
    return;
  }
  state.playing = !state.playing;
  refreshTrackStates();
  renderPlayer();
}

function nextTrack() {
  const length = state.queue.length;
  if (length === 0) return;
  let index = currentIndex();

  if (state.shuffle && length > 1) {
    let pick;
    do { pick = Math.floor(Math.random() * length); } while (pick === index);
    index = pick;
  } else {
    index = (index + 1) % length;
  }
  playTrack(state.queue[index]);
}

function prevTrack() {
  const length = state.queue.length;
  if (length === 0) return;
  if (state.elapsed > 3) { state.elapsed = 0; updateProgress(); return; }
  const index = currentIndex();
  playTrack(state.queue[index <= 0 ? length - 1 : index - 1]);
}

function toggleLike(id) {
  if (state.liked.has(id)) state.liked.delete(id);
  else state.liked.add(id);
  store.set("moodtape-liked", [...state.liked]);

  // In the Liked view, an unliked song should disappear from the list
  if (state.view === "liked") {
    state.queue = buildQueue("liked");
    renderTracks();
  } else {
    refreshTrackStates();
  }
  updateChips();
  renderPlayer();
}

// Pick a random mood and a random song from it
function surpriseMe() {
  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  selectMood(mood.id, false);
  playTrack(state.queue[Math.floor(Math.random() * state.queue.length)]);
}

/* ---------- 6. Wiring everything up ---------- */

el.prevBtn.innerHTML = ICONS.prev;
el.nextBtn.innerHTML = ICONS.next;
el.shuffleBtn.innerHTML = ICONS.shuffle;
el.likeBtn.innerHTML = ICONS.heart;

el.playBtn.addEventListener("click", togglePlay);
el.prevBtn.addEventListener("click", prevTrack);
el.nextBtn.addEventListener("click", nextTrack);
el.shuffleBtn.addEventListener("click", () => {
  state.shuffle = !state.shuffle;
  renderPlayer();
});
el.likeBtn.addEventListener("click", () => state.current && toggleLike(state.current.id));
$("#playAll").addEventListener("click", () => state.queue.length && playTrack(state.queue[0]));
$("#surprise").addEventListener("click", surpriseMe);

el.seek.addEventListener("input", () => {
  state.elapsed = (el.seek.value / 1000) * PREVIEW_SECONDS;
  updateProgress();
});

// Keyboard: space plays or pauses, arrows skip
document.addEventListener("keydown", (event) => {
  const tag = event.target.tagName;
  if (tag === "BUTTON" || tag === "INPUT" || tag === "A") return;
  if (event.code === "Space") { event.preventDefault(); togglePlay(); }
  if (event.code === "ArrowRight") nextTrack();
  if (event.code === "ArrowLeft") prevTrack();
});

// The fake "audio": move the progress bar forward every 0.1 seconds
setInterval(() => {
  if (!state.playing) return;
  state.elapsed += 0.1;
  if (state.elapsed >= PREVIEW_SECONDS) nextTrack();
  else updateProgress();
}, 100);

// Start up
if (!ALL_VIEWS.some((m) => m.id === state.view)) state.view = "focus";
renderMoodChips();
selectMood(state.view, false);
updateProgress();
