/**
 * 2026 SEOUL TRIP - 核心邏輯整合版 (Gaegu Font Version)
 */
const SETTINGS = {
    API_URL: 'https://script.google.com/macros/s/AKfycbx1sBOtKjH9gO1Q9OlUbXGbgmw3uzRLjanuKwAAfMcDkjq7-zNvsqRDcu-fEqKokjFK/exec',
    CACHE_NAME: 'seoul_trip_full_data'
};

document.addEventListener('DOMContentLoaded', () => {
    // 註冊 Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error:', err));
    }
    initApp();
});

async function initApp() {
    const loadingScreen = document.getElementById('loading');
    
    // 1. 抓天氣
    if (typeof fetchSeoulWeather === "function") fetchSeoulWeather();

    // 2. 優先載入快取資料 (實現秒開)
    const cachedData = localStorage.getItem(SETTINGS.CACHE_NAME);
    if (cachedData) {
        console.log("🚀 載入快取資料");
        applyDataToUI(JSON.parse(cachedData));
        fadeOutLoading(loadingScreen);
    }

    // 3. 背景更新
    try {
        const response = await fetch(SETTINGS.API_URL);
        const rawData = await response.json();
        console.log("✅ 抓到最新資料：", rawData);

        // 儲存並更新 UI
        localStorage.setItem(SETTINGS.CACHE_NAME, JSON.stringify(rawData));
        applyDataToUI(rawData);
    } catch (error) {
        console.error("❌ 更新失敗:", error);
    } finally {
        fadeOutLoading(loadingScreen);
    }
}

function applyDataToUI(data) {
    globalData = data; 
    currentRate = data.rate || 0.0215;

    // 更新匯率顯示
    const rateEl = document.getElementById('current-rate');
    if (rateEl) rateEl.innerText = currentRate.toFixed(4);

    // 處理日期標籤
    const allDates = data.itinerary.concat(data.routes).map(r => r[1]);
    let dates = [...new Set(allDates)].filter(d => d).sort();
    
    const tabsContainer = document.getElementById('itin-date-tabs');
    if (tabsContainer && dates.length > 0) {
        tabsContainer.innerHTML = dates.map((d, i) => `
            <div class="date-tab ${currentSelectedDate === d || (currentSelectedDate === "" && i === 0) ? 'active' : ''}" 
                 onclick="filterItinerary('${d}', this)">
                <div style="font-size: 0.7rem; opacity:0.6;">DAY ${i+1}</div>
                <div>${d}</div>
            </div>
        `).join('');

        // 預設選取
        if (!currentSelectedDate) filterItinerary(dates[0], document.querySelector('.date-tab'));
        else filterItinerary(currentSelectedDate, document.querySelector('.date-tab.active'));
    }

    // 更新記帳
    if (typeof updateList === "function") updateList(data);
}

function fadeOutLoading(element) {
    if (element && element.style.display !== 'none') {
        element.style.transition = 'opacity 0.8s ease';
        element.style.opacity = '0';
        setTimeout(() => { element.style.display = 'none'; }, 800);
    }
}
