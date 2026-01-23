const bookmarkData = {
    "일반": [
        { name: "구글", url: "https://www.google.com/" },
        { name: "네이버", url: "https://www.naver.com/" },
        { name: "노션", url: "https://www.notion.so/" },
        { name: "깃허브", url: "https://github.com/kinkos1234/" },
        { name: "Comad.J Blog", url: "https://kinkos1234.github.io/" },
        { name: "구글 애널리틱스", url: "https://analytics.google.com/analytics/" }
    ],
    "회사": [
        { name: "인트라넷", url: "http://desk.samsong.co.kr/" },
        { name: "타용도", url: "http://etc.samsong.com/" },
        { name: "SAP", url: "https://service.ariba.com/Supplier.aw/109541027/aw?awh=r&awssk=r525oqa5" },
        { name: "Covisint", url: "https://support.portal.covisint.com/web/portal/home" }
    ],
    "자동차 자료 조사": [
        { name: "Global Auto News", url: "http://www.global-autonews.com/home.php" },
        { name: "MARKLINES", url: "https://www.marklines.com/en/global/top" },
        { name: "Focus 2 Move", url: "https://www.focus2move.com/category/market-researches/" },
        { name: "OICA", url: "https://oica.net/production-statistics/" }
    ],
    "취미": [
        { name: "Soop", url: "https://my.afreecatv.com/favorite" },
        { name: "Soop_Dev", url: "https://developers.sooplive.co.kr" },
        { name: "FMK", url: "https://www.fmkorea.com/starcraft" },
        { name: "ONE K", url: "https://kuniv.kr/" },
        { name: "ELO Board", url: "https://www.eloboard.com/women/bbs/board.php?bo_table=rank_list" }
    ],
    "디자인": [
        { name: "CFC", url: "https://contentformcontext.com/" },
        { name: "Plus-Ex", url: "https://www.plus-ex.com/experience" },
        { name: "Saworl", url: "https://saworl.com/new/?page_id=2587" },
        { name: "BRENDEN", url: "https://brenden.kr/project" }
    ],
    "AI": [
        { name: "ChatGPT", url: "https://chatgpt.com/" },
        { name: "Claude", url: "https://claude.ai/new" },
        { name: "LibreChat", url: "https://kdt-librechat.goorm.io/c/new" },
        { name: "SUNO", url: "https://suno.com/" },
        { name: "NotebookLM", url: "https://notebooklm.google.com/" }
    ],
    "부트캠프": [
        { name: "ZOOM", url: "https://zoom.us/j/95793759086?pwd=IB6RiRQEAUyEgsQM8kvoba50ArbOGj.1#success" },
        { name: "LMS", url: "https://k-digital.goorm.io/learn/lecture/62007" },
        { name: "Notion_10", url: "https://www.notion.so/goormkdx/10-2bdc0ff4ce3180c19cbae5dd5c63560f" },
        { name: "Notion_Log", url: "https://www.notion.so/goormkdx/2d9c0ff4ce318113bf43d1387341f10d" },
        { name: "Notion_Team", url: "https://www.notion.so/goormkdx/2-2dac0ff4ce3180f08183d90a81c43587" },
        { name: "Notion_Facilitator", url: "https://tristankim.notion.site/9oormthon-10th" },
        { name: "Khan", url: "https://ko.khanacademy.org/" }
    ]
};

const forcedGlassBoxes = ["타용도", "Global Auto News", "ELO Board", "Saworl", "ChatGPT", "LibreChat", "Notion_Facilitator", "Comad.J Blog"];

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

function initDashboard() {
    const container = document.getElementById('folders-container');
    const notepadElements = document.querySelectorAll('.notepad-container');

    // 1. Generate Bookmark Folders
    Object.entries(bookmarkData).forEach(([category, items], index) => {
        const folder = createFolderElement(category, items, index);
        container.appendChild(folder);

        // Apply intro animation with delay
        setTimeout(() => {
            applyWindAnimation(folder);
        }, index * 100);
    });

    // 2. Animate Notepads
    notepadElements.forEach((notepad, index) => {
        setTimeout(() => {
            applyWindAnimation(notepad);
        }, (Object.keys(bookmarkData).length + index) * 100);
    });

    // 3. Setup Notepad Logic
    setupNotepads();
}

