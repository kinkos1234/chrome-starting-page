// script.js - Premium Crystal Office v2.0 (Dynamic Bookmark Management)

let currentEngine = "google";
let currentBookmarkData = null;
let calendarTodos = {};

document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initSearch();
  initDashboard();
  initSettings();
});

/* --- Clock Logic --- */
let activeClocks = [
  { name: "SEOUL", zone: "Asia/Seoul", id: "clock-0" },
  { name: "DETROIT", zone: "America/Detroit", id: "clock-1" },
  { name: "BERLIN", zone: "Europe/Berlin", id: "clock-2" },
  { name: "CHENNAI", zone: "Asia/Kolkata", id: "clock-3" },
];

function initClock() {
  renderClocksDOM();
  updateClocks();
  setInterval(updateClocks, 1000);
}

function renderClocksDOM() {
  const container = document.querySelector(".clock-container");
  if (!container) return;
  container.innerHTML = "";
  activeClocks.forEach((clock) => {
    const item = document.createElement("div");
    item.className = "clock-item";
    item.innerHTML = `<span class="clock-label">${clock.name}</span><span class="clock-time" id="${clock.id}">--:--</span>`;
    container.appendChild(item);
  });
}

function updateClocks() {
  activeClocks.forEach((clock) => {
    const el = document.getElementById(clock.id);
    if (el) {
      try {
        el.textContent = new Date().toLocaleTimeString("en-GB", {
          timeZone: clock.zone,
        });
      } catch (e) {
        el.textContent = "Invalid TZ";
      }
    }
  });
}

/* --- Search Logic --- */
function initSearch() {
  const toggleBtn = document.getElementById("search-toggle");
  const searchIcon = document.getElementById("search-icon");
  const searchInput = document.getElementById("search-input");

  toggleBtn.addEventListener("click", () => {
    if (currentEngine === "google") {
      currentEngine = "naver";
      searchIcon.src = "https://www.naver.com/favicon.ico";
      searchInput.placeholder = "Naver Search...";
    } else if (currentEngine === "naver") {
      currentEngine = "youtube";
      searchIcon.src = "https://www.youtube.com/favicon.ico";
      searchInput.placeholder = "YouTube Search...";
    } else {
      currentEngine = "google";
      searchIcon.src = "https://www.google.com/favicon.ico";
      searchInput.placeholder = "Google Search...";
    }
    searchInput.focus();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        let url =
          currentEngine === "google"
            ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
            : currentEngine === "naver"
              ? `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`
              : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        window.location.href = url;
      }
    }
  });
}

/* --- Dashboard Logic (Dynamic Rendering) --- */
async function initDashboard() {
  const gridContainer = document.getElementById("masonry-grid");
  gridContainer.innerHTML = "";

  const topSection = document.createElement("div");
  topSection.className = "grid-section-top";
  gridContainer.appendChild(topSection);

  const bottomSection = document.createElement("div");
  bottomSection.className = "grid-section-bottom";
  gridContainer.appendChild(bottomSection);

  try {
    const [bookmarksRes, notesRes, todosRes] = await Promise.all([
      fetch("/api/bookmarks"),
      fetch("/api/notes"),
      fetch("/api/todos")
    ]);

    if (!bookmarksRes.ok) throw new Error("Failed to fetch bookmarks");

    const bookmarkData = await bookmarksRes.json();
    currentBookmarkData = bookmarkData;

    try {
      if (todosRes && todosRes.ok) {
        const tdata = await todosRes.json();
        if (tdata.todos) calendarTodos = tdata.todos;
      }
    } catch(e) {}

    const bgImage = document.getElementById("bg-image");
    if (bgImage) {
      if (bookmarkData._bgUrl && bookmarkData._bgUrl.trim() !== "") {
        bgImage.src = bookmarkData._bgUrl;
        bgImage.style.display = "block";
      } else {
        bgImage.style.display = "none";
      }
    }

    if (bookmarkData._clocks && bookmarkData._clocks.length > 0) {
      activeClocks = bookmarkData._clocks.map((c, i) => ({
        ...c,
        id: `clock-${i}`,
      }));
      renderClocksDOM();
      updateClocks();
    }

    const noteData = notesRes.ok
      ? await notesRes.json()
      : { notes: ["", "", ""] };
    const savedNotes = noteData.notes || ["", "", ""];

    // 기본 레이아웃 (Fallback) 및 동적 레이아웃 처리 함수
    const layout = bookmarkData._layout || { top: [], bottom: [] };
    const allCategories = Object.keys(bookmarkData).filter(
      (k) => !k.startsWith("_"),
    );

    let topCategories = layout.top || [];
    let bottomCategories = layout.bottom || [];

    // _layout 설정이 아예 비어있을 경우 (초기 진입 시 원본 상태 유지용)
    if (topCategories.length === 0 && bottomCategories.length === 0) {
      const defaultTop = [
        "일반",
        "회사",
        "자동차 자료 조사",
        "취미",
        "디자인",
        "AI",
      ];
      const defaultBottom = ["부트캠프"];
      topCategories = defaultTop.filter((c) => allCategories.includes(c));
      bottomCategories = defaultBottom.filter((c) => allCategories.includes(c));

      // 기존 폴더 외에 새로 생긴 이름이 있다면 top 영역으로 배치
      const remain = allCategories.filter(
        (c) => !topCategories.includes(c) && !bottomCategories.includes(c),
      );
      topCategories.push(...remain);
    }

    // 1. Render Top Section (3 Cols)
    let animIndex = 0;
    topCategories.forEach((category) => {
      const isVisible = !(
        bookmarkData._visibility && bookmarkData._visibility[category] === false
      );
      const items = bookmarkData[category];
      if (items && isVisible) {
        const folder = createFolderElement(category, items, animIndex);
        folder.style.animationDelay = `${animIndex * 50}ms`;
        topSection.appendChild(folder);
        animIndex++;
      }
    });

    // 2. Render Bottom Section (4 Cols)
    bottomCategories.forEach((category) => {
      const isVisible = !(
        bookmarkData._visibility && bookmarkData._visibility[category] === false
      );
      const items = bookmarkData[category];
      if (items && isVisible) {
        const folder = createFolderElement(category, items, animIndex);
        folder.classList.add("card-tall");
        folder.style.animationDelay = `${animIndex * 50}ms`;
        bottomSection.appendChild(folder);
        animIndex++;
      }
    });

    // 3. Render Notepads (Bottom Section)
    const notesToDisplay = savedNotes.slice(0, 2);
    while (notesToDisplay.length < 2) notesToDisplay.push("");

    notesToDisplay.forEach((noteContent, index) => {
      const notepad = createNotepadElement(index + 1, noteContent);
      notepad.classList.add("card-tall");
      notepad.style.animationDelay = `${animIndex * 50}ms`;
      bottomSection.appendChild(notepad);
      animIndex++;
    });

    // 4. Render Calendar Widget
    const calendar = createCalendarElement();
    calendar.style.animationDelay = `${animIndex * 50}ms`;
    bottomSection.appendChild(calendar);
    animIndex++;

    setupNotepads(savedNotes);

    setTimeout(() => {
      const cards = document.querySelectorAll(".card-common");
      cards.forEach((card) => card.classList.add("animate-rise"));
    }, 50);
  } catch (error) {
    console.error("Error loading dashboard:", error);
    gridContainer.innerHTML = `<div style="color:white; padding:20px;">Failed to load data.</div>`;
  }
}

