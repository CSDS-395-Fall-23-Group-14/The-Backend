const puppeteer = require('puppeteer');
const r2k = require('./Russell2KScraper');


/**
 * 
 * Scrapes options data from the yahoo link and prints to terminal
 * Run npm install to get dependencies
 * Uncomment the function you want to run from the bottom
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
                    position: cols[2].slice(-4).replace(" ", ""),
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
    await delay(750);
    }
    browser.close();
    
    return stonks;
}

async function optionsPart2() {
    const browser = await puppeteer.launch( {headless:false} );
    const page = await browser.newPage();

    const url = 'https://finance.yahoo.com/options/highest-open-interest/?count=100&offset=';
    var offset = 0;
    var flag = true;
    let stocks = []

    while (flag) {
        await page.goto(url + offset);

        const data = await page.evaluate(async function () {

            const tbody = document.querySelector("tbody");
    
            const rows = Array.from(tbody.querySelectorAll("tr"));
            let tempStonks = [];
            for (i=0;i<rows.length;i++) {
                const tds = Array.from(rows[i].querySelectorAll("td"));
                const cols = tds.map((td) => td.innerText);
                //position - put or call from name
                tempStonks.push(
                    {
                        linkthing: cols[0],
                        symbol: cols[1],
                        name: cols[2],
                        position: cols[2].slice(-4).replace(" ", ""),
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
            console.log(tempStonks[0])
            return tempStonks;
        });
    
         // Check for last page
        if (data.length != 100) {
            flag = false;
        }
        offset += 100;
        console.log(data[1]);
        stocks = [...data, ...stocks];
        
       await delay(2304);
    }

    console.log("Closing");
    await delay(100);

    await browser.close();
    return stocks;
    
}

async function printSomeOptions() {
    const options = await optionsScraper();
    
    let count = 0;
    options.forEach(opt => {
        if (count == 0) {
            console.log(opt);
        } else if (count == 300) {
            count = 0;
        }
        count++;
    })

    console.log(`Number of records: ${options.length}`);

}

async function filterStocks () {

    const russell = await r2k.betterSite();
    const options = await optionsPart2();

    console.log("Thinking...");

   const res = options.filter(opt => {
    let temp = russell.filter(russ => russ.ticker == opt.symbol);
    return temp.length > 0;
    } ) 

    console.log("Getting results...")

    console.log(res);

}

//printSomeOptions();
//filterStocks();
optionsPart2();