function createFolderElement(category, items, index) {
    const folder = document.createElement('div');
    folder.className = 'folder';

    // Fixed aesthetic mapping for consistent layout
    const layoutMapping = {
        "일반": "span-h-2",
        "회사": "span-v-1",
        "자동차 자료 조사": "span-v-2",
        "취미": "span-v-1",
        "디자인": "span-v-2",
        "AI": "span-h-2",
        "부트캠프": "span-v-1"
    };
    const sizeClass = layoutMapping[category] || "span-v-1";
    folder.classList.add(sizeClass);

    const title = document.createElement('div');
    title.className = 'folder-title';
    title.textContent = category;
    folder.appendChild(title);

    const list = document.createElement('div');
    list.className = 'bookmark-list';

    items.forEach(item => {
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_self';
        link.className = 'bookmark-item';
        link.title = item.name;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'bookmark-icon';

        const isForcedGlass = forcedGlassBoxes.includes(item.name);

        if (isForcedGlass) {
            setupGlassBox(iconContainer, item.name);
        } else {
            const img = document.createElement('img');
            const domain = new URL(item.url).hostname;
            img.src = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            img.onerror = () => {
                setupGlassBox(iconContainer, item.name);
            };
            iconContainer.appendChild(img);
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

function setupGlassBox(container, name) {
    const colors = [
        'rgba(255, 255, 255, 0.25)',
        'rgba(200, 230, 255, 0.25)',
        'rgba(255, 220, 230, 0.25)',
        'rgba(230, 255, 220, 0.25)',
        'rgba(240, 220, 255, 0.25)'
    ];
    container.style.background = colors[Math.floor(Math.random() * colors.length)];
    container.innerHTML = `<span style="font-weight: 600; font-size: 0.9rem; opacity: 0.8;">${name.charAt(0)}</span>`;
}


function applyWindAnimation(element) {
    // Random start positions for "blown by wind" effect
    const startX = (Math.random() * 1000 - 500) + 'px';
    const startY = (Math.random() * 1000 - 500) + 'px';
    const startRotate = (Math.random() * 720 - 360) + 'deg';

    element.style.setProperty('--start-x', startX);
    element.style.setProperty('--start-y', startY);
    element.style.setProperty('--start-rotate', startRotate);

    element.classList.add('animate-in');
}

function setupNotepads() {
    const memos = document.querySelectorAll('.memo-item');

    memos.forEach(memo => {
        // Load saved state
        const savedText = localStorage.getItem(`memo-${Array.from(memos).indexOf(memo)}`);
        if (savedText) {
            memo.textContent = savedText;
            resizeMemoFont(memo);
        }

        memo.addEventListener('input', () => {
            resizeMemoFont(memo);
            // Save state
            localStorage.setItem(`memo-${Array.from(memos).indexOf(memo)}`, memo.textContent);
        });

        // Prevention of newline if we want to keep it strictly one line until max wrap
        memo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    });
}

function resizeMemoFont(memo) {
    const minFontSize = 10;
    const maxFontSize = 14;
    let currentFontSize = maxFontSize;

    memo.style.fontSize = `${currentFontSize}px`;
    memo.style.whiteSpace = 'nowrap';

    // While the text overflows and font size is above minimum
    while (memo.scrollWidth > memo.clientWidth && currentFontSize > minFontSize) {
        currentFontSize -= 0.5;
        memo.style.fontSize = `${currentFontSize}px`;
    }

    // If it still overflows after reaching minFontSize, enable wrapping
    if (memo.scrollWidth > memo.clientWidth) {
        memo.style.whiteSpace = 'normal';
        memo.style.wordBreak = 'break-word';
    } else {
        memo.style.whiteSpace = 'nowrap';
    }
}
