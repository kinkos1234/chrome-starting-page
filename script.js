// script.js - Premium Crystal Office v1.3 (Split Grid: 3-Col Top / 4-Col Bottom)

const forcedGlassBoxes = ["타용도", "Global Auto News", "ELO Board"];

// Custom Icon Mappings
const customIcons = {
    "Comad.J Blog": "assets/comad_j_blog_icon.png",
    "구글 애널리틱스": "assets/google_analytics_icon.png",
    "ChatGPT": "assets/chatgpt_icon.png",
    "LibreChat": "assets/librechat_icon.png",
    "Saworl": "assets/saworl_icon.png",
    "NotebookLM": "assets/notebooklm_icon.png",
    "EXP": "https://www.google.com/s2/favicons?sz=64&domain=k-digital.goorm.io",
    "Notion_Facilitator": "https://www.google.com/s2/favicons?sz=64&domain=www.notion.so"
};

let currentEngine = 'google';

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initSearch();
    initDashboard();
});

/* --- Clock Logic --- */
function initClock() {
    updateClocks();
    setInterval(updateClocks, 1000);
}

function updateClocks() {
    const zones = {
        'time-kr': 'Asia/Seoul',
        'time-us': 'America/Detroit',
        'time-de': 'Europe/Berlin',
        'time-in': 'Asia/Kolkata'
    };

    for (const [id, zone] of Object.entries(zones)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: zone });
        }
    }
}