function createFolderElement(category, items, index) {
  const folder = document.createElement("div");
  folder.className = "card-common folder";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = category;
  folder.appendChild(title);

  const list = document.createElement("div");
  list.className = "bookmark-list";
  list.classList.add("grid-dense");

  items.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_self";
    link.className = "bookmark-item";
    link.title = item.name;

    const iconContainer = document.createElement("div");
    iconContainer.className = "bookmark-icon";

    if (item.iconUrl && item.iconUrl.trim() !== "") {
      const img = document.createElement("img");
      img.src = item.iconUrl;
      img.onerror = () => setupGlassBox(iconContainer, item.name);
      iconContainer.appendChild(img);
    } else {
      setupGlassBox(iconContainer, item.name);
    }

    const name = document.createElement("span");
    name.className = "bookmark-name";
    name.textContent = item.name;

    link.appendChild(iconContainer);
    link.appendChild(name);
    list.appendChild(link);
  });

  folder.appendChild(list);
  return folder;
}

function createNotepadElement(id, content) {
  const notepad = document.createElement("div");
  notepad.className = "card-common notepad-card";
  notepad.id = `notepad-${id}`;

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = `Notepad ${id}`;
  notepad.appendChild(title);

  const list = document.createElement("div");
  list.className = "memo-list";

  for (let i = 0; i < 6; i++) {
    const line = document.createElement("div");
    line.className = "memo-item";
    line.contentEditable = true;
    line.dataset.placeholder = "Type here...";
    list.appendChild(line);
  }

  notepad.appendChild(list);
  return notepad;
}

function createCalendarElement() {
  const cal = document.createElement("div");
  cal.className = "card-common calendar-card card-tall";

  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();

  function renderCalendar(year, month) {
    cal.innerHTML = "";

    const title = document.createElement("div");
    title.className = "card-title";
    title.style.display = "flex";
    title.style.justifyContent = "space-between";
    title.style.alignItems = "baseline";

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const navDiv = document.createElement("div");
    navDiv.style.display = "flex";
    navDiv.style.alignItems = "center";
    navDiv.style.gap = "8px";
    navDiv.style.cursor = "pointer";
    navDiv.innerHTML = `
      <span class="cal-nav" id="cal-prev" style="opacity:0.6; padding: 0 4px;">&lt;</span>
      <span>${monthNames[month]}</span>
      <span class="cal-nav" id="cal-next" style="opacity:0.6; padding: 0 4px;">&gt;</span>
    `;

    navDiv.querySelector("#cal-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      let m = month - 1;
      let y = year;
      if (m < 0) { m = 11; y--; }
      renderCalendar(y, m);
    });

    navDiv.querySelector("#cal-next").addEventListener("click", (e) => {
      e.stopPropagation();
      let m = month + 1;
      let y = year;
      if (m > 11) { m = 0; y++; }
      renderCalendar(y, m);
    });

    title.appendChild(navDiv);

    const rightGroup = document.createElement("div");
    rightGroup.style.display = "flex";
    rightGroup.style.alignItems = "center";
    rightGroup.style.gap = "8px";

    if (year !== now.getFullYear() || month !== now.getMonth()) {
      const todayBtn = document.createElement("span");
      todayBtn.textContent = "Today";
      todayBtn.style.cssText = "font-size:0.7rem; opacity:0.6; cursor:pointer; padding:2px 8px; border:1px solid rgba(255,255,255,0.15); border-radius:4px;";
      todayBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        renderCalendar(now.getFullYear(), now.getMonth());
      });
      rightGroup.appendChild(todayBtn);
    }

    const yearSpan = document.createElement("span");
    yearSpan.style.fontSize = "0.8rem";
    yearSpan.style.fontWeight = "400";
    yearSpan.style.opacity = "0.6";
    yearSpan.textContent = year;
    rightGroup.appendChild(yearSpan);

    title.appendChild(rightGroup);

    cal.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    const days = ["S", "M", "T", "W", "T", "F", "S"];
    days.forEach(d => {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day-header";
      dayEl.textContent = d;
      grid.appendChild(dayEl);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
      const emptyEl = document.createElement("div");
      emptyEl.className = "calendar-cell empty";
      grid.appendChild(emptyEl);
    }

    const padZero = (n) => n < 10 ? '0' + n : n;

    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-cell";
      dayEl.textContent = i;
      
      if (year === now.getFullYear() && month === now.getMonth() && i === now.getDate()) {
        dayEl.classList.add("today");
      }

      const dateString = `${year}-${padZero(month + 1)}-${padZero(i)}`;
      
      if (calendarTodos[dateString]) {
         const hasTodoItems = calendarTodos[dateString].some(t => t.text.trim() !== "" || t.checked);
         if (hasTodoItems) {
             dayEl.classList.add("has-todo");
         }
      }

      dayEl.addEventListener("click", () => openTodosModal(year, month, i, dayEl, dateString));

      grid.appendChild(dayEl);
    }

    cal.appendChild(grid);
  }

  renderCalendar(currentYear, currentMonth);
  return cal;
}

