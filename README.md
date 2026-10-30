# 添好運台灣官網改版測試

本專案只部署改版測試網站，不設定正式網域、不修改正式營運網站。

- `index.html`：使用者提供的前台 HTML，完整保留內嵌圖片與原有內容。
- `cms.html`：使用者提供的 CMS Demo；資料只存於目前瀏覽器的 localStorage，角色切換不是正式登入驗證，也不會更新已部署的首頁。
- `assets/site.js`、`assets/site.css`：手機導覽、Popup 焦點／捲動與 Safari 視窗高度處理。

前台原始內容包含示意新聞、餐點圖片佔位、待確認的門市資料。聯絡表單會驗證欄位，但不寄送郵件；招募 mailto 尚無收件人。部署靜態網站不會自動補齊這些服務或資料。

## 本機啟動

不需要安裝網站依賴或建置：

```sh
cd /workspace/timhowan-upgrade
python3 -m http.server 8000 --bind 127.0.0.1
```

## 互動驗證

測試需要 Node.js、Playwright 與瀏覽器。若環境沒有 Playwright，可安裝在專案外：

```sh
npm install --prefix /tmp/thw-browser-tests playwright@1.62.1
NODE_PATH=/tmp/thw-browser-tests/node_modules node tests/mobile.cjs
```

預設使用 `/usr/bin/chromium`，可透過 `CHROMIUM_PATH` 調整。使用 WebKit 時先透過相同版本 Playwright CLI 安裝引擎，然後執行：

```sh
NODE_PATH=/tmp/thw-browser-tests/node_modules BROWSER=webkit node tests/mobile.cjs
```

以 `BASE_URL` 指向已部署網址可重跑線上測試。涵蓋 375、390、430、844、1440 像素寬度、觸控導覽、兩組輪播、消息分頁／文章、菜單分類／詳情、門市篩選／詳情、隱私權 Popup、表單驗證、圖片解碼及水平溢出。WebKit 模擬不能取代 iPhone Safari 實機驗收。

## GitHub Pages

在此專案的 Settings → Pages → Build and deployment，將 Source 設為 **GitHub Actions**。`.github/workflows/pages.yml` 會在推送 `main` 或手動執行時部署，只上傳前台、CMS 及靜態資源。

預期預設網址為 `https://flowerphoebeliao-mkt.github.io/timhowan-upgrade/`；網址須待 Pages 部署成功後才可使用。CMS 位於同網址下的 `cms.html`。不新增 `CNAME`，維持正式網域不變。

上線後確認 Actions 的部署工作成功、Pages 的 HTTPS 設定，以及手機直向／橫向操作。測試結果與未完成驗證會記錄在 `TESTING.md`。
