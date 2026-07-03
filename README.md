# Gmail 自動分類 Apps Script

這個專案會幫 Gmail 做兩件事：

- 建立原生 Gmail filters，讓新進信件自動套上標籤、必要時移出收件匣。
- 安裝每小時一次的 Apps Script 掃描，補抓 filters 沒吃到的近兩天收件匣信件。

它不會刪信。`archive: true` 只代表「移出收件匣」，信仍然會留在 All Mail 和對應標籤裡。

當信件被這套規則套上自定義分類標籤時，程式也會移除來源標籤 `最新快訊`。如果 Gmail UI 的 `最新快訊` 實際上是系統分類，程式會移除 API label id `CATEGORY_UPDATES`。

## 檔案

- `Code.gs`：分類規則與執行程式。
- `appsscript.json`：Apps Script manifest、Gmail API 與授權範圍。

## 安裝

1. 打開 [Google Apps Script](https://script.google.com/)，建立新專案。
2. 把 `Code.gs` 的內容貼到 Apps Script 的 `Code.gs`。
3. 在 Apps Script 左側點「專案設定」，打開「在編輯器中顯示 appsscript.json 資訊清單檔案」。
4. 打開 `appsscript.json`，貼上本資料夾的 `appsscript.json` 內容。
5. 左側「服務」按 `+`，加入 `Gmail API` 進階服務。
6. 如果 Google 提示要到 Cloud 專案啟用 Gmail API，照提示啟用。
7. 回到 Apps Script，選擇並執行 `setupGmailAutoClassifier()`，第一次會要求授權。
8. 再執行一次 `runBackfill7Days()`，把最近 7 天收件匣補分類。

## 常用操作

- `setupGmailAutoClassifier()`：建立標籤、建立 Gmail filters、安裝每小時掃描。
- `runBackfill7Days()`：補分類最近 7 天仍在收件匣的信。
- `runBackfill30Days()`：補分類最近 30 天仍在收件匣的信。
- `runHourlyClassifier()`：手動跑一次每小時掃描。
- `archiveInboxWithArchiveLabels()`：把已經有可封存標籤、但仍留在收件匣的信移出收件匣。
- `deleteClassifierTriggers()`：停止每小時掃描。

## 已經有標籤的信

`runHourlyClassifier()`、`runBackfill7Days()` 和 `runBackfill30Days()` 會先依規則分類，再執行 `archiveInboxWithArchiveLabels()`。

目前會依既有標籤自動移出收件匣的標籤是：

- `Finance`
- `Finance/Bills`
- `Finance/Receipts`
- `Finance/Investment`
- `Finance/Insurance`
- `Learning/Business`
- `Learning/Reading`
- `Purchases/Promotions`
- `Subscriptions`
- `Personal`

我刻意沒有把 `00_Action`、`Work`、`Travel`、`Career`、`Learning/Tech`、`Purchases/Orders` 放進去，因為這些比較可能代表還需要看、回覆、追蹤或確認狀態。

另外，只要信件帶有 `00_Action`，`archiveInboxWithArchiveLabels()` 就不會自動移出收件匣。這用來保護像銀行消費彙整、繳款提醒這類「要分類，但仍應留在收件匣確認」的信。

## 調整規則

每個分類規則都在 `RULES` 裡：

```javascript
{
  name: 'Finance receipts',
  labels: ['Finance/Receipts'],
  archive: true,
  queries: [
    'from:info-inv@ezpay.com.tw'
  ]
}
```

- `labels`：要套上的標籤。
- `archive: true`：套標籤後移出收件匣。
- `archive: false`：保留在收件匣，適合需要注意或可能要回覆的信。
- `queries`：Gmail 搜尋語法。每一條 query 會建立一個 filter，也會被每小時掃描使用。

如果還有其他舊的使用者標籤想在分類後移除，可以加到 `SOURCE_LABEL_NAMES_TO_REMOVE`。如果是 Gmail 系統分類，則加到 `SOURCE_SYSTEM_LABEL_IDS_TO_REMOVE`。

## Promotions 全自動封存

我先把 Gmail `category:promotions` 的全自動封存關掉，避免太 aggressive。

如果你確定促銷分類都可以移出收件匣，把 `CONFIG` 裡這行改成：

```javascript
ENABLE_PROMOTIONS_CATCH_ALL: true
```

再執行 `setupGmailAutoClassifier()`。