// Global modal state
let currentTodoDateStr = "";
let currentTodoDayEl = null;

function openTodosModal(year, month, day, dayEl, dateString) {
  currentTodoDateStr = dateString;
  currentTodoDayEl = dayEl;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const title = document.getElementById("todos-date-title");
  title.textContent = `${monthNames[month]} ${day}, ${year} Tasks`;

  const body = document.getElementById("todos-body");
  body.innerHTML = "";
  
  const savedTodos = calendarTodos[dateString] || [];
  for (let i = 0; i < 5; i++) {
    const itemData = savedTodos[i] || { text: "", checked: false };
    
    const row = document.createElement("div");
    row.className = "todo-row";
    
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "todo-checkbox";
    chk.checked = itemData.checked;
    
    const input = document.createElement("input");
    input.type = "text";
    input.className = "todo-input";
    input.placeholder = "New task...";
    input.value = itemData.text;
    if (chk.checked) input.disabled = true;

    chk.addEventListener("change", () => {
       input.disabled = chk.checked;
    });

    row.appendChild(chk);
    row.appendChild(input);
    body.appendChild(row);
  }

  document.getElementById("todos-overlay").classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    // Todo Modal Actions
    const closeTodos = () => document.getElementById("todos-overlay").classList.add("hidden");
    const todosCloseBtn = document.getElementById("todos-close");
    const todosCancelBtn = document.getElementById("todos-cancel");
    if(todosCloseBtn) todosCloseBtn.addEventListener("click", closeTodos);
    if(todosCancelBtn) todosCancelBtn.addEventListener("click", closeTodos);

    // Close todos modal on backdrop click
    const todosOverlay = document.getElementById("todos-overlay");
    if(todosOverlay) todosOverlay.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeTodos();
    });

    const todosSaveBtn = document.getElementById("todos-save");
    if(todosSaveBtn) {
        todosSaveBtn.addEventListener("click", async () => {
            const body = document.getElementById("todos-body");
            const rows = body.querySelectorAll(".todo-row");
            const newTodos = [];
            let hasAnyText = false;

            rows.forEach(r => {
               const chk = r.querySelector(".todo-checkbox").checked;
               const txt = r.querySelector(".todo-input").value;
               if (txt.trim() !== "" || chk) hasAnyText = true;
               newTodos.push({ text: txt, checked: chk });
            });

            if (hasAnyText) {
                calendarTodos[currentTodoDateStr] = newTodos;
            } else {
                delete calendarTodos[currentTodoDateStr];
            }

            try {
                await fetch("/api/todos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ todos: calendarTodos })
                });
                
                if (hasAnyText && currentTodoDayEl) {
                    currentTodoDayEl.classList.add("has-todo");
                } else if (currentTodoDayEl) {
                    currentTodoDayEl.classList.remove("has-todo");
                }
            } catch(e) { 
                console.error("Failed to save todos", e); 
            }
            
            closeTodos();
        });
    }

    // ESC key closes any open modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const settingsOverlay = document.getElementById("settings-overlay");
            const todosOverlay = document.getElementById("todos-overlay");
            if (todosOverlay && !todosOverlay.classList.contains("hidden")) {
                closeTodos();
            } else if (settingsOverlay && !settingsOverlay.classList.contains("hidden")) {
                closeSettings();
            }
        }
    });
});

function setupGlassBox(container, name) {
  container.style.background = "rgba(255, 255, 255, 0.1)";
  container.style.backdropFilter = "blur(4px)";
  container.innerHTML = `<span style="font-weight: 600; font-size: 1.2rem; opacity: 0.8; color: white;">${name.charAt(0)}</span>`;
}

