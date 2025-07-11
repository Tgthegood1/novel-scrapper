let { connect } = require("puppeteer-real-browser");
let path = require("path")
let fs = require('fs');


function support_message() {
  console.log(`
  ⭐ If you find this module useful, consider supporting me! ⭐
  ☕ Buy Me a Coffee: https://buymeacoffee.com/almeidaaxep  
  💖 Patreon:         https://patreon.com/Tgthegood52
  `);
}

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
    throw new Error(`The path does not Exist: ${sanitized}, Example C:/user/pathToNovel`);
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
    support_message()
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
        return el
            ? el.textContent
                .trim()
                .replace(/[*?"<>|:/\\]/g, '')
                .replace(/[\u0000-\u001F]/g, '')
            : "Title was not Found";
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
    let final_path = path.join(path_novel, `${name_novel}.txt`);
    try {
    fs.writeFileSync(final_path, content_webnovel, "utf-8");
    console.log(`${name_novel} was correctly scanned on ${final_path}`);
        await browser.close();
    } catch (error) {
    console.error(`${name_novel} failed, reason not found`);
        await browser.close();
    }
};


//Init FanMtl functions
async function fanmtl(link=false, path_novel=default_path(), ublock=false) {
    support_message()
    path_sanitize(path_novel)
    if(!link){throw new Error("You need to provide a valid FanMtl link")}
    if(!link.includes("1.html")){throw new Error("Youn need to provide the link of the Chapter 1")}
    if(!ublock){throw new Error("You need to provide a valid Ublock Origin Path, Example C:/user/pathUblock")}

    const { browser, page } = await connect({
        headless: false,
        args: [
            '--disable-extensions-except=' + ublock,
            '--load-extension=' + ublock,
        ],
        customConfig: {},
        turnstile: true,
        connectOption: {},
        disableXvfb: false,
        ignoreAllFlags: false,
    });

    await page.goto(link, {waitUntil:"load"});

    let name_novel = await page.evaluate(() => {
        let el = document.querySelector("div.content-wrap div.titles h1 a");
        return el
            ? el.getAttribute("title")
                .trim()
                .replace(/[*?"<>|:/\\]/g, '')
            : "Title was not Found";
    });

    let content_fanmtl = ""
    let i = 1
    while(true){
        let chapter_selector = await page.$(".chapter-content");

        if(chapter_selector){
            let chapter_content = await page.evaluate(() => {
                let content = document.querySelector(".chapter-content");
                if (!content) return '';

                let chapter_trash = content.querySelectorAll("script, div, iframe, .ob-smartfeed-wrapper");
                chapter_trash.forEach(a => a.remove());

                let chapter_elements = Array.from(content.querySelectorAll("p"));
                let chapter_sanitize = chapter_elements.filter(el => el.textContent.trim().length > 0);

                if (chapter_sanitize.length > 0) {
                    let chapter_set = new Set(chapter_sanitize.map(el => el.textContent.trim()));
                    return Array.from(chapter_set).join("\n");
                } else {
                    let chapter_alternative = content.innerHTML.replace(/<br\s*\/?>/gi, '\n').trim();
                    return chapter_alternative;
                }
            });
            content_fanmtl += chapter_content+'\n';
            process.stdout.write(`\rChapter: ${i} Obtained`);
            i+=1

            let chapter_next_button = await page.$(".nextchap");
                if (chapter_next_button) {
                    let click_succes = false;
                    for (let attempt = 0; attempt < 5; attempt++) {
                        try {
                            await Promise.all([
                                chapter_next_button.click(),
                                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
                            ]);
                            await sleep_seconds(1)
                            click_succes = true;
                            break;
                        } catch (error) {}
                    }
                    if (!click_succes) {
                        break;
                    }
                } else {break}
        }
    }

    console.log("\n\nWaiting for confirmation...");
    let final_path = path.join(path_novel, `${name_novel}.txt`);
    try {
        fs.writeFileSync(final_path, content_fanmtl, "utf-8");
        console.log(`${name_novel} was correctly scanned on ${final_path}`);
        await browser.close();
    } catch (error) {
        console.error(`${name_novel} failed, reason not found`);
        await browser.close();
    }
}


module.exports = {
    webnovel,
    fanmtl,
};