/* --- Search Logic --- */
function initSearch() {
    const toggleBtn = document.getElementById('search-toggle');
    const searchIcon = document.getElementById('search-icon');
    const searchInput = document.getElementById('search-input');

    toggleBtn.addEventListener('click', () => {
        if (currentEngine === 'google') {
            currentEngine = 'naver';
            searchIcon.src = 'https://www.naver.com/favicon.ico';
            searchInput.placeholder = 'Naver Search...';
        } else {
            currentEngine = 'google';
            searchIcon.src = 'https://www.google.com/favicon.ico';
            searchInput.placeholder = 'Google Search...';
        }
        searchInput.focus();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                let url = currentEngine === 'google'
                    ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
                    : `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
                window.location.href = url;
            }
        }
    });
}

/* --- Dashboard Logic --- */
async function initDashboard() {
    const gridContainer = document.getElementById('masonry-grid');
    gridContainer.innerHTML = '';

    // Create Sections
    const topSection = document.createElement('div');
    topSection.className = 'grid-section-top';
    gridContainer.appendChild(topSection);

    const bottomSection = document.createElement('div');
    bottomSection.className = 'grid-section-bottom';
    gridContainer.appendChild(bottomSection);

    try {
        const [bookmarksRes, notesRes] = await Promise.all([
            fetch('/api/bookmarks'),
            fetch('/api/notes')
        ]);

        if (!bookmarksRes.ok) throw new Error('Failed to fetch bookmarks');

        const bookmarkData = await bookmarksRes.json();
        const noteData = notesRes.ok ? await notesRes.json() : { notes: ["", "", ""] };
        const savedNotes = noteData.notes || ["", "", ""];

        // Defined Order Lists
        const orderedTop = ["일반", "회사", "자동차 자료 조사", "취미", "디자인", "AI"];
        const orderedBottom = ["부트캠프"]; // And then Notes

        // 1. Render Top Section (3 Cols)
        orderedTop.forEach((category, i) => {
            const items = bookmarkData[category];
            if (items) {
                const folder = createFolderElement(category, items, i);
                folder.style.animationDelay = `${i * 50}ms`;
                topSection.appendChild(folder);
            }
        });

        // 2. Render Bottom Section (4 Cols, Tall)
        orderedBottom.forEach((category, i) => {
            const items = bookmarkData[category];
            if (items) {
                const folder = createFolderElement(category, items, i);
                folder.classList.add('card-tall'); // Double Height
                folder.style.animationDelay = `${(orderedTop.length + i) * 50}ms`;
                bottomSection.appendChild(folder);
            }
        });

        // 3. Render Notepads (Strictly 3 -> Bottom Section)
        const notesToDisplay = savedNotes.slice(0, 3);
        while (notesToDisplay.length < 3) notesToDisplay.push("");

        notesToDisplay.forEach((noteContent, index) => {
            const notepad = createNotepadElement(index + 1, noteContent);
            notepad.classList.add('card-tall'); // Double Height
            notepad.style.animationDelay = `${(orderedTop.length + orderedBottom.length + index) * 50}ms`;
            bottomSection.appendChild(notepad);
        });

        setupNotepads();

        setTimeout(() => {
            const cards = document.querySelectorAll('.card-common');
            cards.forEach(card => card.classList.add('animate-rise'));
        }, 50);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        gridContainer.innerHTML = `<div style="color:white; padding:20px;">Failed to load data.</div>`;
    }
}

function createFolderElement(category, items, index) {
    const folder = document.createElement('div');
    folder.className = 'card-common folder';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = category;
    folder.appendChild(title);

    const list = document.createElement('div');
    list.className = 'bookmark-list';

    // Unified Layout Logic
    list.classList.add('grid-dense');

    // Remove Overrides for Bootcamp/Company in Terms of Grid Size if Uniformity is desired for buttons
    // But keeps buttons uniform size (64px)

    items.forEach(item => {
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_self';
        link.className = 'bookmark-item';
        link.title = item.name;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'bookmark-icon';

        const isForcedGlass = forcedGlassBoxes.includes(item.name);
        const customIconPath = customIcons[item.name];

        if (customIconPath) {
            const img = document.createElement('img');
            img.src = customIconPath;
            img.onerror = () => setupGlassBox(iconContainer, item.name);
            iconContainer.appendChild(img);
        } else if (isForcedGlass) {
            setupGlassBox(iconContainer, item.name);
        } else {
            const img = document.createElement('img');
            try {
                const domain = new URL(item.url).hostname;
                img.src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
                img.onerror = () => setupGlassBox(iconContainer, item.name);
                iconContainer.appendChild(img);
            } catch (e) {
                setupGlassBox(iconContainer, item.name);
            }
        }

        const name = document.createElement('span');
        name.className = 'bookmark-name';
        name.textContent = item.name;

        link.appendChild(iconContainer);
        link.appendChild(name);
        list.appendChild(link);
    });

    folder.appendChild(list);
    return folder;
}

function createNotepadElement(id, content) {
    const notepad = document.createElement('div');
    notepad.className = 'card-common notepad-card';
    notepad.id = `notepad-${id}`;

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = `Notepad ${id}`;
    notepad.appendChild(title);

    const list = document.createElement('div');
    list.className = 'memo-list';

    // Because it's a Tall card, we can show more lines!
    // Adjusted to 6 lines (180px height)
    for (let i = 0; i < 6; i++) {
        const line = document.createElement('div');
        line.className = 'memo-item';
        line.contentEditable = true;
        line.dataset.placeholder = "Type here...";
        list.appendChild(line);
    }

    notepad.appendChild(list);
    return notepad;
}

function setupGlassBox(container, name) {
    container.style.background = 'rgba(255, 255, 255, 0.1)';
    container.style.backdropFilter = 'blur(4px)';
    container.innerHTML = `<span style="font-weight: 600; font-size: 1.2rem; opacity: 0.8; color: white;">${name.charAt(0)}</span>`;
}

async function setupNotepads() {
    const memos = document.querySelectorAll('.memo-item');
    try {
        const res = await fetch('/api/notes');
        if (res.ok) {
            const data = await res.json();
            const notes = data.notes || [];

            // Note logic update: if we have more lines (rows) visually but same data structure (array of strings)
            // Ideally we map each "notepad" to a chunk of text.
            // But current persistence is simple array of lines? 
            // Previous logic: savedNotes = ["line1", "line2"...] flattened?
            // Actually previous logic seemed to map all .memo-item globally to an array index.
            // If we increase lines, we just use more array slots. 
            // Persistence should handle it automatically if it just saves explicit array indices.

            memos.forEach((memo, index) => {
                if (notes[index]) {
                    memo.textContent = notes[index];
                    resizeMemoFont(memo);
                }
            });
        }
    } catch (e) {
        console.error("Failed to load notes", e);
    }

    let timeout;
    const saveNotes = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const allNotes = Array.from(memos).map(m => m.textContent);
            fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: allNotes })
            }).catch(e => console.error("Save failed", e));
        }, 800);
    };

    memos.forEach(memo => {
        memo.addEventListener('input', () => {
            resizeMemoFont(memo);
            saveNotes();
        });
        memo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
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
    memo.style.whiteSpace = 'nowrap';
    while (memo.scrollWidth > memo.clientWidth && currentFontSize > minFontSize) {
        currentFontSize -= 0.5;
        memo.style.fontSize = `${currentFontSize}px`;
    }
    if (memo.scrollWidth > memo.clientWidth) {
        memo.style.whiteSpace = 'normal';
        memo.style.wordBreak = 'break-word';
    } else {
        memo.style.whiteSpace = 'nowrap';
    }
}