function setupNotepads(notes) {
  const memos = document.querySelectorAll(".memo-item");
  notes = notes || [];

  memos.forEach((memo, index) => {
    if (notes[index]) {
      memo.textContent = notes[index];
      resizeMemoFont(memo);
    }
  });

  let timeout;
  const saveNotes = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const allNotes = Array.from(memos).map((m) => m.textContent);
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: allNotes }),
      }).catch((e) => console.error("Save failed", e));
    }, 800);
  };

  memos.forEach((memo) => {
    memo.addEventListener("input", () => {
      resizeMemoFont(memo);
      saveNotes();
    });
    memo.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  });
}

function resizeMemoFont(memo) {
  const minFontSize = 11;
  const maxFontSize = 13;
  let currentFontSize = maxFontSize;
  memo.style.fontSize = `${currentFontSize}px`;
  memo.style.whiteSpace = "nowrap";
  while (memo.scrollWidth > memo.clientWidth && currentFontSize > minFontSize) {
    currentFontSize -= 0.5;
    memo.style.fontSize = `${currentFontSize}px`;
  }
  if (memo.scrollWidth > memo.clientWidth) {
    memo.style.whiteSpace = "normal";
    memo.style.wordBreak = "break-word";
  } else {
    memo.style.whiteSpace = "nowrap";
  }
}

/* ============================================ */
/* Settings Modal Logic                         */
/* ============================================ */
function initSettings() {
  document
    .getElementById("settings-btn")
    .addEventListener("click", openSettings);
  document
    .getElementById("settings-close")
    .addEventListener("click", closeSettings);
  document
    .getElementById("settings-cancel")
    .addEventListener("click", closeSettings);
  document
    .getElementById("settings-save")
    .addEventListener("click", saveSettings);
  document.getElementById("settings-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeSettings();
  });
}

function openSettings() {
  if (!currentBookmarkData) return;
  renderSettingsForm(JSON.parse(JSON.stringify(currentBookmarkData)));
  document.getElementById("settings-overlay").classList.remove("hidden");
}

function closeSettings() {
  document.getElementById("settings-overlay").classList.add("hidden");
}

function renderSettingsForm(data) {
  const body = document.getElementById("settings-body");
  body.innerHTML = "";

  let layout = data._layout || { top: [], bottom: [] };
  const allCategories = Object.keys(data).filter((k) => !k.startsWith("_"));

  if (
    (!layout.top || layout.top.length === 0) &&
    (!layout.bottom || layout.bottom.length === 0)
  ) {
    const defaultTop = [
      "일반",
      "회사",
      "자동차 자료 조사",
      "취미",
      "디자인",
      "AI",
    ];
    const defaultBottom = ["부트캠프"];
    layout = {
      top: defaultTop.filter((c) => allCategories.includes(c)),
      bottom: defaultBottom.filter((c) => allCategories.includes(c)),
    };
    const remain = allCategories.filter(
      (c) => !layout.top.includes(c) && !layout.bottom.includes(c),
    );
    layout.top.push(...remain);
  }

  const visibilityInfo = data._visibility || {};

  body.appendChild(createGlobalSettingsBlock(data._bgUrl));

  const clocks = data._clocks || [
    { name: "SEOUL", zone: "Asia/Seoul" },
    { name: "DETROIT", zone: "America/Detroit" },
    { name: "BERLIN", zone: "Europe/Berlin" },
    { name: "CHENNAI", zone: "Asia/Kolkata" },
  ];
  body.appendChild(createClockSettingsBlock(clocks));

  const topCats = layout.top || [];
  topCats.forEach((cat) => {
    const items = data[cat] || [];
    const isVisible = visibilityInfo[cat] !== false;
    const catBlock = createCategoryBlock(cat, items, "top", isVisible, 8);
    body.appendChild(catBlock);
  });

  const bottomCats = layout.bottom || [];
  bottomCats.forEach((cat) => {
    const items = data[cat] || [];
    const isVisible = visibilityInfo[cat] !== false;
    const catBlock = createCategoryBlock(cat, items, "bottom", isVisible, 15);
    body.appendChild(catBlock);
  });
}

