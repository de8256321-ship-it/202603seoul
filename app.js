/**
 * 2026 首爾賞櫻行程 APP 核心邏輯
 */

const CONFIG = {
    // 1. 請在此填入你的 Google Apps Script 部署網址
    API_URL: '你的_GOOGLE_APPS_SCRIPT_URL', 
    CACHE_KEY: 'seoul_2026_data',
    EXCHANGE_RATE: 0.023 // 1 韓元 = 0.023 台幣
};

document.addEventListener('DOMContentLoaded', () => {
    // 註冊 Service Worker (離線支援)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
    }
    
    // 開始載入資料
    initData();
});

async function initData() {
    const loadingScreen = document.getElementById('loading');
    const itinerarySection = document.getElementById('page-itinerary');

    // --- A. 讀取快取 (實現秒開) ---
    const cached = localStorage.getItem(CONFIG.CACHE_KEY);
    if (cached) {
        console.log('載入快取資料...');
        renderData(JSON.parse(cached));
        // 如果有快取，可以提早隱藏 loading，或讓它在背景更新
        if (loadingScreen) loadingScreen.style.opacity = '0';
        setTimeout(() => { if (loadingScreen) loadingScreen.style.display = 'none'; }, 500);
    }

    // --- B. 抓取最新資料 ---
    try {
        const response = await fetch(CONFIG.API_URL);
        const rawData = await response.json();
        
        // 匯率處理：韓幣轉台幣
        const processedData = rawData.map(item => ({
            ...item,
            twd_amount: item.amount_krw ? Math.round(item.amount_krw * CONFIG.EXCHANGE_RATE) : 0
        }));

        // 儲存新資料到手機
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(processedData));

        // 更新畫面
        renderData(processedData);
        console.log('資料同步完成');

    } catch (err) {
        console.error('更新失敗，目前為離線模式:', err);
    } finally {
        // 確保讀取畫面最後一定會消失
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }
}

// 渲染資料到畫面上
function renderData(data) {
    // 假設你要把行程畫在 #page-itinerary 裡面的某個清單容器
    // 這裡需要根據你 Google Sheet 的欄位名稱 (例如：date, title, location) 來修改
    const container = document.querySelector('#page-itinerary .container') || document.getElementById('page-itinerary');
    
    if (!container) return;

    // 這裡保留你的 Header，只更新內容區
    // 建議在 HTML 裡加一個 <div id="itinerary-list"></div> 專門放內容
    let listHTML = '';
    
    data.forEach(item => {
        listHTML += `
            <div class="card mb-3 shadow-sm" style="border-radius: 15px; border-left: 5px solid #FFB7C5;">
                <div class="card-body">
                    <h5 class="fw-bold">${item.title || '行程載入中'}</h5>
                    <p class="text-muted mb-1"><i class="bi bi-clock"></i> ${item.time || ''}</p>
                    <p class="mb-0 text-danger fw-bold">預估花費：NT$ ${item.twd_amount}</p>
                </div>
            </div>
        `;
    });

    // 尋找內容插入點
    const contentArea = document.getElementById('itinerary-list');
    if (contentArea) {
        contentArea.innerHTML = listHTML;
    } else {
        // 如果沒設插入點，就加在容器最後
        container.innerHTML += `<div id="itinerary-list">${listHTML}</div>`;
    }
}
