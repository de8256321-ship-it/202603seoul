/**
 * 2026 首爾賞櫻行程 APP - 核心邏輯 (app.js)
 */

// 1. 設定區：請將此處換成你實際的 Google Apps Script 部署網址
const CONFIG = {
    SHEET_API_URL: '你的_GOOGLE_APPS_SCRIPT_URL_放這裡',
    CACHE_KEY: 'seoul_trip_data_v1',
    EXCHANGE_RATE: 0.023 // 假設 1 韓元 = 0.023 台幣
};

// 2. 初始化 APP
document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    loadAppData();
});

// 3. 註冊 Service Worker (優化開啟速度與離線支援)
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker 已就緒'))
            .catch(err => console.error('Service Worker 註冊失敗:', err));
    }
}

// 4. 資料讀取核心邏輯 (Stale-While-Revalidate 策略)
async function loadAppData() {
    const mainContainer = document.getElementById('app-content'); // 假設你的容器 ID

    // A. 優先檢查本地快取：實現「秒開」
    const cachedData = localStorage.getItem(CONFIG.CACHE_KEY);
    if (cachedData) {
        console.log('正在載入本地快取資料...');
        renderUI(JSON.parse(cachedData));
    }

    // B. 背景抓取最新資料：確保資訊即時更新
    try {
        console.log('正在從 Google Sheets 同步最新資料...');
        const response = await fetch(CONFIG.SHEET_API_URL);
        if (!response.ok) throw new Error('網路回應異常');
        
        const rawData = await response.json();
        
        // 處理資料：進行匯率換算 (韓幣 -> 台幣)
        const processedData = processSheetData(rawData);

        // 儲存至本地快取
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(processedData));

        // 如果資料有變動，更新畫面
        renderUI(processedData);
        console.log('資料同步完成！');
    } catch (error) {
        console.error('無法連線至 Google Sheets，將繼續使用舊資料:', error);
    }
}

// 5. 資料處理邏輯：單向匯率轉換
function processSheetData(data) {
    // 確保以台幣為主要記帳幣值，將韓幣 (KRW) 轉換為台幣 (TWD)
    return data.map(item => {
        const krwAmount = parseFloat(item.amount_krw) || 0; 
        // 使用簡單公式：$TWD = KRW \times Rate$
        const twdAmount = Math.round(krwAmount * CONFIG.EXCHANGE_RATE);
        
        return {
            ...item,
            display_amount: twdAmount // 統一使用台幣作為顯示金額
        };
    });
}

// 6. 渲染畫面邏輯 (請根據你的 HTML 結構調整)
function renderUI(data) {
    const container = document.getElementById('app-content');
    if (!container) return;

    // 清空原本的內容
    container.innerHTML = '';

    // 舉例：畫出行程列表或記帳清單
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'trip-card';
        card.innerHTML = `
            <h3>${item.title || '未命名行程'}</h3>
            <p>時間：${item.time || '-'}</p>
            <p>花費：NT$ ${item.display_amount}</p>
        `;
        container.appendChild(card);
    });
}