function createCategoryBlock(
  categoryName,
  items,
  section,
  isVisible,
  maxLimit,
) {
  const block = document.createElement("div");
  block.className = "settings-category-block";
  block.dataset.section = section;
  block.dataset.maxLimit = maxLimit;

  if (!isVisible) {
    block.style.opacity = "0.5";
  }

  // Header: category name + visibility toggle
  const header = document.createElement("div");
  header.className = "settings-category-header";
  header.style.gap = "8px";

  const maxLabel = document.createElement("span");
  maxLabel.style.color = "var(--text-muted)";
  maxLabel.style.fontSize = "12px";
  maxLabel.style.fontWeight = "bold";
  maxLabel.textContent = `(Max: ${maxLimit})`;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "settings-input settings-cat-name";
  nameInput.placeholder = "Category Name";
  nameInput.value = categoryName;
  nameInput.style.flex = "1";

  const eyeOpenSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const eyeClosedSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  // Visibility Toggle (Eye icon)
  const viewBtn = document.createElement("button");
  viewBtn.className = "settings-delete-btn visibility-btn";
  viewBtn.dataset.visible = isVisible ? "true" : "false";
  viewBtn.innerHTML = isVisible ? eyeOpenSVG : eyeClosedSVG;
  viewBtn.title = isVisible
    ? "보임 (클릭하여 숨기기)"
    : "숨김 (클릭하여 보이기)";
  viewBtn.style.background = isVisible
    ? "rgba(100, 200, 100, 0.15)"
    : "rgba(200, 100, 100, 0.15)";
  viewBtn.style.color = isVisible
    ? "rgba(150, 255, 150, 0.9)"
    : "rgba(255, 150, 150, 0.9)";
  viewBtn.style.border = isVisible
    ? "1px solid rgba(100, 200, 100, 0.2)"
    : "1px solid rgba(200, 100, 100, 0.2)";

  viewBtn.addEventListener("click", () => {
    const currentlyVisible = viewBtn.dataset.visible === "true";
    const nowVisible = !currentlyVisible;
    viewBtn.dataset.visible = nowVisible ? "true" : "false";
    viewBtn.innerHTML = nowVisible ? eyeOpenSVG : eyeClosedSVG;
    viewBtn.title = nowVisible
      ? "보임 (클릭하여 숨기기)"
      : "숨김 (클릭하여 보이기)";
    viewBtn.style.background = nowVisible
      ? "rgba(100, 200, 100, 0.15)"
      : "rgba(200, 100, 100, 0.15)";
    viewBtn.style.color = nowVisible
      ? "rgba(150, 255, 150, 0.9)"
      : "rgba(255, 150, 150, 0.9)";
    viewBtn.style.border = nowVisible
      ? "1px solid rgba(100, 200, 100, 0.2)"
      : "1px solid rgba(200, 100, 100, 0.2)";
    block.style.opacity = nowVisible ? "1" : "0.5";
  });

  header.appendChild(nameInput);
  header.appendChild(maxLabel);
  header.appendChild(viewBtn);
  block.appendChild(header);

  // Bookmark list
  const bookmarkList = document.createElement("div");
  bookmarkList.className = "settings-bookmark-list";

  items.forEach((item) => {
    bookmarkList.appendChild(createBookmarkRow(item.name, item.url, item.iconUrl || ""));
  });

  block.appendChild(bookmarkList);

  // Add bookmark button
  const addBmBtn = document.createElement("button");
  addBmBtn.className = "settings-add-bookmark-btn";
  addBmBtn.textContent = "+ Add Bookmark";
  addBmBtn.addEventListener("click", () => {
    const currentCnt = bookmarkList.querySelectorAll(
      ".settings-bookmark-row",
    ).length;
    if (currentCnt >= maxLimit) {
      alert(`이 카테고리는 최대 ${maxLimit}개 까지만 등록 가능합니다.`);
      return;
    }
    const row = createBookmarkRow("", "", "");
    bookmarkList.appendChild(row);
    row.querySelector(".settings-bm-name").focus();
  });
  block.appendChild(addBmBtn);

  return block;
}

function createClockSettingsBlock(clocks) {
  const maxLimit = 8;
  const block = document.createElement("div");
  block.className = "settings-category-block clock-settings-block";

  const header = document.createElement("div");
  header.className = "settings-category-header";
  header.innerHTML = `<span class="settings-cat-name-fixed tooltip" style="flex:1; font-weight:600; color:var(--text-primary);">🕒 World Clocks (Max: ${maxLimit})</span>`;
  block.appendChild(header);

  const clockList = document.createElement("div");
  clockList.className = "settings-bookmark-list";
  clocks.forEach((c) => clockList.appendChild(createClockRow(c.name, c.zone)));
  block.appendChild(clockList);

  const addBtn = document.createElement("button");
  addBtn.className = "settings-add-bookmark-btn";
  addBtn.textContent = "+ Add Clock";
  addBtn.addEventListener("click", () => {
    if (
      clockList.querySelectorAll(".settings-bookmark-row").length >= maxLimit
    ) {
      alert(`세계 시간은 최대 ${maxLimit}개까지만 등록 가능합니다.`);
      return;
    }
    clockList.appendChild(createClockRow("", ""));
    clockList.lastChild.querySelector(".settings-clock-name").focus();
  });
  block.appendChild(addBtn);
  return block;
}

