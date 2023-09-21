const puppeteer = require('puppeteer');

/*
    Use npm to install package dependencies 
    Uncomment printRussell2K function or betterSite function calls at bottom of file
    Command to run: node Russell2KScraper.js

    This just prints the results and # of results right now
*/

module.exports = { russel2KScraper, betterSite };

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));


async function russel2KScraper() {
    const browser = await puppeteer.launch( {headless:false} );
    const page =  await browser.newPage();
    await page.goto('https://www.marketbeat.com/types-of-stock/russell-2000-stocks/');
    await page.select('#cphPrimaryContent_ddlResultCount', '-1');
    
    await delay(30000);
  
    const data = await page.evaluate(async function () {
        
        //const events = document.querySelectorAll("tr");
        const tbody = document.querySelector("tbody");
       // const rows = tbody.querySelectorAll("tr");
         const rows = Array.from(
        tbody.querySelectorAll("tr")
        );
     
        const realRows = rows.filter(element => !(element.classList.contains("bottom-sort")));
        let stocks = []
        for (i=0;i<realRows.length;i++) {
            const tds = Array.from(realRows[i].querySelectorAll("td"));
            const lastly = tds.map((td) => td.innerText);
            var name = lastly[0].split("\n");
            stocks.push(
                {
                    ticker: name[0],
                    company: name[1],
                    currentprice: lastly[1],
                    PERatio: lastly[2],
                    MarketCap: lastly[3],
                    Volume: lastly[4],
                    AvgVolume: lastly[5]
                }
            )
        } 
        return stocks;
    })
    browser.close();

    return data;
};


async function printRussell2K() {
    const russell = await russel2KScraper();
    console.log(russell);
    console.log(`Number of records: ${russell.length}`);
}


async function betterSite() {
    const browser = await puppeteer.launch( {headless:false} );
    const page = await browser.newPage();
    await page.goto('https://www.ishares.com/us/products/239710/ishares-russell-2000-etf');
    await delay(1000);

    // Accept the cookies
    const [cookies] = await page.$x('/html/body/div[2]/div[2]/div/div/div[2]/div/div/button[2]');
    await delay(500);
    
    await cookies.click();
    
    await delay(500);

    // click show more
    const [loadMore] = await page.$x('/html/body/div[1]/div[2]/div/div/div/div/div/div[13]/div/div/div/div[1]/div[1]/div[1]/div[2]/div[2]/div[3]/a');
    await loadMore.click();
    await delay(1000);

    
    const data = await page.evaluate(function () {
        const table = document.querySelector("#allHoldingsTable");
        const body = table.querySelector("tbody");
        const rows = Array.from(body.querySelectorAll("tr")); 
        const stocks = [];
        for (i = 0; i<rows.length;i++) {
            const tds = Array.from(rows[i].querySelectorAll("td"));
            const cols = tds.map((td) => td.innerText);
            stocks.push(
                {
                    ticker: cols[0],
                    companyname: cols[1],
                    sector: cols[2],
                    assetclass: cols[3],
                    marketvalue: cols[4],
                    weight: cols[5],
                    notionalvalue: cols[6],
                    shares: cols[7],
                    cuspid: cols[8],
                    isin: cols[9],
                    sedol: cols[10],
                    accrualdate: cols[11]
                }
            );
        }
        return stocks;
        
    }); 

    browser.close();
    return data;
}

async function printBetterStocks() {
    const stocks = await betterSite();
    console.log(stocks);
    console.log(`Number of records: ${stocks.length}`);
}

//printRussell2K();
//printBetterStocks();