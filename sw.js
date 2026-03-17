// 在 index.html 或你的主要 JS 檔案中
async function fetchSheetData() {
  const cacheKey = 'seoul_trip_data';
  
  // 1. 優先從本地快取抓取資料，實現「秒開」
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    renderUI(JSON.parse(cachedData)); // 馬上用舊資料畫出畫面
  } else {
    showLoadingSpinner(); // 只有第一次完全沒快取時，才顯示載入轉圈圈
  }

  // 2. 背景非同步向 Google Sheets 請求最新資料
  try {
    const response = await fetch('你的_GOOGLE_SHEET_API_URL');
    const newData = await response.json();
    
    // 3. 儲存最新資料到本地端
    localStorage.setItem(cacheKey, JSON.stringify(newData));
    
    // 4. 更新畫面 (如果資料有變動，畫面會自動刷新)
    renderUI(newData);
  } catch (error) {
    console.error('無法連線至 Google Sheets，保持顯示離線快取資料', error);
  } finally {
    hideLoadingSpinner();
  }
}
