const puppeteer = require('puppeteer');

/*
    Use npm to install package dependencies 
    Command to run: node Russell2KScraper.js

    This just prints the results and # of results right now
*/


const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));


(async function russel2KScraper() {
    const browser = await puppeteer.launch( {headless:false} );
    const page =  await browser.newPage();
    await page.goto('https://www.marketbeat.com/types-of-stock/russell-2000-stocks/');
    await page.select('#cphPrimaryContent_ddlResultCount', '-1');
    
    await delay(40000);
  
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

       // return el;
    })
    console.log(data);
    console.log(data.length);
    //console.log(data.length);
   // console.log(data.length);
    browser.close();
})(); 