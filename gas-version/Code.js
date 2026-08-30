/**
 * 修訂時間：2026-08-29 17:15:00
 * 高雄市立福山國中 - 試題詳解小老師導航系統 - 後端 API
 */

function doGet(e) {
  let templateName = 'index';
  if (e && e.parameter && e.parameter.page === 'admin') {
    templateName = 'admin';
  }
  return HtmlService.createHtmlOutputFromFile(templateName)
    .setTitle('高雄市立福山國中 試題詳解小老師')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 取得目前的 Web App 網址
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// 取得資料工作表（自動排除「管理」工作表）
function getDataSheet(ss) {
  const sheets = ss.getSheets();
  for (let s of sheets) {
    const name = s.getName().trim();
    if (name !== '管理' && !name.includes('管理')) {
      return s;
    }
  }
  return sheets[0];
}

// 取得所有設定資料與連結
function getSystemData() {
  const ss = SpreadsheetApp.openById('1WED3J5SPZ2WcIBpclgYU8DFS7yWyo0mkUNXnM4a8f0Y');
  const sheet = getDataSheet(ss);
  const data = sheet.getDataRange().getValues();
  
  // 完全從試算表資料中動態收集學年度、考試類別與書商（0 預設項目）
  const yearsSet = new Set();
  const examTypesSet = new Set();
  const publishersSet = new Set();
  const subjects = ['國文', '英文', '數學', '社會', '自然'];
  const linksMap = {};

  // 從第二列開始讀取（排除表頭）
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const year = String(row[0] !== undefined ? row[0] : '').trim();
    const examType = String(row[1] !== undefined ? row[1] : '').trim();
    const publisher = String(row[2] !== undefined ? row[2] : '').trim();
    const subject = String(row[3] !== undefined ? row[3] : '').trim();
    const url = String(row[4] !== undefined ? row[4] : '').trim();

    if (year) {
      yearsSet.add(year);
      if (examType) examTypesSet.add(examType);
      if (publisher) publishersSet.add(publisher);
      if (examType && publisher && subject && url) {
        const key = `${year}_${examType}_${publisher}_${subject}`;
        linksMap[key] = url;
      }
    }
  }

  // 排序：若為數字由大到小排，若為文字則依字串排序
  const sortedYears = Array.from(yearsSet).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
    return a.localeCompare(b, 'zh-Hant');
  });
  const sortedExamTypes = Array.from(examTypesSet);
  const sortedPublishers = Array.from(publishersSet);

  return {
    years: sortedYears,
    examTypes: sortedExamTypes,
    publishers: sortedPublishers,
    subjects: subjects,
    links: linksMap
  };
}

// 驗證管理員身分
function verifyAdmin(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();

  // 預設容錯驗證 (不分大小寫)
  if (u === 'admin' && p === 'fsjh9999') {
    return { success: true };
  }

  try {
    const ss = SpreadsheetApp.openById('1WED3J5SPZ2WcIBpclgYU8DFS7yWyo0mkUNXnM4a8f0Y');
    let sheet = ss.getSheetByName('管理');
    if (!sheet) {
      const sheets = ss.getSheets();
      for (let s of sheets) {
        if (s.getName().trim() === '管理' || s.getName().includes('管理')) {
          sheet = s;
          break;
        }
      }
    }
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let i = 0; i < data.length; i++) {
        const rowU = String(data[i][0] !== undefined ? data[i][0] : '').trim().toLowerCase();
        const rowP = String(data[i][1] !== undefined ? data[i][1] : '').trim();
        if (rowU && rowP && rowU === u && rowP === p) {
          return { success: true };
        }
      }
    }
    return { success: false, message: '帳號或密碼錯誤' };
  } catch (e) {
    if (u === 'admin' && p === 'fsjh9999') {
      return { success: true };
    }
    return { success: false, message: e.message };
  }
}

// 儲存指定年度、考試類別與書商的各科連結
function saveLinksData(payload) {
  const { year, examType, publisher, links, username, password } = payload;
  
  // 寫入前進行身分驗證
  const auth = verifyAdmin(username, password);
  if (!auth.success) {
    throw new Error('身分驗證失敗：' + auth.message);
  }
  const ss = SpreadsheetApp.openById('1WED3J5SPZ2WcIBpclgYU8DFS7yWyo0mkUNXnM4a8f0Y');
  const sheet = getDataSheet(ss);
  const data = sheet.getDataRange().getValues();
  
  const subjects = ['國文', '英文', '數學', '社會', '自然'];
  const rowMap = {};

  for (let i = 1; i < data.length; i++) {
    const rYear = String(data[i][0]).trim();
    const rExamType = String(data[i][1]).trim();
    const rPublisher = String(data[i][2]).trim();
    const rSubject = String(data[i][3]).trim();
    const key = `${rYear}_${rExamType}_${rPublisher}_${rSubject}`;
    rowMap[key] = i + 1; // 1-based index
  }

  subjects.forEach(sub => {
    const targetUrl = links[sub] ? links[sub].trim() : '';
    const key = `${year}_${examType}_${publisher}_${sub}`;
    
    if (rowMap[key]) {
      // 已存在則更新 E 欄 (第 5 欄)
      sheet.getRange(rowMap[key], 5).setValue(targetUrl);
    } else {
      // 不存在且有填寫連結則新增
      if (targetUrl !== '') {
        sheet.appendRow([year, examType, publisher, sub, targetUrl]);
      }
    }
  });

  return { status: 'success', message: '資料已成功更新' };
}