function createClockRow(name, zone) {
  const row = document.createElement("div");
  row.className = "settings-bookmark-row";

  // 주요 타임존 및 자동완성 키워드 매핑 테이블
  const tzOptions = [
    // Asia
    {
      label: "Seoul (Asia/Seoul)",
      value: "Asia/Seoul",
      keywords: ["seoul", "서울", "kr", "한국", "대한민국"],
    },
    {
      label: "Tokyo (Asia/Tokyo)",
      value: "Asia/Tokyo",
      keywords: ["tokyo", "도쿄", "동경", "jp", "일본"],
    },
    {
      label: "Beijing (Asia/Shanghai)",
      value: "Asia/Shanghai",
      keywords: ["beijing", "베이징", "shanghai", "상하이", "cn", "중국"],
    },
    {
      label: "Hong Kong (Asia/Hong_Kong)",
      value: "Asia/Hong_Kong",
      keywords: ["hong kong", "홍콩", "hk"],
    },
    {
      label: "Taipei (Asia/Taipei)",
      value: "Asia/Taipei",
      keywords: ["taipei", "타이베이", "대만", "taiwan", "tw"],
    },
    {
      label: "Bangkok (Asia/Bangkok)",
      value: "Asia/Bangkok",
      keywords: ["bangkok", "방콕", "th", "태국"],
    },
    {
      label: "Singapore (Asia/Singapore)",
      value: "Asia/Singapore",
      keywords: ["singapore", "싱가폴", "싱가포르", "sg"],
    },
    {
      label: "Kuala Lumpur (Asia/Kuala_Lumpur)",
      value: "Asia/Kuala_Lumpur",
      keywords: ["kuala lumpur", "쿠알라룸푸르", "말레이시아", "my"],
    },
    {
      label: "Jakarta (Asia/Jakarta)",
      value: "Asia/Jakarta",
      keywords: ["jakarta", "자카르타", "인도네시아", "id"],
    },
    {
      label: "Manila (Asia/Manila)",
      value: "Asia/Manila",
      keywords: ["manila", "마닐라", "필리핀", "ph"],
    },
    {
      label: "Ho Chi Minh (Asia/Ho_Chi_Minh)",
      value: "Asia/Ho_Chi_Minh",
      keywords: ["ho chi minh", "호치민", "베트남", "vn", "hanoi", "하노이"],
    },
    {
      label: "New Delhi (Asia/Kolkata)",
      value: "Asia/Kolkata",
      keywords: [
        "chennai",
        "new delhi",
        "delhi",
        "첸나이",
        "뉴델리",
        "인도",
        "in",
        "mumbai",
        "뭄바이",
      ],
    },
    {
      label: "Dubai (Asia/Dubai)",
      value: "Asia/Dubai",
      keywords: [
        "dubai",
        "두바이",
        "ae",
        "아랍에미리트",
        "uae",
        "abudhabi",
        "아부다비",
      ],
    },
    {
      label: "Riyadh (Asia/Riyadh)",
      value: "Asia/Riyadh",
      keywords: ["riyadh", "리야드", "사우디", "sa"],
    },
    {
      label: "Tehran (Asia/Tehran)",
      value: "Asia/Tehran",
      keywords: ["tehran", "테헤란", "이란", "ir"],
    },
    {
      label: "Istanbul (Europe/Istanbul)",
      value: "Europe/Istanbul",
      keywords: ["istanbul", "이스탄불", "터키", "튀르키예", "tr"],
    },
    {
      label: "Jerusalem (Asia/Jerusalem)",
      value: "Asia/Jerusalem",
      keywords: ["jerusalem", "예루살렘", "이스라엘", "il"],
    },

    // Europe
    {
      label: "London (Europe/London)",
      value: "Europe/London",
      keywords: ["london", "런던", "uk", "gb", "영국"],
    },
    {
      label: "Paris/Berlin (Europe/Berlin)",
      value: "Europe/Berlin",
      keywords: [
        "paris",
        "berlin",
        "파리",
        "베를린",
        "독일",
        "프랑스",
        "de",
        "fr",
        "amsterdam",
        "암스테르담",
        "네덜란드",
        "nl",
      ],
    },
    {
      label: "Rome (Europe/Rome)",
      value: "Europe/Rome",
      keywords: ["rome", "로마", "이탈리아", "italy", "it"],
    },
    {
      label: "Madrid (Europe/Madrid)",
      value: "Europe/Madrid",
      keywords: ["madrid", "마드리드", "스페인", "spain", "es"],
    },
    {
      label: "Zurich (Europe/Zurich)",
      value: "Europe/Zurich",
      keywords: ["zurich", "취리히", "스위스", "swiss", "ch"],
    },
    {
      label: "Vienna (Europe/Vienna)",
      value: "Europe/Vienna",
      keywords: ["vienna", "비엔나", "빈", "오스트리아", "at"],
    },
    {
      label: "Stockholm (Europe/Stockholm)",
      value: "Europe/Stockholm",
      keywords: ["stockholm", "스톡홀름", "스웨덴", "se"],
    },
    {
      label: "Oslo (Europe/Oslo)",
      value: "Europe/Oslo",
      keywords: ["oslo", "오슬로", "노르웨이", "no"],
    },
    {
      label: "Copenhagen (Europe/Copenhagen)",
      value: "Europe/Copenhagen",
      keywords: ["copenhagen", "코펜하겐", "덴마크", "dk"],
    },
    {
      label: "Helsinki (Europe/Helsinki)",
      value: "Europe/Helsinki",
      keywords: ["helsinki", "헬싱키", "핀란드", "fi"],
    },
    {
      label: "Athens (Europe/Athens)",
      value: "Europe/Athens",
      keywords: ["athens", "아테네", "그리스", "gr"],
    },
    {
      label: "Moscow (Europe/Moscow)",
      value: "Europe/Moscow",
      keywords: ["moscow", "모스크바", "ru", "러시아"],
    },
    {
      label: "Kyiv (Europe/Kyiv)",
      value: "Europe/Kyiv",
      keywords: ["kyiv", "키이우", "우크라이나", "ua"],
    },

    // Americas
    {
      label: "New York (America/New_York)",
      value: "America/New_York",
      keywords: [
        "new york",
        "뉴욕",
        "ny",
        "us",
        "미국",
        "washington",
        "워싱턴",
        "est",
      ],
    },
    {
      label: "Detroit (America/Detroit)",
      value: "America/Detroit",
      keywords: ["detroit", "디트로이트"],
    },
    {
      label: "Chicago (America/Chicago)",
      value: "America/Chicago",
      keywords: ["chicago", "시카고", "dallas", "달라스", "텍사스", "cst"],
    },
    {
      label: "Denver (America/Denver)",
      value: "America/Denver",
      keywords: ["denver", "덴버", "mst"],
    },
    {
      label: "Los Angeles (America/Los_Angeles)",
      value: "America/Los_Angeles",
      keywords: [
        "los angeles",
        "la",
        "로스앤젤레스",
        "엘에이",
        "san francisco",
        "샌프란시스코",
        "seattle",
        "시애틀",
        "pst",
      ],
    },
    {
      label: "Toronto (America/Toronto)",
      value: "America/Toronto",
      keywords: [
        "toronto",
        "토론토",
        "캐나다",
        "canada",
        "ca",
        "montreal",
        "몬트리올",
      ],
    },
    {
      label: "Vancouver (America/Vancouver)",
      value: "America/Vancouver",
      keywords: ["vancouver", "밴쿠버"],
    },
    {
      label: "Mexico City (America/Mexico_City)",
      value: "America/Mexico_City",
      keywords: ["mexico city", "멕시코시티", "멕시코", "mx"],
    },
    {
      label: "Sao Paulo (America/Sao_Paulo)",
      value: "America/Sao_Paulo",
      keywords: ["sao paulo", "상파울루", "brazil", "br", "브라질", "rio"],
    },
    {
      label: "Buenos Aires (America/Argentina/Buenos_Aires)",
      value: "America/Argentina/Buenos_Aires",
      keywords: ["buenos aires", "부에노스아이레스", "아르헨티나", "ar"],
    },
    {
      label: "Santiago (America/Santiago)",
      value: "America/Santiago",
      keywords: ["santiago", "산티아고", "칠레", "cl"],
    },
    {
      label: "Bogota (America/Bogota)",
      value: "America/Bogota",
      keywords: ["bogota", "보고타", "콜롬비아", "co"],
    },
    {
      label: "Lima (America/Lima)",
      value: "America/Lima",
      keywords: ["lima", "리마", "페루", "pe"],
    },

    // Oceania
    {
      label: "Sydney (Australia/Sydney)",
      value: "Australia/Sydney",
      keywords: [
        "sydney",
        "시드니",
        "호주",
        "au",
        "melbourne",
        "멜버른",
        "캔버라",
      ],
    },
    {
      label: "Brisbane (Australia/Brisbane)",
      value: "Australia/Brisbane",
      keywords: ["brisbane", "브리즈번"],
    },
    {
      label: "Adelaide (Australia/Adelaide)",
      value: "Australia/Adelaide",
      keywords: ["adelaide", "애들레이드"],
    },
    {
      label: "Perth (Australia/Perth)",
      value: "Australia/Perth",
      keywords: ["perth", "퍼스"],
    },
    {
      label: "Auckland (Pacific/Auckland)",
      value: "Pacific/Auckland",
      keywords: [
        "auckland",
        "오클랜드",
        "nz",
        "뉴질랜드",
        "wellington",
        "웰링턴",
      ],
    },
    {
      label: "Honolulu (Pacific/Honolulu)",
      value: "Pacific/Honolulu",
      keywords: ["honolulu", "호놀룰루", "하와이", "hawaii"],
    },

    // Africa
    {
      label: "Cairo (Africa/Cairo)",
      value: "Africa/Cairo",
      keywords: ["cairo", "카이로", "이집트", "eg"],
    },
    {
      label: "Johannesburg (Africa/Johannesburg)",
      value: "Africa/Johannesburg",
      keywords: [
        "johannesburg",
        "요하네스버그",
        "남아공",
        "za",
        "cape town",
        "케이프타운",
      ],
    },
    {
      label: "Nairobi (Africa/Nairobi)",
      value: "Africa/Nairobi",
      keywords: ["nairobi", "나이로비", "케냐", "ke"],
    },
    {
      label: "Lagos (Africa/Lagos)",
      value: "Africa/Lagos",
      keywords: ["lagos", "라고스", "나이지리아", "ng"],
    },
    {
      label: "Casablanca (Africa/Casablanca)",
      value: "Africa/Casablanca",
      keywords: ["casablanca", "카사블랑카", "모로코", "ma"],
    },

    {
      label: "UTC",
      value: "UTC",
      keywords: ["utc", "gmt", "협정세계시", "그리니치"],
    },
  ];

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "settings-input settings-clock-name";
  nameInput.placeholder = "City (e.g. SEOUL)";
  nameInput.value = name;

  const zoneSelect = document.createElement("select");
  zoneSelect.className = "settings-select settings-clock-zone";
  zoneSelect.title =
    "타임존을 직접 선택하거나 도시 이름을 입력하면 자동 선택됩니다.";

  let found = false;
  tzOptions.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === zone) {
      option.selected = true;
      found = true;
    }
    zoneSelect.appendChild(option);
  });

  // 기존 데이터에 매핑되지 않은 타임존이 있다면 그대로 옵션으로 추가
  if (zone && !found) {
    const option = document.createElement("option");
    option.value = zone;
    option.textContent = zone;
    option.selected = true;
    zoneSelect.appendChild(option);
  }

  if (!zone) zoneSelect.value = "Asia/Seoul";

  // 도시 이름(City) 텍스트 입력 시 타임존(Timezone) 자동 매칭 로직
  nameInput.addEventListener("input", () => {
    const query = nameInput.value.trim().toLowerCase();
    if (!query) return;
    const matched = tzOptions.find((opt) =>
      opt.keywords.some((kw) => query.includes(kw) || kw.startsWith(query)),
    );
    if (matched) zoneSelect.value = matched.value;
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "settings-delete-btn";
  deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  deleteBtn.addEventListener("click", () => row.remove());

  row.appendChild(nameInput);
  row.appendChild(zoneSelect);
  row.appendChild(deleteBtn);
  return row;
}

function createGlobalSettingsBlock(bgUrl) {
  const block = document.createElement("div");
  block.className = "settings-category-block global-settings-block";

  const header = document.createElement("div");
  header.className = "settings-category-header";
  header.innerHTML = `<span class="settings-cat-name-fixed tooltip" style="flex:1; font-weight:600; color:var(--text-primary);">🖼️ Page Background</span>`;
  block.appendChild(header);

  const input = document.createElement("input");
  input.type = "text";
  input.className = "settings-input settings-bg-url";
  input.placeholder = "Background Image URL (Leave empty for default)";
  input.value = bgUrl || "";
  input.style.width = "100%";

  block.appendChild(input);
  return block;
}

function createBookmarkRow(name, url, iconUrl = "") {
  const row = document.createElement("div");
  row.className = "settings-bookmark-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "settings-input settings-bm-name";
  nameInput.placeholder = "Name";
  nameInput.value = name;
  nameInput.style.flex = "1";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "settings-input settings-bm-url";
  urlInput.placeholder = "URL";
  urlInput.value = url;
  urlInput.style.flex = "2";

  const iconInput = document.createElement("input");
  iconInput.type = "text";
  iconInput.className = "settings-input settings-bm-icon";
  iconInput.placeholder = "Icon URL (Opt)";
  iconInput.value = iconUrl;
  iconInput.style.flex = "1";

  // Auto-fill favicon when URL is entered and icon field is empty
  urlInput.addEventListener("blur", () => {
    const enteredUrl = urlInput.value.trim();
    if (enteredUrl && !iconInput.value.trim()) {
      try {
        const domain = new URL(
          enteredUrl.startsWith("http") ? enteredUrl : "https://" + enteredUrl
        ).hostname;
        iconInput.value = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
      } catch (e) {
        // Invalid URL, skip auto-fill
      }
    }
  });

  const moveUpBtn = document.createElement("button");
  moveUpBtn.className = "settings-action-btn";
  moveUpBtn.title = "Move Up";
  moveUpBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
  moveUpBtn.addEventListener("click", () => {
    if (row.previousElementSibling) {
      row.parentNode.insertBefore(row, row.previousElementSibling);
    }
  });

  const moveDownBtn = document.createElement("button");
  moveDownBtn.className = "settings-action-btn";
  moveDownBtn.title = "Move Down";
  moveDownBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  moveDownBtn.addEventListener("click", () => {
    if (row.nextElementSibling) {
      row.parentNode.insertBefore(row.nextElementSibling, row);
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "settings-delete-btn";
  deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  deleteBtn.addEventListener("click", () => row.remove());

  row.appendChild(nameInput);
  row.appendChild(urlInput);
  row.appendChild(iconInput);
  row.appendChild(moveUpBtn);
  row.appendChild(moveDownBtn);
  row.appendChild(deleteBtn);

  return row;
}

async function saveSettings() {
  const body = document.getElementById("settings-body");
  const blocks = body.querySelectorAll(".settings-category-block");

  const newData = {
    _layout: { top: [], bottom: [] },
    _visibility: {},
    _clocks: [],
  };

  const clockBlock = body.querySelector(".clock-settings-block");
  if (clockBlock) {
    clockBlock.querySelectorAll(".settings-bookmark-row").forEach((row) => {
      const name = row.querySelector(".settings-clock-name").value.trim();
      const zone = row.querySelector(".settings-clock-zone").value.trim();
      if (name && zone) newData._clocks.push({ name, zone });
    });
    newData._clocks = newData._clocks.slice(0, 8);
  }

  const globalBlock = body.querySelector(".global-settings-block");
  if (globalBlock) {
    const bgUrlInput = globalBlock.querySelector(".settings-bg-url");
    if (bgUrlInput && bgUrlInput.value.trim() !== "") {
      newData._bgUrl = bgUrlInput.value.trim();
    }
  }

  blocks.forEach((block) => {
    if (block.classList.contains("clock-settings-block") || block.classList.contains("global-settings-block")) return;

    const catName = block.querySelector(".settings-cat-name").value.trim();
    const isVisible =
      block.querySelector(".visibility-btn").dataset.visible === "true";
    if (!catName) return;

    const section = block.dataset.section;
    const maxLimit = parseInt(block.dataset.maxLimit, 10);

    const bookmarks = [];

    block.querySelectorAll(".settings-bookmark-row").forEach((row) => {
      const bmName = row.querySelector(".settings-bm-name").value.trim();
      const bmUrl = row.querySelector(".settings-bm-url").value.trim();
      const bmIcon = row.querySelector(".settings-bm-icon");
      const iconUrl = bmIcon ? bmIcon.value.trim() : "";
      
      if (bmName && bmUrl) {
        bookmarks.push({ name: bmName, url: bmUrl, iconUrl: iconUrl });
      }
    });

    const limitedBookmarks = bookmarks.slice(0, maxLimit);

    newData[catName] = limitedBookmarks;
    newData._layout[section].push(catName);
    newData._visibility[catName] = isVisible;
  });

  try {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });

    if (res.ok) {
      closeSettings();
      initDashboard();
    } else {
      alert("Failed to save bookmarks.");
    }
  } catch (e) {
    console.error("Save error:", e);
    alert("Failed to save bookmarks.");
  }
}
