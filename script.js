const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" }
];


async function getQuotes() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['userQuotes'], (result) => {
                const userQuotes = result.userQuotes || [];
                resolve([...defaultQuotes, ...userQuotes]);
            });
        } else {
            resolve(defaultQuotes);
        }
    });
}

async function getUserQuotes() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['userQuotes'], (result) => {
                resolve(result.userQuotes || []);
            });
        } else {
            resolve([]);
        }
    });
}

async function getDailyQuote() {
    const quotes = await getQuotes();
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % quotes.length;
    return quotes[index];
}

async function saveQuote(text, author) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['userQuotes'], (result) => {
                const userQuotes = result.userQuotes || [];
                userQuotes.push({ text, author });
                chrome.storage.local.set({ userQuotes }, resolve);
            });
        });
    } else {
        console.log("Mock save:", text, author);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    const isNewTab = !!document.getElementById('daily-quote-section');
    const isPopup = !!document.getElementById('popup-plant-form');
    const isGarden = !!document.getElementById('garden-grid');

    if (isNewTab) {
        setupNewTab();
    } else if (isPopup) {
        setupPopup();
    } else if (isGarden) {
        setupGarden();
    }
});

async function setupNewTab() {
    const quote = await getDailyQuote();
    document.getElementById('daily-quote-text').textContent = `"${quote.text}"`;
    document.getElementById('daily-quote-author').textContent = `- ${quote.author}`;


    const modal = document.getElementById('plant-modal');
    const btnPlant = document.getElementById('btn-plant-quote');
    const spanClose = document.getElementsByClassName("close-modal")[0];

    if (btnPlant) {
        btnPlant.onclick = () => modal.classList.remove('hidden');
        spanClose.onclick = () => modal.classList.add('hidden');
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.classList.add('hidden');
            }
        };

        document.getElementById('plant-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = document.getElementById('new-quote-text').value;
            const author = document.getElementById('new-quote-author').value;
            await saveQuote(text, author);
            modal.classList.add('hidden');
            alert("Quote planted successfully!");
            document.getElementById('plant-form').reset();
        });
    }


    
    document.getElementById('btn-copy').onclick = () => {
        const text = document.getElementById('daily-quote-text').textContent;
        const author = document.getElementById('daily-quote-author').textContent;
        navigator.clipboard.writeText(`${text} ${author}`);
        alert("Copied to clipboard!");

    };


    const settingsModal = document.getElementById('settings-modal');
    const btnSettings = document.getElementById('btn-settings');
    const closeSettings = document.getElementById('close-settings-modal');

    if (btnSettings) {
        btnSettings.onclick = () => settingsModal.classList.remove('hidden');
        closeSettings.onclick = () => settingsModal.classList.add('hidden');


        window.addEventListener('click', (event) => {
            if (event.target == settingsModal) {
                settingsModal.classList.add('hidden');
            }
        });
    }


    const themes = [
        { id: 'paper', name: 'Paper (Default)' },
        { id: 'nature', name: 'Nature' },
        { id: 'github', name: 'GitHub' },
        { id: 'anime', name: 'Anime' },
        { id: '2010s', name: '2010s' },
        { id: 'chef', name: 'Chef' },
        { id: 'vscode', name: 'VSCode' },
        { id: 'coffee', name: 'Coffee' }
    ];

    const themeGrid = document.getElementById('theme-grid');


    const savedTheme = await new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['userTheme'], (result) => resolve(result.userTheme || 'paper'));
        } else {
            resolve(localStorage.getItem('userTheme') || 'paper');
        }
    });

    applyTheme(savedTheme);


    themes.forEach(theme => {
        const btn = document.createElement('div');
        btn.className = `theme-btn ${savedTheme === theme.id ? 'active' : ''}`;
        btn.textContent = theme.name;
        btn.onclick = () => {
            applyTheme(theme.id);
            saveTheme(theme.id);


            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        themeGrid.appendChild(btn);
    });


    setupFocusFlower();
    setupJournal();
}

function applyTheme(themeId) {
    if (themeId === 'paper') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeId);
    }
}

function saveTheme(themeId) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ userTheme: themeId });
    } else {
        localStorage.setItem('userTheme', themeId);
    }
}


async function setupPopup() {

    const savedTheme = await new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['userTheme'], (result) => resolve(result.userTheme || 'paper'));
        } else {
            resolve(localStorage.getItem('userTheme') || 'paper');
        }
    });

    applyTheme(savedTheme);

    const { draftQuote } = await new Promise(resolve => chrome.storage.local.get(['draftQuote'], resolve));

    if (draftQuote) {
        document.getElementById('popup-quote-text').value = draftQuote;

        chrome.storage.local.remove('draftQuote');

    } else {

        if (typeof chrome !== 'undefined' && chrome.tabs) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
                try {
                    const [{ result }] = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => window.getSelection().toString()
                    });
                    if (result) {
                        document.getElementById('popup-quote-text').value = result;
                    }
                } catch (e) {
                    console.log("An error happened", e);
                }
            }
        }
    }

    document.getElementById('popup-plant-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = document.getElementById('popup-quote-text').value;

        const author = document.getElementById('popup-quote-author').value;
        await saveQuote(text, author);


        window.close();
    });

    document.getElementById('btn-view-garden').onclick = () => {

        chrome.tabs.create({ url: "index.html" });

    };
}

