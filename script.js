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

}


async function setupPopup() {
    
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
