"use strict";
const STARTING_CASH = 2500;
const GOAL_VALUE = 10000;
const STORAGE_KEY = "neocoin-market-save-v1";
const HINTS_STORAGE_KEY = "neocoin-market-hints-enabled";
const HOUR_INTERVAL_MS = 8000;
const HOURS_PER_WEEK = 24 * 7;
const HISTORY_LIMIT = 24;
const MAX_POSITION_HISTORY = 400;
const CORPORATE_EVENT_MIN_HOURS = 2160;
const CORPORATE_EVENT_MAX_HOURS = 2880;
const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const accentBySector = {
    Aerospace: "#85b8f5",
    Energy: "#f0b85e",
    Finance: "#78d3b1",
    Healthcare: "#e18cae",
    Technology: "#67c5e0",
    Consumer: "#df9a72",
    Transport: "#9ea8f4",
    Agriculture: "#9cc46e",
    Media: "#c496eb",
    Materials: "#b1a38c",
};
const stockSeed = [
    { ticker: "AETH", name: "Aether Dynamics", sector: "Aerospace", price: 84.2, volatility: 0.006 },
    { ticker: "ORBT", name: "Orbitale Systems", sector: "Aerospace", price: 112.6, volatility: 0.008 },
    { ticker: "HELI", name: "Helios Gridworks", sector: "Energy", price: 63.8, volatility: 0.007 },
    { ticker: "VOLT", name: "VoltForge Energy", sector: "Energy", price: 47.35, volatility: 0.011 },
    { ticker: "NOVA", name: "Nova Capital", sector: "Finance", price: 91.4, volatility: 0.006 },
    { ticker: "MINT", name: "Mintline Bank", sector: "Finance", price: 38.75, volatility: 0.005 },
    { ticker: "VITA", name: "Vitacore Health", sector: "Healthcare", price: 72.9, volatility: 0.006 },
    { ticker: "GENE", name: "GeneSpring Labs", sector: "Healthcare", price: 128.5, volatility: 0.013 },
    { ticker: "QUAN", name: "Quantum Circuit", sector: "Technology", price: 156.3, volatility: 0.012 },
    { ticker: "BYTE", name: "Bytewave Cloud", sector: "Technology", price: 68.45, volatility: 0.009 },
    { ticker: "LUMA", name: "Luma Consumer Co", sector: "Consumer", price: 54.6, volatility: 0.005 },
    { ticker: "FRES", name: "Freshfield Markets", sector: "Consumer", price: 32.2, volatility: 0.004 },
    { ticker: "RAIL", name: "Meridian Rail", sector: "Transport", price: 77.15, volatility: 0.007 },
    { ticker: "SKYP", name: "SkyPath Logistics", sector: "Transport", price: 49.8, volatility: 0.008 },
    { ticker: "GROV", name: "Grovenest Foods", sector: "Agriculture", price: 42.55, volatility: 0.006 },
    { ticker: "TERR", name: "TerraHarvest", sector: "Agriculture", price: 59.3, volatility: 0.009 },
    { ticker: "WAVE", name: "Waveform Media", sector: "Media", price: 86.7, volatility: 0.01 },
    { ticker: "PLAY", name: "Playhouse Interactive", sector: "Media", price: 101.9, volatility: 0.011 },
    { ticker: "ALLO", name: "Alloy Works", sector: "Materials", price: 64.15, volatility: 0.008 },
    { ticker: "LITH", name: "Lithic Minerals", sector: "Materials", price: 35.9, volatility: 0.012 },
];
const knowledgeTopics = [
    {
        id: "buying-selling",
        category: "TRADING BASICS",
        title: "Buying and selling",
        summary: "Buying opens or increases a long position: you own shares and benefit when their price rises. Selling closes or reduces that position. Cost basis is the total amount paid, including the share cost, and profit or loss is current value minus cost basis.",
        example: "You buy 10 shares at N¢50, so cost basis is N¢500. If the price reaches N¢55, the position is worth N¢550 and has a N¢50 unrealized profit.",
        question: "What happens to an unrealized profit when you sell?",
        answers: ["It becomes a realized profit", "It disappears permanently", "It becomes extra margin"],
        correct: 0,
    },
    {
        id: "shorting",
        category: "ADVANCED TRADING",
        title: "Short selling",
        summary: "Short selling profits when a stock falls. You enter at a high price, then cover later at a lower price. The simulator requires 50% margin, and margin can be lost as the stock rises.",
        example: "You short 10 shares at N¢80 with 50% margin. A fall to N¢70 creates N¢100 profit, while a rise to N¢90 creates a N¢100 loss.",
        question: "A short position benefits when the stock...",
        answers: ["Falls", "Pays dividends", "Cannot change"],
        correct: 0,
    },
    {
        id: "order-types",
        category: "EXECUTION",
        title: "Market, limit, and stop orders",
        summary: "A market order executes immediately at the best available simulated price. A limit order is intended to execute at a better price or not at all. A stop order becomes market-active after its trigger is reached.",
        example: "A N¢40 limit buy queues while the stock trades at N¢45. It executes only after the price falls to N¢40 or below.",
        question: "Which order usually executes immediately?",
        answers: ["A market order", "An inactive limit order", "Any untriggered stop"],
        correct: 0,
    },
    {
        id: "fees-liquidity",
        category: "EXECUTION",
        title: "Fees, spread, and liquidity",
        summary: "Every trade can include commission, bid/ask spread, and slippage. The spread is the simulated cost of crossing the market. Liquidity describes available trading capacity; larger orders against lower liquidity normally incur more slippage.",
        example: "An order for 100 low-liquidity shares may fill at a less favorable price than an order for 5 shares.",
        question: "What is likely to increase execution cost?",
        answers: ["A large order in a low-liquidity stock", "A cancelled order", "Leaving cash unused"],
        correct: 0,
    },
    {
        id: "dividends",
        category: "SHARE INCOME",
        title: "Stock dividends",
        summary: "Long holdings receive income based on each company's annual dividend yield. The income is credited over simulated periods. Short positions owe an equivalent dividend cash adjustment because borrowed shares normally pass their dividend burden to the borrower.",
        example: "A share with a 4% annual yield on N¢100 is roughly N¢4 of income over a full year, credited in smaller game periods.",
        question: "What happens to dividend income on a short position?",
        answers: ["It becomes a cash adjustment charged to the short", "It is paid without any change", "It cancels the margin"],
        correct: 0,
    },
    {
        id: "diversification",
        category: "PORTFOLIO RISK",
        title: "Diversification and exposure",
        summary: "Diversification spreads risk across companies and sectors. If one sector has negative news, unrelated sectors may remain stable. Concentration is still possible even with many shares when most value is in one position.",
        example: "Five technology shares create five positions but only one sector exposure. They are less diverse than shares across five sectors.",
        question: "What does a 60% position concentration indicate?",
        answers: ["Most invested value depends on one holding or sector", "The portfolio is automatically diversified", "Every share has the same risk"],
        correct: 0,
    },
    {
        id: "volatility",
        category: "PORTFOLIO RISK",
        title: "Volatility",
        summary: "Volatility measures how dramatically a share or sector tends to move. High volatility can create larger gains and losses, while low volatility usually produces smoother movements.",
        example: "A 12% daily volatility share can make large swings; a 3% volatility share will usually move more gently.",
        question: "Higher volatility usually means...",
        answers: ["A wider range of possible gains and losses", "Guaranteed profit", "No market risk"],
        correct: 0,
    },
    {
        id: "corporate-events",
        category: "MARKET EVENTS",
        title: "Bankruptcy, mergers, and acquisitions",
        summary: "Bankruptcy may delist a company and remove its long position value. Acquisitions merge a target into an acquirer, converting target shares when the simulation's conversion rules apply. These events can shift sector supply and rival share prices.",
        example: "If a weak company files for bankruptcy, a strong rival in the same sector may gain price support.",
        question: "What is an acquisition in this simulator?",
        answers: ["One company combines with or buys another", "A share guarantee", "A dividend type"],
        correct: 0,
    },
];
const worldEvents = [
    { headline: "Orbital cargo contract awarded", description: "A major public contract sends demand higher for local aerospace suppliers.", sector: "Aerospace", impact: 0.028, source: "GLOBAL WIRE" },
    { headline: "Satellite launch delayed by weather", description: "Launch schedules slip, putting near-term pressure on space-sector shares.", sector: "Aerospace", impact: -0.024, source: "ORBITAL DAILY" },
    { headline: "New clean-grid funding announced", description: "A multilateral infrastructure package backs renewable power projects.", sector: "Energy", impact: 0.025, source: "WORLD LEDGER" },
    { headline: "Fuel supply disruption widens", description: "Shipping delays tighten energy supply and rattle the sector.", sector: "Energy", impact: -0.027, source: "MARKET DESK" },
    { headline: "Central bank signals steady rates", description: "Investors welcome a calmer outlook for lenders and capital markets.", sector: "Finance", impact: 0.019, source: "CAPITAL BRIEF" },
    { headline: "Regional lender reports liquidity strain", description: "Fresh concerns over credit conditions weigh on financial firms.", sector: "Finance", impact: -0.03, source: "WORLD LEDGER" },
    { headline: "Breakthrough trial results published", description: "Promising early results lift sentiment across healthcare research.", sector: "Healthcare", impact: 0.03, source: "SCIENCE WIRE" },
    { headline: "New compliance review hits biotech", description: "Regulators request additional data, unsettling healthcare investors.", sector: "Healthcare", impact: -0.025, source: "HEALTH DESK" },
    { headline: "Chip export accord reached", description: "A new trade agreement improves access to key technology markets.", sector: "Technology", impact: 0.027, source: "TECH TONIGHT" },
    { headline: "Cloud services outage affects clients", description: "A broad service interruption raises questions about reliability.", sector: "Technology", impact: -0.026, source: "TECH TONIGHT" },
    { headline: "Consumer confidence jumps", description: "A stronger outlook for household spending lifts retailers and brands.", sector: "Consumer", impact: 0.021, source: "ECONOMY NOW" },
    { headline: "Port congestion disrupts deliveries", description: "Longer shipping times threaten inventory and consumer sales.", sector: "Consumer", impact: -0.02, source: "TRADE WATCH" },
    { headline: "Rail investment plan approved", description: "A regional upgrade promises more freight and infrastructure demand.", sector: "Transport", impact: 0.023, source: "TRANSIT WIRE" },
    { headline: "Air freight costs surge", description: "Higher fuel and freight costs pressure transport operators.", sector: "Transport", impact: -0.024, source: "TRADE WATCH" },
    { headline: "Favorable rains boost crop outlook", description: "Improved growing conditions brighten the season for food producers.", sector: "Agriculture", impact: 0.026, source: "FIELD REPORT" },
    { headline: "Drought watch expands to key region", description: "Dry conditions threaten crop yields and agricultural supply chains.", sector: "Agriculture", impact: -0.03, source: "FIELD REPORT" },
    { headline: "Streaming deal draws record audience", description: "A high-profile media partnership sparks optimism among content firms.", sector: "Media", impact: 0.024, source: "CULTURE WIRE" },
    { headline: "Advertising budgets face a pullback", description: "Major brands trim campaign spending as growth forecasts cool.", sector: "Media", impact: -0.021, source: "CULTURE WIRE" },
    { headline: "Battery-metal discovery announced", description: "A new survey points to a significant deposit of industrial minerals.", sector: "Materials", impact: 0.029, source: "RESOURCE DAILY" },
    { headline: "Steel tariffs unsettle manufacturers", description: "New trade barriers raise costs for materials buyers and producers.", sector: "Materials", impact: -0.023, source: "TRADE WATCH" },
    { headline: "Global growth forecast revised up", description: "A brighter outlook gives broad support to equities across sectors.", sector: "Global", impact: 0.012, source: "WORLD LEDGER" },
    { headline: "Markets digest renewed trade tension", description: "Uncertainty across shipping lanes puts investors in a cautious mood.", sector: "Global", impact: -0.014, source: "GLOBAL WIRE" },
];
const $ = (id) => {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing required page element: #${id}`);
    return element;
};
let selectedKnowledgeTopic = knowledgeTopics[0];
function renderKnowledgeTopic(topic) {
    selectedKnowledgeTopic = topic;
    $("knowledge-category").textContent = topic.category;
    $("knowledge-article-title").textContent = topic.title;
    $("knowledge-summary").textContent = topic.summary;
    $("knowledge-example").textContent = topic.example;
    $("knowledge-question").textContent = topic.question;
    $("knowledge-answer-result").textContent = "";
    const answers = $("knowledge-answers");
    const fragment = document.createDocumentFragment();
    topic.answers.forEach((answer, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = answer;
        button.addEventListener("click", () => {
            const correct = index === topic.correct;
            $("knowledge-answer-result").textContent = correct ? "Correct — you understand this concept." : "Not quite — review the explanation and try again.";
            $("knowledge-answer-result").className = `knowledge-answer-result ${correct ? "positive" : "negative"}`;
            answers.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
            button.classList.add("selected");
        });
        fragment.appendChild(button);
    });
    answers.replaceChildren(fragment);
    renderKnowledgeTopics($("knowledge-search").value);
}
function renderKnowledgeTopics(search = "") {
    const list = $("knowledge-topic-list");
    const query = search.trim().toLowerCase();
    const matches = knowledgeTopics.filter((topic) => `${topic.category} ${topic.title} ${topic.summary}`.toLowerCase().includes(query));
    const fragment = document.createDocumentFragment();
    matches.forEach((topic) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = topic.id === selectedKnowledgeTopic.id ? "active" : "";
        button.innerHTML = `<span>${topic.category}</span><strong>${topic.title}</strong>`;
        button.addEventListener("click", () => renderKnowledgeTopic(topic));
        fragment.appendChild(button);
    });
    if (matches.length === 0) {
        const empty = document.createElement("p");
        empty.className = "knowledge-empty";
        empty.textContent = "No matching topics.";
        fragment.appendChild(empty);
    }
    list.replaceChildren(fragment);
}
const cashText = (value) => `N¢ ${money.format(value)}`;
const signedPercent = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const gameDay = (tick) => Math.floor((9 + tick) / 24) + 1;
const gameClockHour = (tick) => (9 + tick) % 24;
const timeLabel = (tick) => {
    const hour = gameClockHour(tick);
    return `DAY ${String(gameDay(tick)).padStart(2, "0")} · ${String(hour).padStart(2, "0")}:00`;
};
const emptyHistory = (price) => Array.from({ length: 24 }, (_, i) => ({ hour: i, price }));
function createNewGame() {
    return {
        cash: STARTING_CASH,
        stocks: stockSeed.map((seed) => ({
            ...seed,
            previousPrice: seed.price,
            history: emptyHistory(seed.price),
            dividendYield: seed.dividendYield ?? (0.004 + ((seed.ticker.charCodeAt(0) % 5) * 0.001)),
            liquidity: seed.liquidity ?? 8000 + ((seed.ticker.charCodeAt(0) % 7) * 1200),
        })),
        holdings: [],
        shortPositions: [],
        pendingOrders: [],
        tick: 0,
        news: [{
                id: 0, day: 1, hour: 9, headline: "NeoCoin Exchange opens for trading",
                description: "Your first day begins. Follow the world news, study the trends, and invest wisely.",
                sector: "Global", impact: 0, source: "EXCHANGE OPEN",
            }],
        achieved: false,
        nextCorporateEventTick: CORPORATE_EVENT_MIN_HOURS + Math.floor(Math.random() * (CORPORATE_EVENT_MAX_HOURS - CORPORATE_EVENT_MIN_HOURS + 1)),
        completedGoals: 0,
        totalDividends: 0,
        tradeCount: 0,
        peakPortfolioValue: STARTING_CASH,
        biggestTrade: 0,
        activePrediction: null,
        predictionStreak: 0,
        bestPredictionStreak: 0,
        researchReport: null,
        marketHistory: emptyHistory(1000),
        marketIndex: 1000,
    };
}
function isValidSavedGame(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    const validSectors = new Set([...Object.keys(accentBySector), "Global"]);
    return Number.isFinite(candidate.cash) && candidate.cash >= 0 && Number.isInteger(candidate.tick) && candidate.tick >= 0 &&
        Array.isArray(candidate.stocks) && candidate.stocks.length > 0 && candidate.stocks.every((stock) => typeof stock.ticker === "string" && typeof stock.name === "string" && validSectors.has(stock.sector) &&
        Number.isFinite(stock.volatility) && Number.isFinite(stock.price) && stock.price > 0 &&
        Number.isFinite(stock.previousPrice) && stock.previousPrice > 0 && Array.isArray(stock.history) &&
        stock.history.length > 0 && stock.history.length <= HISTORY_LIMIT && stock.history.every((point) => Number.isInteger(point.hour) && Number.isFinite(point.price) && point.price > 0)) &&
        Array.isArray(candidate.holdings) && candidate.holdings.every((holding) => candidate.stocks.some((stock) => stock.ticker === holding.ticker) && Number.isInteger(holding.shares) &&
        holding.shares > 0 && Number.isFinite(holding.costBasis) && holding.costBasis >= 0 &&
        (holding.purchasedAtTick === undefined || (Number.isInteger(holding.purchasedAtTick) &&
            holding.purchasedAtTick >= 0 && holding.purchasedAtTick <= candidate.tick)) &&
        (holding.purchaseHistoryComplete === undefined || typeof holding.purchaseHistoryComplete === "boolean") &&
        (holding.purchaseHistory === undefined || (Array.isArray(holding.purchaseHistory) &&
            holding.purchaseHistory.length > 0 && holding.purchaseHistory.length <= MAX_POSITION_HISTORY &&
            holding.purchaseHistory.every((point) => Number.isInteger(point.hour) && Number.isFinite(point.price) && point.price > 0)))) &&
        (candidate.shortPositions === undefined || (Array.isArray(candidate.shortPositions) && candidate.shortPositions.every((position) => candidate.stocks.some((stock) => stock.ticker === position.ticker) && Number.isInteger(position.shares) &&
            position.shares > 0 && Number.isFinite(position.entryPrice) && position.entryPrice > 0 &&
            Number.isFinite(position.margin) && position.margin >= 0 && Number.isInteger(position.purchasedAtTick) &&
            Array.isArray(position.purchaseHistory)))) &&
        (candidate.pendingOrders === undefined || (Array.isArray(candidate.pendingOrders) && candidate.pendingOrders.every((order) => Number.isInteger(order.id) && candidate.stocks.some((stock) => stock.ticker === order.ticker) &&
            ["buy", "sell", "short", "cover"].includes(order.kind) && Number.isInteger(order.shares) && order.shares > 0 &&
            ["limit", "stop"].includes(order.orderType) && Number.isFinite(order.triggerPrice) && order.triggerPrice > 0))) &&
        Array.isArray(candidate.news) && candidate.news.length <= 24 && candidate.news.every((item) => typeof item.headline === "string" && typeof item.description === "string" && typeof item.source === "string" &&
        validSectors.has(item.sector) && Number.isFinite(item.impact) && Number.isInteger(item.day) && item.day > 0 &&
        Number.isInteger(item.hour) && item.hour >= 0 && item.hour <= 23 && Number.isInteger(item.id)) &&
        typeof candidate.achieved === "boolean" &&
        (candidate.nextCorporateEventTick === undefined || (Number.isInteger(candidate.nextCorporateEventTick) && candidate.nextCorporateEventTick >= candidate.tick));
}
function parseSavedGame(raw) {
    const saved = JSON.parse(raw);
    if (saved && typeof saved === "object") {
        const candidate = saved;
        if (Array.isArray(candidate.stocks)) {
            for (const stock of candidate.stocks) {
                if (!stock.sector) {
                    const seed = stockSeed.find((item) => item.ticker === stock.ticker);
                    if (seed)
                        stock.sector = seed.sector;
                }
                if (!Number.isFinite(stock.dividendYield)) {
                    stock.dividendYield = 0.004 + ((stock.ticker.charCodeAt(0) % 5) * 0.001);
                }
                if (!Number.isFinite(stock.liquidity)) {
                    stock.liquidity = 8000 + ((stock.ticker.charCodeAt(0) % 7) * 1200);
                }
            }
        }
    }
    if (!isValidSavedGame(saved)) {
        throw new Error("Save data did not match this game version.");
    }
    if (!Number.isInteger(saved.nextCorporateEventTick)) {
        saved.nextCorporateEventTick = saved.tick + CORPORATE_EVENT_MIN_HOURS + Math.floor(Math.random() * (CORPORATE_EVENT_MAX_HOURS - CORPORATE_EVENT_MIN_HOURS + 1));
    }
    if (!Array.isArray(saved.shortPositions))
        saved.shortPositions = [];
    if (!Array.isArray(saved.pendingOrders))
        saved.pendingOrders = [];
    if (!Number.isInteger(saved.completedGoals))
        saved.completedGoals = 0;
    if (!Number.isFinite(saved.totalDividends))
        saved.totalDividends = 0;
    if (!Number.isInteger(saved.tradeCount))
        saved.tradeCount = 0;
    if (!Number.isFinite(saved.peakPortfolioValue)) {
        saved.peakPortfolioValue = saved.cash + saved.holdings.reduce((total, holding) => {
            const stock = saved.stocks.find((item) => item.ticker === holding.ticker);
            return total + (stock ? holding.shares * stock.price : 0);
        }, 0);
    }
    if (!Number.isFinite(saved.biggestTrade))
        saved.biggestTrade = 0;
    if (!saved.activePrediction)
        saved.activePrediction = null;
    if (!Number.isInteger(saved.predictionStreak))
        saved.predictionStreak = 0;
    if (!Number.isInteger(saved.bestPredictionStreak))
        saved.bestPredictionStreak = 0;
    if (typeof saved.researchReport !== "string" && saved.researchReport !== null)
        saved.researchReport = null;
    if (!Array.isArray(saved.marketHistory))
        saved.marketHistory = emptyHistory(saved.marketIndex && Number.isFinite(saved.marketIndex) ? saved.marketIndex : 1000);
    if (!Number.isFinite(saved.marketIndex))
        saved.marketIndex = saved.marketHistory[saved.marketHistory.length - 1]?.price ?? 1000;
    for (const holding of saved.holdings) {
        if (!holding.purchaseHistory || !Number.isInteger(holding.purchasedAtTick)) {
            const stock = saved.stocks.find((item) => item.ticker === holding.ticker);
            if (!stock)
                throw new Error(`Saved holding has no matching stock: ${holding.ticker}`);
            holding.purchasedAtTick = saved.tick;
            holding.purchaseHistory = [{ hour: saved.tick, price: stock.price }];
            holding.purchaseHistoryComplete = false;
        }
        else if (holding.purchaseHistoryComplete === undefined)
            holding.purchaseHistoryComplete = false;
    }
    return saved;
}
function loadGame() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return createNewGame();
    try {
        return parseSavedGame(raw);
    }
    catch (error) {
        console.error("Could not load NeoCoin game save:", error);
        localStorage.removeItem(STORAGE_KEY);
        window.setTimeout(() => toast("A damaged save was reset. A new game is ready."), 0);
        return createNewGame();
    }
}
let state;
try {
    state = loadGame();
}
catch (error) {
    console.error("Browser storage is unavailable; this session will not be saved.", error);
    state = createNewGame();
    window.setTimeout(() => toast("Browser storage is unavailable. This game won't be saved."), 0);
}
let selectedTicker = state.stocks[0].ticker;
let openHoldingTicker = null;
let toastTimer = 0;
let sectorFilter = "All";
let marketClockMultiplier = 1;
let marketIntervalId = 0;
let eventCursor = Math.floor(state.tick / 4) % worldEvents.length;
let gameHintsEnabled = true;
let gameHintIndex = 0;
const toast = (message) => {
    const element = $("toast");
    element.textContent = message;
    element.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => element.classList.remove("show"), 2400);
};
const celebrate = (kind) => {
    const app = $("app-shell");
    app.classList.remove("feedback-gain", "feedback-event", "feedback-trade");
    void app.offsetWidth;
    app.classList.add(`feedback-${kind}`);
    window.setTimeout(() => app.classList.remove(`feedback-${kind}`), 700);
};
try {
    gameHintsEnabled = localStorage.getItem(HINTS_STORAGE_KEY) !== "false";
}
catch (error) {
    console.error("Could not load game hint preference:", error);
    window.setTimeout(() => toast("Game tips will stay on for this session."), 0);
}
function saveGame() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    }
    catch (error) {
        console.error("Could not save NeoCoin game:", error);
        toast("Your browser couldn't save progress. Keep this tab open.");
        return false;
    }
}
function downloadSaveGame() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neocoin-market-save-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importSaveGame(file) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        try {
            if (typeof reader.result !== "string")
                throw new Error("Save file could not be read as text.");
            const imported = parseSavedGame(reader.result);
            state = imported;
            selectedTicker = state.stocks[0].ticker;
            sectorFilter = "All";
            eventCursor = Math.floor(state.tick / 4) % worldEvents.length;
            render();
            if (saveGame())
                toast("Saved game loaded and restored in this browser.");
        }
        catch (error) {
            console.error("Could not load NeoCoin game file:", error);
            toast("That save file is invalid or from an incompatible game version.");
        }
    });
    reader.addEventListener("error", () => {
        console.error("Could not read NeoCoin game file:", reader.error);
        toast("The save file couldn't be read.");
    });
    reader.readAsText(file);
}
function stockByTicker(ticker) {
    const stock = state.stocks.find((item) => item.ticker === ticker);
    if (!stock)
        throw new Error(`Unknown stock ticker: ${ticker}`);
    return stock;
}
function holdingByTicker(ticker) {
    return state.holdings.find((holding) => holding.ticker === ticker);
}
function portfolioValue() {
    const longValue = state.holdings.reduce((total, holding) => total + holding.shares * stockByTicker(holding.ticker).price, 0);
    const shortValue = state.shortPositions.reduce((total, position) => total + position.margin + (position.entryPrice - stockByTicker(position.ticker).price) * position.shares, 0);
    return state.cash + longValue + shortValue;
}
function investedValue() {
    const longValue = state.holdings.reduce((total, holding) => total + holding.shares * stockByTicker(holding.ticker).price, 0);
    const margin = state.shortPositions.reduce((total, position) => total + position.margin, 0);
    return longValue + margin;
}
function changeFor(stock) {
    return stock.previousPrice > 0 ? stock.price / stock.previousPrice - 1 : 0;
}
function stockRow(stock) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `stock-row${stock.ticker === selectedTicker ? " selected" : ""}`;
    row.setAttribute("aria-label", `Select ${stock.name}, ${stock.ticker}`);
    row.setAttribute("aria-pressed", String(stock.ticker === selectedTicker));
    const color = accentBySector[stock.sector];
    const move = changeFor(stock);
    row.dataset.ticker = stock.ticker;
    row.innerHTML = `<span class="stock-name-wrap"><span class="stock-avatar" style="--accent:${color}">${stock.ticker.slice(0, 1)}</span><span class="stock-name-text"><strong>${stock.name}</strong><small>${stock.ticker} · ${stock.sector}</small></span></span><span class="stock-price">${cashText(stock.price).replace("N¢ ", "")}</span><span class="stock-move ${move > 0.00001 ? "positive" : move < -0.00001 ? "negative" : "neutral"}">${signedPercent(move)}</span>`;
    row.addEventListener("click", () => selectStock(stock.ticker));
    return row;
}
function renderWatchlist() {
    const list = $("stock-list");
    const fragment = document.createDocumentFragment();
    const sectorSelect = $("sector-filter");
    const sectors = Object.keys(accentBySector);
    if (sectorFilter !== "All" && !sectors.includes(sectorFilter))
        sectorFilter = "All";
    sectorSelect.replaceChildren();
    sectorSelect.add(new Option("All sectors", "All"));
    sectors.forEach((sector) => sectorSelect.add(new Option(sector, sector)));
    sectorSelect.value = sectorFilter;
    const visibleStocks = sectorFilter === "All"
        ? state.stocks
        : state.stocks.filter((stock) => stock.sector === sectorFilter);
    visibleStocks.forEach((stock) => fragment.appendChild(stockRow(stock)));
    if (visibleStocks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "watchlist-empty";
        empty.textContent = `No ${sectorFilter} companies currently listed.`;
        fragment.appendChild(empty);
    }
    list.replaceChildren(fragment);
    $("watchlist-count").textContent = String(visibleStocks.length);
}
function selectStock(ticker) {
    selectedTicker = ticker;
    render();
    const row = Array.from($("stock-list").querySelectorAll(".stock-row"))
        .find((item) => item.dataset.ticker === ticker);
    if (row) {
        row.focus({ preventScroll: true });
        row.scrollIntoView({ block: "nearest" });
    }
}
function drawPriceChart(svg, points, gradientId) {
    if (points.length === 0) {
        svg.replaceChildren();
        return;
    }
    const values = points.map((point) => point.price);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const padding = Math.max((high - low) * 0.18, high * 0.002);
    const min = low - padding;
    const max = high + padding;
    const x = (index) => 12 + index * (736 / Math.max(points.length - 1, 1));
    const y = (price) => 12 + (max - price) / Math.max(max - min, 0.0001) * 216;
    const coordinates = points.map((point, index) => `${x(index).toFixed(1)},${y(point.price).toFixed(1)}`);
    const line = coordinates.join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    const positive = last.price >= first.price;
    const color = positive ? "#54d6a0" : "#f27b82";
    const area = `${x(0)},232 ${line} ${x(points.length - 1)},232`;
    const yLines = [0, 1, 2, 3].map((step) => {
        const yy = 12 + step * 72;
        const label = max - (max - min) * step / 3;
        return `<line x1="0" y1="${yy}" x2="748" y2="${yy}" stroke="#27323a" stroke-width="1" stroke-dasharray="3 5"/><text x="756" y="${yy + 3}" fill="#687680" font-size="9" text-anchor="end" font-family="DM Mono, monospace">${money.format(label)}</text>`;
    }).join("");
    svg.innerHTML = `<defs><linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".2"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${yLines}<polygon points="${area}" fill="url(#${gradientId})"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(points.length - 1)}" cy="${y(last.price)}" r="4" fill="${color}" stroke="#11181e" stroke-width="2"/><circle cx="${x(points.length - 1)}" cy="${y(last.price)}" r="8" fill="${color}" opacity=".13"/>`;
}
function renderChart(stock) {
    const svg = $("price-chart");
    svg.setAttribute("aria-label", `${stock.name} price trend over the last 24 game hours`);
    drawPriceChart(svg, stock.history.slice(-HISTORY_LIMIT), "market-chart-fill");
}
function renderHoldingChart(holding) {
    const stock = stockByTicker(holding.ticker);
    const svg = $("holding-price-chart");
    const firstPrice = holding.purchaseHistory[0].price;
    const change = stock.price / firstPrice - 1;
    $("holding-chart-title").textContent = `${stock.name} (${stock.ticker})`;
    $("holding-chart-since").textContent = holding.purchaseHistoryComplete
        ? `Price history since first purchase · ${timeLabel(holding.purchasedAtTick)}`
        : `Tracking began on ${timeLabel(holding.purchasedAtTick)}; earlier prices weren't saved`;
    $("holding-first-label").textContent = holding.purchaseHistoryComplete ? "FIRST BUY" : "TRACKING START";
    $("holding-first-price").textContent = cashText(firstPrice);
    $("holding-current-price").textContent = cashText(stock.price);
    $("holding-price-change").textContent = signedPercent(change);
    $("holding-price-change").className = change > 0.00001 ? "positive" : change < -0.00001 ? "negative" : "neutral";
    svg.setAttribute("aria-label", `${stock.name} price trend since first purchase`);
    drawPriceChart(svg, holding.purchaseHistory, "holding-chart-fill");
}
function openHoldingChart(ticker) {
    const holding = holdingByTicker(ticker);
    if (!holding)
        return;
    openHoldingTicker = ticker;
    renderHoldingChart(holding);
    $("holding-chart-modal").hidden = false;
    $("close-holding-chart").focus();
}
function closeHoldingChart() {
    openHoldingTicker = null;
    $("holding-chart-modal").hidden = true;
}
function renderSelectedStock() {
    const stock = stockByTicker(selectedTicker);
    const color = accentBySector[stock.sector];
    const move = changeFor(stock);
    $("selected-icon").textContent = stock.ticker.slice(0, 1);
    $("selected-icon").style.setProperty("--accent", color);
    $("selected-name").textContent = stock.name;
    $("selected-sector").textContent = stock.sector.toUpperCase();
    $("selected-sector").style.setProperty("--sector-color", color);
    $("selected-ticker").textContent = `${stock.ticker} · NeoCoin Exchange`;
    $("selected-price").textContent = cashText(stock.price);
    $("selected-change").textContent = `${signedPercent(move)} this game hour`;
    $("selected-change").className = move > 0.00001 ? "positive" : move < -0.00001 ? "negative" : "neutral";
    $("trade-ticker").textContent = stock.ticker;
    $("trigger-price").value = stock.price.toFixed(2);
    renderChart(stock);
    const sectorStocks = state.stocks.filter((item) => item.sector === stock.sector);
    const sectorMove = sectorStocks.reduce((total, item) => total + changeFor(item), 0) / Math.max(sectorStocks.length, 1);
    const sectorVolatility = sectorStocks.reduce((total, item) => total + item.volatility, 0) / Math.max(sectorStocks.length, 1);
    const sectorHoldings = state.holdings.filter((holding) => stockByTicker(holding.ticker).sector === stock.sector);
    const sectorValue = sectorHoldings.reduce((total, holding) => total + holding.shares * stockByTicker(holding.ticker).price, 0);
    const exposure = investedValue() > 0 ? sectorValue / investedValue() : 0;
    $("sector-strength").textContent = `SECTOR ${signedPercent(sectorMove)} TODAY`;
    $("sector-strength").className = sectorMove >= 0 ? "risk-positive" : "risk-negative";
    $("sector-volatility").textContent = `VOLATILITY ${sectorVolatility >= 0.01 ? "HIGH" : sectorVolatility >= 0.007 ? "MEDIUM" : "LOW"}`;
    $("portfolio-exposure").textContent = `EXPOSURE ${(exposure * 100).toFixed(0)}%${exposure >= 0.6 ? " · CONCENTRATED" : ""}`;
    updateOrderEstimate();
}
function renderNews() {
    const feed = $("news-feed");
    if (state.news.length === 0) {
        feed.innerHTML = `<div class="news-empty">No headlines yet. The world news feed will update as the market day unfolds.</div>`;
        return;
    }
    const fragment = document.createDocumentFragment();
    state.news.slice(0, 12).forEach((item) => {
        const color = item.impact > 0 ? "var(--green)" : item.impact < 0 ? "var(--red)" : "var(--cyan)";
        const sector = item.sector === "Global" ? "GLOBAL MARKETS" : item.sector.toUpperCase();
        const impact = item.impact === 0 ? "Market is now open" : `${item.impact > 0 ? "+" : ""}${(item.impact * 100).toFixed(1)}% sector impact`;
        const article = document.createElement("article");
        article.className = "news-item";
        article.style.setProperty("--impact", color);
        const time = document.createElement("div");
        time.className = "news-time";
        const source = document.createElement("span");
        source.textContent = `${item.source} · DAY ${String(item.day).padStart(2, "0")} · ${String(item.hour).padStart(2, "0")}:00`;
        const sectorLabel = document.createElement("span");
        sectorLabel.className = "news-sector";
        sectorLabel.textContent = sector;
        sectorLabel.style.setProperty("--sector-color", item.sector === "Global" ? "var(--cyan)" : accentBySector[item.sector]);
        time.append(source, sectorLabel);
        const headline = document.createElement("h3");
        headline.textContent = item.headline;
        const description = document.createElement("p");
        description.textContent = item.description;
        const related = document.createElement("div");
        related.className = "news-related";
        const relatedLabel = document.createElement("span");
        relatedLabel.className = "news-related-label";
        relatedLabel.textContent = item.sector === "Global" ? "AFFECTS" : "RELATED SHARES";
        related.appendChild(relatedLabel);
        if (item.sector === "Global") {
            const allSectors = document.createElement("span");
            allSectors.className = "news-global-impact";
            allSectors.textContent = "ALL SECTORS";
            related.appendChild(allSectors);
        }
        else {
            state.stocks.filter((stock) => stock.sector === item.sector).forEach((stock) => {
                const shareLink = document.createElement("button");
                shareLink.type = "button";
                shareLink.className = "news-share-link";
                shareLink.textContent = stock.ticker;
                shareLink.title = `View ${stock.name} (${stock.ticker}) in the market`;
                shareLink.setAttribute("aria-label", `View ${stock.name} (${stock.ticker}), affected by this ${sector} story`);
                shareLink.style.setProperty("--sector-color", accentBySector[stock.sector]);
                shareLink.addEventListener("click", () => selectStock(stock.ticker));
                related.appendChild(shareLink);
            });
        }
        const impactLabel = document.createElement("span");
        impactLabel.className = "news-impact";
        impactLabel.textContent = impact;
        article.append(time, headline, description, related, impactLabel);
        fragment.appendChild(article);
    });
    feed.replaceChildren(fragment);
}
function renderHoldings() {
    const holdings = state.holdings.filter((holding) => holding.shares > 0);
    const positionCount = holdings.length + state.shortPositions.length;
    $("holding-badge").textContent = String(positionCount);
    $("holdings-count").textContent = String(positionCount);
    const boostButton = $("boost-week");
    boostButton.disabled = holdings.length === 0 || state.cash >= 20;
    boostButton.title = holdings.length === 0
        ? "Hold at least one stock to advance the market by one week"
        : state.cash >= 20
            ? "Available when your cash is below N¢20"
            : "Advance the market by one week (168 game hours)";
    const list = $("holdings-list");
    if (holdings.length === 0 && state.shortPositions.length === 0) {
        list.innerHTML = `<div class="holdings-empty">No positions yet.<br>Choose a stock and place your first order.</div>`;
        return;
    }
    const fragment = document.createDocumentFragment();
    holdings.forEach((holding) => {
        const stock = stockByTicker(holding.ticker);
        const value = holding.shares * stock.price;
        const profit = value - holding.costBasis;
        const pct = holding.costBasis > 0 ? profit / holding.costBasis : 0;
        const row = document.createElement("div");
        row.className = "holding-row";
        const name = document.createElement("button");
        name.className = "holding-name holding-open";
        name.type = "button";
        name.setAttribute("aria-label", `View ${holding.ticker} price trend since purchase`);
        name.title = "View price trend since first purchase";
        name.addEventListener("click", () => openHoldingChart(holding.ticker));
        const ticker = document.createElement("strong");
        ticker.textContent = holding.ticker;
        const details = document.createElement("small");
        details.textContent = `${holding.shares} ${holding.shares === 1 ? "share" : "shares"} · avg. ${cashText(holding.costBasis / holding.shares).replace("N¢ ", "")}`;
        name.append(ticker, details);
        const worth = document.createElement("div");
        worth.className = "holding-worth";
        const marketValue = document.createElement("strong");
        marketValue.textContent = cashText(value);
        const returnLabel = document.createElement("small");
        returnLabel.className = profit > 0.005 ? "positive" : profit < -0.005 ? "negative" : "neutral";
        returnLabel.textContent = signedPercent(pct);
        worth.append(marketValue, returnLabel);
        const sellButton = document.createElement("button");
        sellButton.type = "button";
        sellButton.className = "holding-sell";
        sellButton.textContent = "SELL 1";
        sellButton.setAttribute("aria-label", `Sell 1 ${holding.ticker} share at current market price`);
        sellButton.title = `Sell 1 ${holding.ticker} share`;
        sellButton.addEventListener("click", () => trade("sell", holding.ticker, 1));
        const sellAllButton = document.createElement("button");
        sellAllButton.type = "button";
        sellAllButton.className = "holding-sell holding-sell-all";
        sellAllButton.textContent = "SELL ALL";
        sellAllButton.setAttribute("aria-label", `Sell all ${holding.ticker} shares at current market price`);
        sellAllButton.title = `Sell all ${holding.ticker} shares`;
        sellAllButton.addEventListener("click", () => sellAllPosition(holding.ticker));
        const tradeActions = document.createElement("div");
        tradeActions.className = "holding-trade-actions";
        tradeActions.append(sellButton, sellAllButton);
        row.append(name, worth, tradeActions);
        fragment.appendChild(row);
    });
    state.shortPositions.forEach((position) => {
        const stock = stockByTicker(position.ticker);
        const pnl = (position.entryPrice - stock.price) * position.shares;
        const row = document.createElement("div");
        row.className = "holding-row short-position-row";
        row.innerHTML = `<button class="holding-name" type="button"><strong>${position.ticker} SHORT</strong><small>${position.shares} shares · entry ${cashText(position.entryPrice)}</small></button><div class="holding-worth"><strong>${cashText(position.margin)}</strong><small class="${pnl >= 0 ? "positive" : "negative"}">${pnl >= 0 ? "+" : ""}${cashText(pnl)} P&L</small></div><div class="holding-trade-actions"><button class="holding-sell" type="button">COVER 1</button></div>`;
        const coverButton = row.querySelector(".holding-sell");
        coverButton?.addEventListener("click", () => trade("cover", position.ticker, 1));
        fragment.appendChild(row);
    });
    list.replaceChildren(fragment);
}
function renderMarketIndex() {
    const svg = $("market-index-chart");
    drawPriceChart(svg, state.marketHistory, "market-index-fill");
    $("market-index-value").textContent = state.marketIndex.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const last = state.marketHistory[state.marketHistory.length - 1]?.price ?? state.marketIndex;
    const previous = state.marketHistory[state.marketHistory.length - 2]?.price ?? last;
    const change = previous > 0 ? last / previous - 1 : 0;
    $("market-index-change").textContent = `${signedPercent(change)} this hour`;
    $("market-index-change").className = change > 0.00001 ? "positive" : change < -0.00001 ? "negative" : "neutral";
    const advancing = state.stocks.filter((stock) => stock.price >= stock.previousPrice).length;
    const declining = state.stocks.length - advancing;
    $("market-breadth").textContent = `${advancing} up · ${declining} down`;
    $("market-breadth").className = advancing >= declining ? "positive" : "negative";
}
function renderSummary() {
    const total = portfolioValue();
    const invested = investedValue();
    const returnValue = total - STARTING_CASH;
    state.peakPortfolioValue = Math.max(state.peakPortfolioValue, total);
    $("cash-value").textContent = cashText(state.cash);
    $("portfolio-value").textContent = cashText(total);
    $("invested-value").textContent = cashText(invested);
    $("dividend-value").textContent = `${cashText(state.totalDividends)} dividends`;
    $("portfolio-change").textContent = `${returnValue >= 0 ? "+" : ""}${cashText(returnValue)} · peak ${cashText(state.peakPortfolioValue)}`;
    $("portfolio-change").className = returnValue > 0.005 ? "positive" : returnValue < -0.005 ? "negative" : "neutral";
    const sectorsOwned = new Set(state.holdings.map((holding) => stockByTicker(holding.ticker).sector)).size;
    const goals = [
        { title: "BUILD N¢10K", target: GOAL_VALUE, value: total, caption: "portfolio value", reward: 250 },
        { title: "OWN 3 SECTORS", target: 3, value: sectorsOwned, caption: "sectors represented", reward: 300 },
        { title: "EARN N¢500", target: 500, value: state.totalDividends, caption: "dividend income", reward: 500 },
    ];
    const goal = goals[Math.min(state.completedGoals, goals.length - 1)];
    if (state.completedGoals < goals.length && goal.value >= goal.target) {
        state.cash = Math.round((state.cash + goal.reward) * 100) / 100;
        state.completedGoals += 1;
        saveGame();
        toast(`Goal complete: ${goal.title}! Earned ${cashText(goal.reward)}.`);
    }
    const currentGoal = goals[Math.min(state.completedGoals, goals.length - 1)];
    const complete = state.completedGoals >= goals.length;
    $("goal-progress").style.width = complete ? "100%" : `${clamp(currentGoal.value / currentGoal.target * 100, 0, 100)}%`;
    document.querySelector(".goal-card .summary-label").textContent = complete ? "GOALS COMPLETE" : `GOAL ${state.completedGoals + 1} OF ${goals.length}`;
    $("goal-caption").textContent = complete
        ? "All market goals completed — keep growing"
        : `${currentGoal.value}/${currentGoal.target} ${currentGoal.caption} · reward ${cashText(currentGoal.reward)}`;
    document.querySelector(".goal-badge").textContent = complete ? "COMPLETE" : currentGoal.title;
    $("market-clock").textContent = timeLabel(state.tick);
}
function gameHints() {
    if (state.tick < 24) {
        return [
            "STAGE 1 · Learn the market: review a sector, compare the chart, and make one small purchase.",
            "STAGE 1 · Research unlocks after 24 game hours; until then, watch the world news for sector signals.",
            "STAGE 1 · Sector forecasts cost N¢50 once unlocked. Start only when you have spare cash.",
        ];
    }
    if (state.tick < 168) {
        return [
            "STAGE 2 · Review the sector strength and volatility indicators before adding a position.",
            "STAGE 2 · Try a sector forecast, or buy one research report for N¢150.",
            "STAGE 2 · Dividends are credited every 24 game hours when you hold shares.",
        ];
    }
    if (state.holdings.length === 0) {
        return [
            "Select a company and review its chart before buying. The chart shows recent prices, but cannot predict the next move.",
            "Check World News for events in a company's sector. Sector news can affect related share prices.",
            "Check the order total and your available cash before buying. A share's price can move after you purchase it.",
        ];
    }
    const invested = investedValue();
    const largestHolding = state.holdings
        .map((holding) => ({ holding, value: holding.shares * stockByTicker(holding.ticker).price }))
        .sort((a, b) => b.value - a.value)[0];
    const hints = [
        "Open a position's price history to compare its current price with your first purchase. It shows past movement, not what happens next.",
        "Check World News for stories affecting sectors you own; those events can move related shares.",
        "Compare a position's current value with its cost basis before trading. Sells execute at today's price, which may be above or below your cost.",
    ];
    if (invested > 0 && largestHolding.value / invested >= 0.6) {
        hints.push(`${largestHolding.holding.ticker} makes up most of your invested value. Reviewing other companies can reduce reliance on one stock, though all shares can lose value.`);
    }
    if (portfolioValue() > 0 && state.cash / portfolioValue() >= 0.6) {
        hints.push("Most of your portfolio is in cash. If you want more market exposure, compare company charts and news first; prices can fall as well as rise.");
    }
    return hints;
}
function renderGameHint() {
    const hints = gameHints();
    $("game-hint-text").textContent = hints[gameHintIndex % hints.length];
    $("game-hint").hidden = !gameHintsEnabled;
    const toggle = $("toggle-game-hints");
    toggle.textContent = gameHintsEnabled ? "HINTS ON" : "HINTS OFF";
    toggle.setAttribute("aria-pressed", String(gameHintsEnabled));
    const research = $("buy-research");
    research.disabled = state.tick < 24;
    research.title = state.tick < 24
        ? `Research unlocks after 24 game hours (${24 - state.tick} hours remaining)`
        : "Buy a N¢150 report revealing the next market signal";
}
function updateOrderEstimate() {
    const stock = stockByTicker(selectedTicker);
    const input = $("quantity");
    const shares = Math.max(1, Math.floor(Number(input.value) || 1));
    input.value = String(shares);
    const side = $("order-side").value;
    const fillPrice = executionPrice(stock, shares, side);
    const total = fillPrice * shares;
    const fee = executionFee(total);
    $("order-total").textContent = cashText(total);
    $("fee-summary").textContent = `Est. fee ${cashText(fee)} · spread/slippage included`;
    $("liquidity-summary").textContent = `Liquidity ${stock.liquidity >= 12000 ? "HIGH" : stock.liquidity >= 7000 ? "MEDIUM" : "LOW"} · yield ${(stock.dividendYield * 100).toFixed(2)}%`;
    const estimatedCash = side === "buy"
        ? state.cash - total - fee
        : side === "short"
            ? state.cash - total * 0.5 - fee
            : side === "cover"
                ? state.cash - total - fee
                : state.cash + total - fee;
    $("cash-after-order").textContent = `Cash after order: ${cashText(estimatedCash)}`;
    const holding = holdingByTicker(selectedTicker);
    const owned = holding?.shares ?? 0;
    const short = state.shortPositions.find((item) => item.ticker === selectedTicker);
    const shortOwned = short?.shares ?? 0;
    $("position-summary").textContent = `You own ${owned} · short ${shortOwned}`;
    $("buy-button").textContent = side === "short" ? "SHORT" : side === "cover" ? "COVER" : "BUY";
    $("sell-button").textContent = "SELL";
    $("buy-button").toggleAttribute("disabled", (side === "sell") ||
        (side === "buy" && total + fee > state.cash) ||
        (side === "short" && total * 0.5 + fee > state.cash) ||
        (side === "cover" && shortOwned < shares));
    $("sell-button").toggleAttribute("disabled", side !== "sell" || owned < shares);
}
function render() {
    renderWatchlist();
    renderSelectedStock();
    renderNews();
    renderPrediction();
    renderHoldings();
    renderSummary();
    renderMarketIndex();
    renderGameHint();
    if (openHoldingTicker) {
        const holding = holdingByTicker(openHoldingTicker);
        if (holding)
            renderHoldingChart(holding);
        else
            closeHoldingChart();
    }
}
function compactPositionHistory(history) {
    if (history.length <= MAX_POSITION_HISTORY)
        return history;
    const middle = history.slice(1, -1).filter((_point, index) => index % 2 === 0);
    return [history[0], ...middle, history[history.length - 1]];
}
function addNews(event) {
    state.news.unshift({ ...event, day: gameDay(state.tick), hour: gameClockHour(state.tick), id: state.tick });
    state.news = state.news.slice(0, 24);
}
function renderPrediction() {
    const sectorSelect = $("prediction-sector");
    if (sectorSelect.options.length === 0) {
        Object.keys(accentBySector).forEach((sector) => sectorSelect.add(new Option(sector, sector)));
    }
    const controls = $("prediction-controls");
    const status = $("prediction-status");
    if (state.activePrediction) {
        status.textContent = `${state.activePrediction.direction} ${state.activePrediction.sector} · N¢${state.activePrediction.wager}`;
        controls.classList.add("prediction-locked");
    }
    else {
        status.textContent = `Streak ${state.predictionStreak} · Best ${state.bestPredictionStreak}`;
        controls.classList.remove("prediction-locked");
    }
    $("news-intro").textContent = state.researchReport
        ? `RESEARCH REPORT · ${state.researchReport}`
        : "Global events move the market. Watch the sectors.";
}
const competitorNames = {
    Aerospace: ["NovaPort Aerospace", "Stratos Beacon", "Kepler Flight"],
    Energy: ["Ionleaf Power", "Northstar Grid", "Green Arc Energy"],
    Finance: ["Apex Ledger", "Summit Credit", "Northline Capital"],
    Healthcare: ["Caduceus Bio", "Lifeform Medical", "Pioneer Genomics"],
    Technology: ["CipherCore Systems", "NovaLogic Labs", "VectorWave AI"],
    Consumer: ["Everlane Goods", "MetroMoss Retail", "UrbanSpark Brands"],
    Transport: ["Swiftway Freight", "Atlas Transit", "Hyperlane Logistics"],
    Agriculture: ["Sunridge Agri", "Verdant Fields", "Harvest Twin"],
    Media: ["StoryForge Media", "Prism Entertainment", "EchoStream"],
    Materials: ["Catalyst Metals", "Bedrock Resources", "Composite Works"],
};
function scheduleNextCorporateEvent() {
    state.nextCorporateEventTick = state.tick + CORPORATE_EVENT_MIN_HOURS +
        Math.floor(Math.random() * (CORPORATE_EVENT_MAX_HOURS - CORPORATE_EVENT_MIN_HOURS + 1));
}
function uniqueTicker(base) {
    const letters = base.toUpperCase().replace(/[^A-Z]/g, "");
    let candidate = (letters.slice(0, 4).padEnd(4, "X"));
    let suffix = 1;
    while (state.stocks.some((stock) => stock.ticker === candidate)) {
        candidate = `${letters.slice(0, 3)}${suffix++}`;
    }
    return candidate;
}
function addCompetitor() {
    const sectors = Object.keys(accentBySector);
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const names = competitorNames[sector];
    const name = names[Math.floor(Math.random() * names.length)];
    const ticker = uniqueTicker(name);
    const price = Math.round((25 + Math.random() * 125) * 100) / 100;
    const stock = {
        ticker,
        name,
        sector,
        price,
        previousPrice: price,
        volatility: 0.008 + Math.random() * 0.008,
        history: emptyHistory(price),
        dividendYield: 0.003 + Math.random() * 0.006,
        liquidity: 6000 + Math.floor(Math.random() * 9000),
    };
    state.stocks.push(stock);
    for (const incumbent of state.stocks) {
        if (incumbent !== stock && incumbent.sector === sector) {
            incumbent.previousPrice = incumbent.price;
            incumbent.price = Math.max(1, Math.round(incumbent.price * (0.972 + Math.random() * 0.018) * 100) / 100);
            incumbent.history.push({ hour: state.tick, price: incumbent.price });
            if (incumbent.history.length > HISTORY_LIMIT)
                incumbent.history.shift();
        }
    }
    addNews({
        headline: `${name} enters the ${sector} market`,
        description: `The new ${ticker} competitor launched in the ${sector} sector, putting pressure on established players.`,
        sector,
        impact: -0.022,
        source: "MARKET ENTRY",
    });
    toast(`${name} (${ticker}) entered the ${sector} market.`);
}
function processBankruptcy() {
    if (state.stocks.length < 8)
        return;
    const eligible = state.stocks.filter((stock) => stock.price < 70);
    const pool = eligible.length > 0 ? eligible : state.stocks;
    const bankrupt = pool[Math.floor(Math.random() * pool.length)];
    const bankruptShort = state.shortPositions.find((position) => position.ticker === bankrupt.ticker);
    if (bankruptShort) {
        const pnl = (bankruptShort.entryPrice - 1) * bankruptShort.shares;
        state.cash = Math.round((state.cash + bankruptShort.margin + pnl) * 100) / 100;
        state.shortPositions = state.shortPositions.filter((position) => position.ticker !== bankrupt.ticker);
    }
    state.stocks = state.stocks.filter((stock) => stock.ticker !== bankrupt.ticker);
    state.holdings = state.holdings.filter((holding) => holding.ticker !== bankrupt.ticker);
    if (selectedTicker === bankrupt.ticker)
        selectedTicker = state.stocks[0].ticker;
    if (openHoldingTicker === bankrupt.ticker)
        closeHoldingChart();
    for (const survivor of state.stocks) {
        if (survivor.sector === bankrupt.sector) {
            survivor.previousPrice = survivor.price;
            survivor.price = Math.max(1, Math.round(survivor.price * (1.018 + Math.random() * 0.018) * 100) / 100);
            survivor.history.push({ hour: state.tick, price: survivor.price });
            if (survivor.history.length > HISTORY_LIMIT)
                survivor.history.shift();
        }
    }
    addNews({
        headline: `${bankrupt.name} has filed for bankruptcy`,
        description: `${bankrupt.ticker} was delisted. Investors lost their remaining equity value, while rivals may benefit.`,
        sector: bankrupt.sector,
        impact: -0.035,
        source: "EXCHANGE NOTICE",
    });
    toast(`${bankrupt.name} (${bankrupt.ticker}) went bankrupt and was delisted.`);
}
function processMerger() {
    if (state.stocks.length < 4)
        return;
    const sameSector = state.stocks.filter((stock, index) => state.stocks.some((other, otherIndex) => otherIndex !== index && other.sector === stock.sector));
    const acquirer = sameSector[Math.floor(Math.random() * sameSector.length)];
    const targets = state.stocks.filter((stock) => stock.ticker !== acquirer.ticker && stock.sector === acquirer.sector);
    if (targets.length === 0)
        return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const targetShort = state.shortPositions.find((position) => position.ticker === target.ticker);
    if (targetShort) {
        const pnl = (targetShort.entryPrice - target.price) * targetShort.shares;
        state.cash = Math.round((state.cash + targetShort.margin + pnl) * 100) / 100;
        state.shortPositions = state.shortPositions.filter((position) => position.ticker !== target.ticker);
    }
    const targetHolding = holdingByTicker(target.ticker);
    if (targetHolding) {
        const acquirerHolding = holdingByTicker(acquirer.ticker);
        if (acquirerHolding) {
            acquirerHolding.shares += targetHolding.shares;
            acquirerHolding.costBasis = Math.round((acquirerHolding.costBasis + targetHolding.costBasis) * 100) / 100;
        }
        else {
            state.holdings.push({
                ticker: acquirer.ticker,
                shares: targetHolding.shares,
                costBasis: targetHolding.costBasis,
                purchasedAtTick: state.tick,
                purchaseHistory: [{ hour: state.tick, price: acquirer.price }],
                purchaseHistoryComplete: false,
            });
        }
        state.holdings = state.holdings.filter((holding) => holding.ticker !== target.ticker);
    }
    state.stocks = state.stocks.filter((stock) => stock.ticker !== target.ticker);
    if (selectedTicker === target.ticker)
        selectedTicker = acquirer.ticker;
    if (openHoldingTicker === target.ticker)
        openHoldingTicker = acquirer.ticker;
    acquirer.previousPrice = acquirer.price;
    acquirer.price = Math.max(1, Math.round(acquirer.price * (1.025 + Math.random() * 0.025) * 100) / 100);
    acquirer.history.push({ hour: state.tick, price: acquirer.price });
    if (acquirer.history.length > HISTORY_LIMIT)
        acquirer.history.shift();
    addNews({
        headline: `${acquirer.name} acquires ${target.name}`,
        description: `${acquirer.ticker} completed its acquisition of ${target.ticker}. The target was merged into the acquirer and delisted.`,
        sector: acquirer.sector,
        impact: 0.028,
        source: "MERGER DESK",
    });
    toast(`${acquirer.name} acquired ${target.name}; ${target.ticker} was delisted.`);
}
function processCorporateEvent() {
    if (state.tick < state.nextCorporateEventTick)
        return;
    const eventType = Math.floor(Math.random() * 3);
    if (eventType === 0)
        addCompetitor();
    else if (eventType === 1)
        processBankruptcy();
    else
        processMerger();
    scheduleNextCorporateEvent();
    celebrate("event");
}
function advanceMarketHour() {
    state.tick += 1;
    processCorporateEvent();
    const event = state.tick % 4 === 0 ? worldEvents[eventCursor++ % worldEvents.length] : undefined;
    if (event) {
        if (state.researchReport)
            state.researchReport = null;
        if (state.activePrediction) {
            const prediction = state.activePrediction;
            const sectorMatches = prediction.sector === event.sector;
            const directionMatches = prediction.direction === "Bullish" ? event.impact > 0 : event.impact < 0;
            if (sectorMatches && directionMatches) {
                const payout = Math.round(prediction.wager * 2 * 100) / 100;
                state.cash = Math.round((state.cash + payout) * 100) / 100;
                state.predictionStreak += 1;
                state.bestPredictionStreak = Math.max(state.bestPredictionStreak, state.predictionStreak);
                toast(`Forecast correct! Earned ${cashText(payout)}.`);
                celebrate("gain");
            }
            else {
                state.predictionStreak = 0;
                toast("Forecast missed. The next sector call is ready.");
            }
            state.activePrediction = null;
        }
        addNews(event);
    }
    const marketDrift = (Math.random() - 0.51) * 0.004;
    for (const stock of state.stocks) {
        stock.previousPrice = stock.price;
        const eventImpact = event && (event.sector === "Global" || event.sector === stock.sector)
            ? event.impact * (event.sector === "Global" ? 0.48 : 0.55)
            : 0;
        const movement = marketDrift + eventImpact + (Math.random() - 0.5) * stock.volatility * 2;
        stock.price = Math.max(1, Math.round(stock.price * (1 + movement) * 100) / 100);
        stock.history.push({ hour: state.tick, price: stock.price });
        if (stock.history.length > HISTORY_LIMIT)
            stock.history.shift();
    }
    const averageMove = state.stocks.reduce((total, stock) => total + (stock.previousPrice > 0 ? stock.price / stock.previousPrice - 1 : 0), 0) / Math.max(state.stocks.length, 1);
    state.marketIndex = Math.max(100, Math.round(state.marketIndex * (1 + averageMove) * 100) / 100);
    state.marketHistory.push({ hour: state.tick, price: state.marketIndex });
    if (state.marketHistory.length > HISTORY_LIMIT)
        state.marketHistory.shift();
    const remainingOrders = [];
    for (const order of state.pendingOrders) {
        const stock = stockByTicker(order.ticker);
        const buyTrigger = order.kind === "buy" || order.kind === "cover";
        const triggerReached = order.orderType === "limit"
            ? (buyTrigger ? stock.price <= order.triggerPrice : stock.price >= order.triggerPrice)
            : (buyTrigger ? stock.price >= order.triggerPrice : stock.price <= order.triggerPrice);
        if (triggerReached)
            trade(order.kind, order.ticker, order.shares, "market");
        else
            remainingOrders.push(order);
    }
    state.pendingOrders = remainingOrders;
    for (const holding of state.holdings) {
        const stock = stockByTicker(holding.ticker);
        holding.purchaseHistory = compactPositionHistory([
            ...holding.purchaseHistory,
            { hour: state.tick, price: stock.price },
        ]);
    }
    if (state.tick % 24 === 0 && state.holdings.length > 0) {
        const dividend = state.holdings.reduce((total, holding) => {
            const stock = stockByTicker(holding.ticker);
            return total + holding.shares * stock.price * (stock.dividendYield / 365 / 24);
        }, 0);
        const roundedDividend = Math.round(dividend * 100) / 100;
        if (roundedDividend > 0) {
            state.cash = Math.round((state.cash + roundedDividend) * 100) / 100;
            state.totalDividends = Math.round((state.totalDividends + roundedDividend) * 100) / 100;
            addNews({
                headline: "Portfolio dividends credited",
                description: `${cashText(roundedDividend)} was paid from qualifying holdings to your NeoCoin balance.`,
                sector: "Global",
                impact: 0,
                source: "DIVIDEND DESK",
            });
        }
    }
    if (state.tick % 24 === 0 && state.shortPositions.length > 0) {
        const shortDividend = state.shortPositions.reduce((total, position) => {
            const stock = stockByTicker(position.ticker);
            return total + position.shares * stock.price * (stock.dividendYield / 365 / 24);
        }, 0);
        const roundedShortDividend = Math.round(shortDividend * 100) / 100;
        if (roundedShortDividend > 0) {
            state.cash = Math.max(0, Math.round((state.cash - roundedShortDividend) * 100) / 100);
            addNews({
                headline: "Borrowing dividend adjustment",
                description: `${cashText(roundedShortDividend)} in cash dividends was charged against short positions.`,
                sector: "Global",
                impact: 0,
                source: "MARGIN DESK",
            });
        }
    }
}
function renderAndSaveMarket() {
    render();
    saveGame();
    if (!state.achieved && portfolioValue() >= GOAL_VALUE) {
        state.achieved = true;
        saveGame();
        $("achievement-modal").hidden = false;
        renderSummary();
    }
}
function updateMarket() {
    advanceMarketHour();
    renderAndSaveMarket();
}
function boostWeek() {
    if (state.holdings.length === 0 || state.cash >= 20)
        return;
    for (let hour = 0; hour < HOURS_PER_WEEK; hour += 1)
        advanceMarketHour();
    renderAndSaveMarket();
    toast(`Advanced 1 week to ${timeLabel(state.tick)}.`);
}
function setMarketClockSpeed(multiplier) {
    if (![1, 2, 4].includes(multiplier))
        multiplier = 1;
    marketClockMultiplier = multiplier;
    window.clearInterval(marketIntervalId);
    marketIntervalId = window.setInterval(updateMarket, HOUR_INTERVAL_MS / marketClockMultiplier);
    document.querySelectorAll(".speed-option").forEach((button) => {
        const active = Number(button.dataset.speed) === marketClockMultiplier;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
    const seconds = HOUR_INTERVAL_MS / 1000 / marketClockMultiplier;
    toast(`Market clock set to ${marketClockMultiplier}x (${Number(seconds.toFixed(1))} sec/game hour).`);
}
function sellAllPosition(ticker) {
    const holding = holdingByTicker(ticker);
    if (!holding || holding.shares <= 0)
        return;
    const proceeds = holding.shares * stockByTicker(ticker).price;
    if (!window.confirm(`Sell all ${holding.shares} ${ticker} shares for ${cashText(proceeds)} at the current market price?`))
        return;
    trade("sell", ticker, holding.shares);
}
function executionPrice(stock, shares, kind) {
    const spread = stock.price * (0.00035 + (shares / stock.liquidity) * 0.001);
    const impact = stock.price * Math.min(0.01, (shares / stock.liquidity) * stock.volatility);
    if (kind === "buy" || kind === "cover")
        return stock.price + spread / 2 + impact;
    return stock.price - spread / 2 - impact;
}
function executionFee(orderValue) {
    return Math.max(1, Math.round(orderValue * 0.0015 * 100) / 100);
}
function trade(kind, ticker = selectedTicker, requestedShares, orderType = "market", triggerPrice) {
    const stock = stockByTicker(ticker);
    const input = $("quantity");
    const shares = requestedShares ?? Math.max(1, Math.floor(Number(input.value) || 1));
    if (orderType !== "market") {
        const trigger = triggerPrice ?? Number($("trigger-price").value);
        if (!Number.isFinite(trigger) || trigger <= 0) {
            toast("Enter a valid trigger price.");
            return;
        }
        state.pendingOrders.push({ id: state.tick * 100000 + state.pendingOrders.length, kind, ticker, shares, orderType, triggerPrice: trigger });
        toast(`${orderType === "limit" ? "Limit" : "Stop"} ${kind} order queued at N¢${trigger.toFixed(2)}.`);
        render();
        saveGame();
        return;
    }
    const fillPrice = executionPrice(stock, shares, kind);
    const orderValue = fillPrice * shares;
    const fee = executionFee(orderValue);
    if (kind === "buy") {
        const required = orderValue + fee;
        if (required > state.cash + 0.00001) {
            toast("Not enough NeoCoins for this order including fees.");
            return;
        }
        let holding = holdingByTicker(stock.ticker);
        if (!holding) {
            holding = { ticker: stock.ticker, shares: 0, costBasis: 0, purchasedAtTick: state.tick, purchaseHistory: [{ hour: state.tick, price: fillPrice }], purchaseHistoryComplete: true };
            state.holdings.push(holding);
        }
        holding.shares += shares;
        holding.costBasis = Math.round((holding.costBasis + orderValue) * 100) / 100;
        state.cash = Math.round((state.cash - required) * 100) / 100;
        toast(`Bought ${shares} ${stock.ticker} at ${cashText(fillPrice)} · fee ${cashText(fee)}.`);
        celebrate("trade");
    }
    else if (kind === "sell") {
        const holding = holdingByTicker(stock.ticker);
        if (!holding || holding.shares < shares) {
            toast("You don't own enough shares to sell.");
            return;
        }
        const costPerShare = holding.costBasis / holding.shares;
        const costRemoved = shares === holding.shares ? holding.costBasis : Math.round(costPerShare * shares * 100) / 100;
        holding.shares -= shares;
        holding.costBasis = Math.max(0, Math.round((holding.costBasis - costRemoved) * 100) / 100);
        state.cash = Math.round((state.cash + orderValue - fee) * 100) / 100;
        if (holding.shares === 0)
            state.holdings = state.holdings.filter((item) => item.ticker !== stock.ticker);
        toast(`Sold ${shares} ${stock.ticker} at ${cashText(fillPrice)} · fee ${cashText(fee)}.`);
        celebrate("gain");
    }
    else if (kind === "short") {
        const margin = Math.round(orderValue * 0.5 * 100) / 100;
        if (margin + fee > state.cash + 0.00001) {
            toast("Not enough cash for 50% short margin and fees.");
            return;
        }
        const position = state.shortPositions.find((item) => item.ticker === stock.ticker);
        if (position) {
            const newShares = position.shares + shares;
            position.entryPrice = (position.entryPrice * position.shares + fillPrice * shares) / newShares;
            position.shares = newShares;
            position.margin = Math.round(position.margin + margin * 100) / 100;
        }
        else {
            state.shortPositions.push({ ticker: stock.ticker, shares, entryPrice: fillPrice, margin, purchasedAtTick: state.tick, purchaseHistory: [{ hour: state.tick, price: fillPrice }] });
        }
        state.cash = Math.round((state.cash - margin - fee) * 100) / 100;
        toast(`Shorted ${shares} ${stock.ticker} at ${cashText(fillPrice)} · 50% margin.`);
        celebrate("trade");
    }
    else {
        const position = state.shortPositions.find((item) => item.ticker === stock.ticker);
        if (!position || position.shares < shares) {
            toast("You don't have enough shares to cover.");
            return;
        }
        const proportion = shares / position.shares;
        const releasedMargin = Math.round(position.margin * proportion * 100) / 100;
        const pnl = Math.round((position.entryPrice - fillPrice) * shares * 100) / 100;
        position.shares -= shares;
        position.margin = Math.max(0, Math.round((position.margin - releasedMargin) * 100) / 100);
        if (position.shares === 0)
            state.shortPositions = state.shortPositions.filter((item) => item.ticker !== stock.ticker);
        state.cash = Math.round((state.cash + releasedMargin + pnl - fee) * 100) / 100;
        toast(`Covered ${shares} ${stock.ticker} · P&L ${pnl >= 0 ? "+" : ""}${cashText(pnl)}.`);
        if (pnl >= 0)
            celebrate("gain");
        else
            celebrate("trade");
    }
    state.tradeCount += 1;
    state.biggestTrade = Math.max(state.biggestTrade, orderValue);
    render();
    saveGame();
    if (!state.achieved && portfolioValue() >= GOAL_VALUE) {
        state.achieved = true;
        saveGame();
        $("achievement-modal").hidden = false;
        renderSummary();
    }
}
$("quantity").addEventListener("input", updateOrderEstimate);
$("quantity-down").addEventListener("click", () => {
    const input = $("quantity");
    input.value = String(Math.max(1, (Number(input.value) || 1) - 1));
    updateOrderEstimate();
});
$("quantity-up").addEventListener("click", () => {
    const input = $("quantity");
    input.value = String(Math.max(1, Number(input.value) || 1) + 1);
    updateOrderEstimate();
});
$("sector-filter").addEventListener("change", (event) => {
    const select = event.currentTarget;
    sectorFilter = select.value === "All" ? "All" : select.value;
    renderWatchlist();
});
$("prediction-controls").addEventListener("click", (event) => {
    const button = event.target.closest("[data-direction]");
    if (!button || state.activePrediction)
        return;
    const sector = $("prediction-sector").value;
    const wager = 50;
    if (state.cash < wager) {
        toast("You need N¢50 to place a sector forecast.");
        return;
    }
    state.cash = Math.round((state.cash - wager) * 100) / 100;
    state.activePrediction = { sector, direction: button.dataset.direction, wager };
    renderPrediction();
    saveGame();
    toast(`${button.dataset.direction} ${sector} forecast placed for ${cashText(wager)}.`);
});
$("buy-research").addEventListener("click", () => {
    if (state.tick < 24) {
        toast(`Research unlocks in ${24 - state.tick} game hours.`);
        return;
    }
    if (state.researchReport) {
        toast("Your current research report is still active.");
        return;
    }
    if (state.cash < 150) {
        toast("You need N¢150 to buy a research report.");
        return;
    }
    const nextEvent = worldEvents[eventCursor % worldEvents.length];
    state.cash = Math.round((state.cash - 150) * 100) / 100;
    state.researchReport = `${nextEvent.sector.toUpperCase()} · ${nextEvent.impact > 0 ? "POSITIVE" : "NEGATIVE"} SIGNAL`;
    renderPrediction();
    renderSummary();
    saveGame();
    toast(`Research complete: ${state.researchReport}.`);
});
$("clock-speed").addEventListener("click", (event) => {
    const button = event.target.closest("[data-speed]");
    if (button)
        setMarketClockSpeed(Number(button.dataset.speed));
});
$("reset-clock-speed").addEventListener("click", () => setMarketClockSpeed(1));
$("buy-button").addEventListener("click", () => {
    const side = $("order-side").value;
    const orderType = $("order-type").value;
    const trigger = Number($("trigger-price").value);
    trade(side, selectedTicker, undefined, orderType, trigger);
});
$("sell-button").addEventListener("click", () => {
    const orderType = $("order-type").value;
    const trigger = Number($("trigger-price").value);
    trade("sell", selectedTicker, undefined, orderType, trigger);
});
$("order-side").addEventListener("change", () => updateOrderEstimate());
$("order-type").addEventListener("change", (event) => {
    const select = event.currentTarget;
    ($("trigger-control")).hidden = select.value === "market";
    const stock = stockByTicker(selectedTicker);
    $("trigger-price").value = stock.price.toFixed(2);
    updateOrderEstimate();
});
$("close-holding-chart").addEventListener("click", closeHoldingChart);
$("save-game").addEventListener("click", () => {
    const savedInBrowser = saveGame();
    try {
        downloadSaveGame();
        toast(savedInBrowser
            ? "Save file downloaded. Keep it to load this game next time."
            : "Save file downloaded, but browser autosave is unavailable.");
    }
    catch (error) {
        console.error("Could not download NeoCoin game save:", error);
        toast(savedInBrowser
            ? "Progress was saved in this browser, but the save file couldn't be downloaded."
            : "Your browser couldn't save or download progress.");
    }
});
$("toggle-game-hints").addEventListener("click", () => {
    gameHintsEnabled = !gameHintsEnabled;
    renderGameHint();
    try {
        localStorage.setItem(HINTS_STORAGE_KEY, String(gameHintsEnabled));
    }
    catch (error) {
        console.error("Could not save game hint preference:", error);
        toast("The hint setting couldn't be saved for next time.");
    }
});
$("next-game-hint").addEventListener("click", () => {
    gameHintIndex += 1;
    renderGameHint();
});
$("load-game").addEventListener("click", () => $("load-game-file").click());
$("load-game-file").addEventListener("change", (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (file)
        importSaveGame(file);
    input.value = "";
});
$("boost-week").addEventListener("click", boostWeek);
$("holding-chart-modal").addEventListener("click", (event) => {
    if (event.target === $("holding-chart-modal"))
        closeHoldingChart();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("holding-chart-modal").hidden)
        closeHoldingChart();
    if (event.key === "Escape" && !$("knowledge-modal").hidden)
        $("knowledge-modal").hidden = true;
    if (event.key === "Escape" && !$("career-modal").hidden)
        $("career-modal").hidden = true;
});
$("reset-game").addEventListener("click", () => {
    if (!window.confirm("Start a new game? Your NeoCoin portfolio and market history will be reset."))
        return;
    state = createNewGame();
    selectedTicker = state.stocks[0].ticker;
    sectorFilter = "All";
    $("sector-filter").value = "All";
    setMarketClockSpeed(1);
    eventCursor = 0;
    saveGame();
    render();
    toast("New game started. You have N¢ 2,500 to invest.");
});
$("close-achievement").addEventListener("click", () => { $("achievement-modal").hidden = true; });
$("achievement-modal").addEventListener("click", (event) => {
    if (event.target === $("achievement-modal"))
        $("achievement-modal").hidden = true;
});
function openCareer() {
    $("career-peak").textContent = cashText(state.peakPortfolioValue);
    $("career-largest").textContent = cashText(state.biggestTrade);
    $("career-trades").textContent = String(state.tradeCount);
    $("career-streak").textContent = String(state.bestPredictionStreak);
    $("career-modal").hidden = false;
    $("close-career").focus();
}
$("open-career").addEventListener("click", openCareer);
$("close-career").addEventListener("click", () => { $("career-modal").hidden = true; });
$("career-modal").addEventListener("click", (event) => {
    if (event.target === $("career-modal"))
        $("career-modal").hidden = true;
});
$("career-new-game").addEventListener("click", () => {
    $("career-modal").hidden = true;
    $("reset-game").click();
});
function openKnowledge() {
    renderKnowledgeTopic(selectedKnowledgeTopic);
    $("knowledge-modal").hidden = false;
    $("knowledge-search").focus();
}
$("open-knowledge").addEventListener("click", openKnowledge);
$("close-knowledge").addEventListener("click", () => { $("knowledge-modal").hidden = true; });
$("knowledge-modal").addEventListener("click", (event) => {
    if (event.target === $("knowledge-modal"))
        $("knowledge-modal").hidden = true;
});
$("knowledge-search").addEventListener("input", (event) => {
    renderKnowledgeTopics(event.currentTarget.value);
});
render();
marketIntervalId = window.setInterval(updateMarket, HOUR_INTERVAL_MS);
