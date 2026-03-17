/**
 * 2026 SEOUL TRIP - 核心邏輯 (app.js)
 * 優化重點：秒開、快取優先、背景更新、韓元自動轉台幣
 */

const SETTINGS = {
    // 1. 請在此處填入你的 Google Apps Script 部署網址
    API_URL: '你的_GOOGLE_APPS_SCRIPT_URL', 
    CACHE_NAME: 'seoul_trip_cache_v1',
    // 2. 匯率設定 (目前的預設值，你可以根據實際匯率修改)
    KRW_TO_TWD: 0.023 
};

document.addEventListener('DOMContentLoaded', () => {
    // 啟動 Service Worker (處理離線載入)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error:', err));
    }
    
    // 立即載入資料
    refreshAppData();
});

async function refreshAppData() {
    const loadingScreen = document.getElementById('loading');
    const itineraryList = document.getElementById('itinerary-list'); // 建議在 HTML 內建一個空的 div 放清單

    // --- 第一步：先抓快取 (秒開的關鍵) ---
    const cachedData = localStorage.getItem(SETTINGS.CACHE_NAME);
    if (cachedData) {
        console.log("🚀 優先載入快取，讓使用者不用等！");
        renderUI(JSON.parse(cachedData));
        // 有快取就先讓 Loading 稍微淡出
        fadeOutLoading(loadingScreen);
    }

    // --- 第二步：從 Google Sheet 抓最新資料 (背景執行) ---
    try {
        const response = await fetch(SETTINGS.API_URL);
        const rawData = await response.json();

        // 資料預處理：單向韓幣轉台幣，並過濾掉不完整的資料
        const processedData = rawData.map(item => {
            const krw = parseFloat(item.amount_krw) || 0;
            return {
                ...item,
                twd_display: Math.round(krw * SETTINGS.KRW_TO_TWD)
            };
        });

        // 儲存到本地，下次開啟更神速
        localStorage.setItem(SETTINGS.CACHE_NAME, JSON.stringify(processedData));

        // 如果資料有更新，再次更新畫面
        renderUI(processedData);
        console.log("✅ 最新行程同步完成！");

    } catch (error) {
        console.error("❌ 無法獲取新資料，將保持目前的離線狀態", error);
    } finally {
        fadeOutLoading(loadingScreen);
    }
}

// 渲染畫面邏輯
function renderUI(data) {
    const container = document.getElementById('page-itinerary'); 
    // 這裡建議在 page-itinerary 裡面放一個特定的顯示區域，比如 id="itinerary-list"
    let target = document.getElementById('itinerary-list');
    
    if (!target) {
        // 如果找不到標籤，就直接創一個在 itinerary section 裡面
        target = document.createElement('div');
        target.id = 'itinerary-list';
        container.appendChild(target);
    }

    // 將資料組合為 HTML
    target.innerHTML = data.map(item => `
        <div class="itinerary-card" style="border-left: 4px solid #FFB7C5; margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <div class="time" style="color: #666; font-size: 0.9rem;">${item.time || '未定時間'}</div>
            <div class="title" style="font-weight: bold; font-size: 1.1rem; color: #333;">${item.title || '新行程'}</div>
            <div class="cost" style="color: #d63384; margin-top: 5px;">
                <span style="font-size: 0.8rem;">預估花費：</span>
                NT$ ${item.twd_display.toLocaleString()}
            </div>
        </div>
    `).join('');
}

// 漂亮的淡出效果
function fadeOutLoading(element) {
    if (element && element.style.display !== 'none') {
        element.style.transition = 'opacity 0.5s ease';
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, 500);
    }
}
