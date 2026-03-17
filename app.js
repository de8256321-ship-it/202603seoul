/**
 * 2026 SEOUL TRIP - 核心邏輯整合版
 */
const SETTINGS = {
    API_URL: 'https://script.google.com/macros/s/AKfycbx1sBOtKjH9gO1Q9OlUbXGbgmw3uzRLjanuKwAAfMcDkjq7-zNvsqRDcu-fEqKokjFK/exec',
    CACHE_NAME: 'seoul_trip_full_data',
    KRW_TO_TWD: 0.023 // 備用匯率
};

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error:', err));
    }
    initApp();
});

async function initApp() {
    const loadingScreen = document.getElementById('loading');
    
    // 🌸 新增：一啟動就抓天氣 (並行執行)
    if (typeof fetchSeoulWeather === "function") {
        fetchSeoulWeather(); 
    }

    // 1. 優先載入快取資料 (實現秒開)
    const cachedData = localStorage.getItem(SETTINGS.CACHE_NAME);
    if (cachedData) {
        console.log("🚀 載入快取資料");
        applyDataToUI(JSON.parse(cachedData));
        fadeOutLoading(loadingScreen);
    }

    // 2. 背景更新行程與記帳資料
    try {
        const response = await fetch(SETTINGS.API_URL);
        const rawData = await response.json();
        // ... 後續代碼保持不變
        console.log("✅ 抓到最新資料：", rawData);

        // 更新匯率基準
        if (rawData.rate) currentRate = rawData.rate;

        // 儲存到本地
        localStorage.setItem(SETTINGS.CACHE_NAME, JSON.stringify(rawData));

        // 套用到介面
        applyDataToUI(rawData);
    } catch (error) {
        console.error("❌ 更新失敗:", error);
    } finally {
        fadeOutLoading(loadingScreen);
    }
}

// 將資料發送到 HTML 既有的 UI 函數中
function applyDataToUI(data) {
    // 同步到 HTML 的全域變數
    globalData = data; 
    currentRate = data.rate || SETTINGS.KRW_TO_TWD;

    // 更新匯率顯示區 (如果有)
    const rateEl = document.getElementById('current-rate');
    if (rateEl) rateEl.innerText = currentRate.toFixed(4);

    // 處理日期標籤
    let dates = [...new Set(data.itinerary.concat(data.routes).map(r => r[1]))].filter(d => d).sort();
    const tabsContainer = document.getElementById('itin-date-tabs');
    
    if (tabsContainer && dates.length > 0) {
        tabsContainer.innerHTML = dates.map((d, i) => `
            <div class="date-tab ${currentSelectedDate === d || (currentSelectedDate === "" && i === 0) ? 'active' : ''}" 
                 onclick="filterItinerary('${d}', this)">
                <div style="font-size: 0.6rem; opacity:0.6; margin-bottom:2px;">DAY ${i+1}</div>
                <div>${d}</div>
            </div>
        `).join('');

        // 如果還沒選日期，預設選第一個
        if (!currentSelectedDate) {
            filterItinerary(dates[0], document.querySelector('.date-tab'));
        } else {
            // 已有選擇則重新整理該日內容
            filterItinerary(currentSelectedDate, document.querySelector('.date-tab.active'));
        }
    }

    // 更新記帳列表
    if (typeof updateList === "function") {
        updateList(data);
    }
}

function fadeOutLoading(element) {
    if (element && element.style.display !== 'none') {
        element.style.transition = 'opacity 0.5s ease';
        element.style.opacity = '0';
        setTimeout(() => { element.style.display = 'none'; }, 500);
    }
}