async function setupGarden() {

    const savedTheme = await new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['userTheme'], (result) => resolve(result.userTheme || 'paper'));
        } else {
            resolve(localStorage.getItem('userTheme') || 'paper');
        }
    });

    applyTheme(savedTheme);

    const userQuotes = await getUserQuotes();
    const grid = document.getElementById('garden-grid');

    if (userQuotes.length > 0) {
        grid.innerHTML = '';

        [...defaultQuotes, ...userQuotes].forEach(quote => {
            const card = document.createElement('div');
            card.className = 'quote-card';
            card.innerHTML = `
                <div class="quote-content">
                    <p class="text">"${quote.text}"</p>
                    <p class="author">- ${quote.author}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}


let focusInterval;
let focusTimeLeft = 25 * 60;
const FLOWERS = ['🌻', '🌷', '🌹', '🌺', '🌸', '🌼', '🪷', '💐', '🥀', '☘️'];

function setupFocusFlower() {
    const btnStart = document.getElementById('btn-start-focus');
    const btnStop = document.getElementById('btn-stop-focus');

    const timerDisplay = document.getElementById('timer-display');
    const focusIcon = document.getElementById('focus-icon');
    const status = document.getElementById('focus-status');

    if (!btnStart) return;

    btnStart.onclick = () => {
        startFocusTimer(btnStart, btnStop, timerDisplay, focusIcon, status);
    };

    btnStop.onclick = () => {
        stopFocusTimer(btnStart, btnStop, timerDisplay, focusIcon, status);
    };
}

function startFocusTimer(btnStart, btnStop, display, icon, status) {
    btnStart.classList.add('hidden');
    btnStop.classList.remove('hidden');
    icon.classList.add('growing');
    status.textContent = "Growing... Stay focused!";


    if (focusTimeLeft <= 0) focusTimeLeft = 25 * 60;

    focusInterval = setInterval(() => {
        focusTimeLeft--;
        updateTimerDisplay(display);

        if (focusTimeLeft <= 0) {
            completeFocus(btnStart, btnStop, icon, status);
        }
    }, 1000);
}

function stopFocusTimer(btnStart, btnStop, display, icon, status) {
    clearInterval(focusInterval);
    btnStart.classList.remove('hidden');
    btnStop.classList.add('hidden');
    icon.classList.remove('growing');


    icon.className = 'fa-solid fa-seedling';
    status.textContent = "Oh no! The plant withered.";
    focusTimeLeft = 25 * 60;
    updateTimerDisplay(display);
}

function completeFocus(btnStart, btnStop, icon, status) {
    clearInterval(focusInterval);
    btnStart.classList.remove('hidden');
    btnStop.classList.add('hidden');
    icon.classList.remove('growing');


    const randomFlower = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];

    icon.style.display = 'none';
    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = randomFlower;
    emojiSpan.style.fontSize = '4rem';
    icon.parentNode.insertBefore(emojiSpan, icon);

    status.textContent = "yay! You grew a flower!";


    setTimeout(() => {
        emojiSpan.remove();
        icon.style.display = 'inline-block';
        icon.className = 'fa-solid fa-seedling';
        focusTimeLeft = 25 * 60;
        updateTimerDisplay(document.getElementById('timer-display'));
        status.textContent = "Ready to grow another one!";
    }, 5000);
}

function updateTimerDisplay(display) {
    const minutes = Math.floor(focusTimeLeft / 60);
    const seconds = focusTimeLeft % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


async function setupJournal() {
    const textarea = document.getElementById('journal-entry');
    const status = document.getElementById('journal-status');

    if (!textarea) return;


    const today = new Date().toDateString();
    const storageKey = `journal_${today}`;

    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([storageKey], (result) => {
            if (result[storageKey]) {
                textarea.value = result[storageKey];
            }
        });
    } else {
        const saved = localStorage.getItem(storageKey);
        if (saved) textarea.value = saved;
    }


    let timeout;
    textarea.addEventListener('input', () => {
        status.classList.remove('visible');
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const content = textarea.value;
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ [storageKey]: content }, () => {
                    showSavedStatus(status);
                });
            } else {
                localStorage.setItem(storageKey, content);
                showSavedStatus(status);
            }
        }, 1000);
    });
}

function showSavedStatus(element) {
    element.textContent = "Saved";
    element.classList.add('visible');
    setTimeout(() => {
        element.classList.remove('visible');
    }, 2000);
}
