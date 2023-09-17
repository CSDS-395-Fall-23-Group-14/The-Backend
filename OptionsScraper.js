const puppeteer = require('puppeteer');


/**
 * Scrapes options data from the yahoo link and prints to terminal
 * Run npm install to get dependencies
 * Rune node OptionsScraper.js to run the script
 * 
 * 
 * //*[@id="scr-res-table"]/div[2]/button[3]
 * //*[@id="scr-res-table"]/div[2]/button[3]
 * 
 * 
 */

async function optionsScraper() {
    const browser = await puppeteer.launch( {headless:false} );
    const page = await browser.newPage();
    await page.goto('https://finance.yahoo.com/options/highest-open-interest/?count=100');


    const data = await page.evaluate(function () {

        const tbody = document.querySelector("tbody");

        const rows = Array.from(tbody.querySelectorAll("tr"));

        let stonks = [];
        for (i=0;i<rows.length;i++) {
            const tds = Array.from(rows[i].querySelectorAll("td"));
            const cols = tds.map((td) => td.innerText);
            stonks.push(
                {
                    linkthing: cols[0],
                    symbol: cols[1],
                    name: cols[2],
                    strike: cols[3],
                    expiration: cols[4],
                    intradayprice: cols[5],
                    change: cols[6],
                    percentchange: cols[7],
                    bid: cols[8],
                    ask: cols[9],
                    volume: cols[10],
                    openinterest: cols[11] 
                }
            )
        }

        return stonks;
    });

    browser.close();
    console.log(data[0]);
    console.log(`Number of records: ${data.length}`);
}

optionsScraper();