let { connect } = require("puppeteer-real-browser");
let path = require("path")
let fs = require('fs');

function default_path(){
    return __dirname;
}
function sleep_miliseconds(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function sleep_seconds(ms) {
    return new Promise(resolve => setTimeout(resolve, ms*1000));
}
function path_sanitize(inputPath) {
let sanitized = inputPath.replace(/\//g, '/');
  sanitized = path.normalize(sanitized);
  if (!fs.existsSync(sanitized)) {
    throw new Error(`The path does not Exist: ${sanitized}`);
  }
  return sanitized;
}


//Webnovel Async Functions only for Webnovel
async function webnovel_scroll(page, parrafosSelector, paragraph_loading) {
    let prevParrafosCount = 0;
    let parrafosLoaded = true;
    let lastScrollTime = Date.now();

    while (parrafosLoaded) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });

        await sleep_miliseconds(100);
        if (paragraph_loading) {
        const progressText = await page.evaluate(selector => {
            const el = document.querySelector(selector);
            return el?.textContent?.trim() || null;
        }, paragraph_loading);
        if (progressText) {
            process.stdout.write(`\rProgress: ${progressText}`);
        };
        };

        if (Date.now() - lastScrollTime >= 60000) {
            const newParrafosCount = await page.evaluate(parrafosSelector => {
                const parrafos = document.querySelectorAll(parrafosSelector);
                return parrafos.length;
            }, parrafosSelector);

            if (newParrafosCount == prevParrafosCount) {
                parrafosLoaded = false;
            } else {
                prevParrafosCount = newParrafosCount;
            }
            lastScrollTime = Date.now();
        }
    }
}
//Webnovel Async Functions only for Webnovel


//Init functions for novel scrapping
async function webnovel(link=false, path_novel=default_path()) {
    path_sanitize(path_novel)
    if(!link){throw new Error("You need to provide a valid Webnovel link")}

    const { browser, page } = await connect({
        headless: false,
        args: [],
        customConfig: {},
        turnstile: true,
        connectOption: {},
        disableXvfb: false,
        ignoreAllFlags: false,
    });

    await page.goto(link, {waitUntil:"load"});
    let name_novel = await page.evaluate(() => {
        let el = document.querySelector(".cha-page-in h2");
        return el ? el.textContent.trim().replace(/[^a-zA-Z\s]/g, '') : "Title was not Found";
    });

    //Selectors in the novel
    let paragraph_selector = '.cha-page-in p:not(.creators-thought)';
    let paragraph_loading = "strong.cha-hd-progress.j_progress.fr"
    if(!paragraph_selector){throw new Error("Selector was not Found, please contact with Tgthegood")};

    await webnovel_scroll(page, paragraph_selector, paragraph_loading);

    let content_webnovel = await page.evaluate(() => {
        let container = document.querySelector('.cha-page-in');
        if (!container) return null;

        let elements = container.querySelectorAll('h1, p:not(.creators-thought)');
        let content = '';

        elements.forEach(el => {
            let text = el.textContent?.trim();
            if (!text) return;

            text = text.replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ\u00A0-\uFFFF]/g, '');
            content += `${text}\n`;
        });
        return content;
    });
    if (!content_webnovel) {
        throw new Error("Content was not Found, please contact with Tgthegood");
    }

    console.log("\n\nWaiting for confirmation...");
    let final_path = path.join(path_novel, name_novel);
    try {
    fs.writeFileSync(final_path, content_webnovel, "utf-8");
    console.log(`${name_novel} was correctly scanned`);
        await browser.close();
    } catch (error) {
    console.error(`${name_novel} failed, reason not found`);
        await browser.close();
    }
};

module.exports = {
    webnovel
};