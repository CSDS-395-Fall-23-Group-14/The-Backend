const puppeteer = require('puppeteer');


/**
 * 
 * Scrapes options data from the yahoo link and prints to terminal
 * Run npm install to get dependencies
 * Rune node OptionsScraper.js to run the script
 * 
 */



const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));


async function optionsScraper() {
    const browser = await puppeteer.launch( {headless:false} );
    const page = await browser.newPage();
    await page.goto('https://finance.yahoo.com/options/highest-open-interest/?count=100&offset=0');


    let flag = true;
    let stonks = [];
    while (flag) {

    
    const data = await page.evaluate(async function () {

        const tbody = document.querySelector("tbody");

        const rows = Array.from(tbody.querySelectorAll("tr"));
        let tempStonks = [];
        for (i=0;i<rows.length;i++) {
            const tds = Array.from(rows[i].querySelectorAll("td"));
            const cols = tds.map((td) => td.innerText);
            tempStonks.push(
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
        
        return tempStonks;
    });

     // Check for last page
    if (data.length != 100) {
        flag = false;
    }

    stonks = [...data, ...stonks];



    const [next] = await page.$x('//*[@id="scr-res-table"]/div[2]/button[3]');

    await next.click();
    await delay(1000);
    console.log(stonks[0]);
    }
    browser.close();
    //console.log(stonks[]);
    console.log(`Number of records: ${stonks.length}`);
}

optionsScraper();