# 高雄市立福山國中 試題詳解小老師 (GitHub + Firebase 版)

本資料夾為專為 **GitHub Pages** 或 **Firebase Hosting** 設計的獨立版本，具備毫秒級開啟速度與 Cloud Firestore 即時資料庫同步。

---

## 📁 檔案結構說明
- `index.html`：學生端前台首頁（純原生 HTML/JS，直連 Firestore 即時讀取）。
- `admin.html`：管理員後台控制台（登入帳號 `admin`，密碼 `fsjh9999`，直連 Firestore 批次寫入）。
- `firebase.json` 與 `.firebaserc`：Firebase Hosting 自動發佈設定檔。

---

## 🚀 部署上線方式 (二選一)

### 方式 A：直接發佈至 Firebase Hosting（推薦，最簡單）
1. 在終端機進入本資料夾：
   ```bash
   cd firebase-version
   ```
2. 登入 Firebase CLI（如尚未登入）：
   ```bash
   firebase login
   ```
3. 一鍵部署上線：
   ```bash
   firebase deploy --only hosting
   ```
4. 部署完成後，即可獲得專屬網址（例如：`https://fsjh-exam-ai.web.app`）！

---

### 方式 B：發佈至 GitHub Pages
1. 將本資料夾（或整個專案）推送到您的 GitHub 儲存庫。
2. 進入 GitHub 儲存庫 ➔ 點擊 **Settings** ➔ **Pages**。
3. 在 **Branch** 選擇 `main`（並指定 `/firebase-version` 或根目錄），點擊 **Save**。
4. 即可獲得 `https://your-username.github.io/repo/` 免費網址！

---

## 🔒 Firestore 安全性規則建議
在 Firebase Console ➔ Firestore Database ➔ **規則 (Rules)** 中，可設定為所有人皆可讀取，僅認證/密碼保護寫入：
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /exam_links/{document=**} {
      allow read: if true;
      allow write: if true; // 測試階段允許寫入
    }
  }
}
```
