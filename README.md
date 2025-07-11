# Novel Scraper
A simple Node.js module for scraping novels from Webnovel.com, Fanmtl.com and more

# Installation
```
npm install novel-scraper
```

# Basic Documentation
Each function requires at least two parameters:
1. A link to chapter 1 of the novel.
2. The path where the novel will be saved locally.
3. The path to the Ublock folder, which is needed for bypassing site restrictions.

- Only the fanmtl() function requires a third parameter:
You can download the Ublock folder from this link:
https://drive.google.com/drive/folders/1_bQ0g131S9xgkAfMhTJqjV1j-WAtWUw2?usp=drive_link

# Example
'''
const { webnovel, fanmtl } = require("novel-scraper");

# For Webnovel.com
webnovel(
  "https://www.webnovel.com/book/multiverse-dimensional-magic-store_32835537600317305/kel'thuzad's-staff_88163497120154516",
  "C:/Users/Tgthegood/Documents/Novels"
)
  .then(() => console.log("Scraping completed"))
  .catch(err => console.error("Error:", err));

# For Fanmtl.com
fanmtl(
  "https://www.fanmtl.com/novel/699967081_1.html",
  "C:/Users/Tgthegood/Documents/Novels",
  "C:/Users/Tgthegood/Documents/Ublock"
)
  .then(() => console.log("Scraping completed"))
  .catch(err => console.error("Error:", err));
'''

# Requirements
- Node.js
- Windows OS (for local paths)
- Ublock folder required for Fanmtl scraping
