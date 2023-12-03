const options = require("./data/options.json");

const fs = require('fs')


/*
    You need to download the options.json from the shared google drive folder
    and adjust the imported file paths accordingly
 */

function calculate(option, otherStrike) {
    // inputs

    // 0 is call, 1 is put
    // let position = 0;
    let strike = otherStrike ? otherStrike : option.strike;
    let bid = option.bid;
    let ask = option.ask;
    // 0 is call, 1 is put
    let position = option.position == "call" ? 0 : 1;


    let upper_limit;
    let i;
    let increment;
    // 30 because 30 is a good amount of data points for a graph
    let x_point = [];
    let call_point = [];
    let put_point = [];
    let short_call = [];
    let long_call = [];
    let short_put = [];
    let long_put = [];


    function x_axis() {
        increment = upper_limit / 30;
        let sum = increment;
        for (i = 0; i < 30; i++) {
            x_point[i] = sum;
            sum = sum + increment;
        }
    }

    function call_axis() {
        for (i = 0; i < 30; i++) {
            if (x_point[i] - strike > 0) {
                call_point[i] = x_point[i] - strike;
            }
            else {
                call_point[i] = 0;
            }
        }
    }

    function put_axis() {
        for (i = 0; i < 30; i++) {
            if (strike - x_point[i] > 0) {
                put_point[i] = x_point[i] - strike;
            }
            else {
                put_point[i] = 0;
            }
        }
    }

    function long_call_axis() {
        for (i = 0; i < 30; i++) {
            long_call[i] = call_point[i] - ask;
        }
    }

    function short_call_axis() {
        for (i = 0; i < 30; i++) {
            short_call[i] = bid - call_point[i];
        }
    }

    function long_put_axis() {
        for (i = 0; i < 30; i++) {
            long_put[i] = put_point[i] - ask;
        }
    }

    function short_put_axis() {
        for (i = 0; i < 30; i++) {
            short_put[i] = bid - put_point[i];
        }
    }

    upper_limit = strike * 2;
    x_axis();

    if (position == 0) {

        call_axis();
        long_call_axis();
        short_call_axis();

        x_point = x_point.map(x => Math.round(x * 1e2) / 1e2); //Math.round(someNumber * 1e2) / 1e2
        long_call = long_call.map(x => Math.round(x * 1e2) / 1e2);
        short_call = short_call.map(x => Math.round(x * 1e2) / 1e2);

        return {
            x: x_point,
            long: long_call,
            short: short_call
        }
    } else {

        put_axis();
        long_put_axis();
        short_put_axis();

        x_point = x_point.map(x => Math.round(x * 1e2) / 1e2);
        long_put = long_put.map(x => Math.round(x * 1e2) / 1e2);
        short_put = short_put.map(x => Math.round(x * 1e2) / 1e2);

        return {
            x: x_point,
            long: long_put,
            short: short_put
        }
    }
}

function sortPoints(rows) {

    // Sorting
    return rows.sort((a, b) => a.x - b.x);
}


function getPoints(opt) {
    return {
        x: opt.x,
        short: opt.short,
        long: opt.long
    };
}

function isK1(p1, p2) {
    // console.log(`Vals: ${p1.x[14]}, ${p2.x[14]}`)
    return p1.x[14] <= p2.x[14]
}

function getAverage(arr) {
    //console.log(arr)
    return arr.reduce((a, b) => a + b) / arr.length;
}

function getMaxAvg(arr) {
    arr = arr.sort((a, b) => b.average - a.average)
    return arr[0];
}

function combineBull(p1, p2) {
    let rows = [];
    let p1isK1 = isK1(p1, p2);


    for (i = 0; i < p1.x.length; i++) {

        if (i != 14) {
            rows.push({ x: p1.x[i], short_long: p1isK1 ? p1.long[i] : p1.short[i] })
            rows.push({ x: p2.x[i], short_long: p1isK1 ? p2.short[i] : p2.long[i] })
        } else {
            rows.push({ x: p1.x[i], short_long: p1isK1 ? p1.long[i] : p1.short[i], k: p1isK1 ? 1 : 2 })
            rows.push({ x: p2.x[i], short_long: p1isK1 ? p2.short[i] : p1.long[i], k: p1isK1 ? 2 : 1 })

        }
    }

    return rows;
}

function bullSpread(opt) {
    // Should be a CALL

    let points = getPoints(opt);
    let avgs = [];
    // K1 gets long k2 gets short
    options.forEach((o) => {

        let sorted60 = [];
        let p2 = getPoints(o)

        if (o.position == "call" && !o.bull) {
            sorted60 = combineBull(points, p2);
            sorted60 = sortPoints(sorted60);

            // iterate and get avg
            let flag = false;
            let temp = []
            for (i = 0; i < sorted60.length; i++) {
                if (sorted60[i].k && !flag) {
                    flag = true;
                }
                if (flag) {
                    temp.push(sorted60[i].short_long);
                }
                if (sorted60[i].k && flag) {
                    flag = false;
                    avgs.push({
                        average: getAverage(temp),
                        id: o.optionid
                    })
                }
            }
        }

    })
    let match = getMaxAvg(avgs);
    return match;
}

function combineBear(p1, p2) {
    let rows = [];
    let p1isK1 = isK1(p1, p2);

    for (i = 0; i < p1.x.length; i++) {

        if (i != 14) {
            rows.push({ x: p1.x[i], short_long: p1isK1 ? p1.short[i] : p1.long[i] })
            rows.push({ x: p2.x[i], short_long: p1isK1 ? p2.long[i] : p2.short[i] })
        } else {
            rows.push({ x: p1.x[i], short_long: p1isK1 ? p1.short[i] : p1.long[i], k: p1isK1 ? 1 : 2 })
            rows.push({ x: p2.x[i], short_long: p1isK1 ? p2.long[i] : p1.short[i], k: p1isK1 ? 2 : 1 })
        }
    }

    return rows;
}

function bearSpread(opt) {
    // Should be a CALL
    // Find the match
    let points = getPoints(opt);
    let avgs = [];
    // K1 gets long k2 gets short
    options.forEach((o) => {
        let sorted60 = [];
        let p2 = getPoints(o)

        if (o.position == "call" && !o.bear) {
            sorted60 = combineBear(points, p2);
            sorted60 = sortPoints(sorted60);

            // iterate and get avg
            let flag = false;
            let temp = [];
            for (i = 0; i < sorted60.length; i++) {
                if (sorted60[i].k == 1) {
                    flag = true;
                }
                if (flag) {
                    temp.push(sorted60[i].short_long);
                }
                if (sorted60[i].k == 2) {
                    flag = false;
                    avgs.push({
                        average: getAverage(temp),
                        id: o.optionid
                    })
                }
            }
        }

    })
    let match = getMaxAvg(avgs);
    return match;
}

// takes k1 put as p1 and k2 call as p2
function combineRiskReversal(p1, p2) {
    let rows = [];
    let k1;
    let k2;

    for (i = 0; i < p1.x.length; i++) {

        if (i != 14) {
            rows.push({ x: p1.x[i], short_long: p1.short[i] })
            rows.push({ x: p2.x[i], short_long: p2.long[i] })
        } else {
            console.log(`KS ${p1.x[i]}  ${p2.x[i]}`);

            k1 = { value: p1.x[i], col: 1 }
            k2 = { value: p2.x[i], col: 2 }
            rows.push({ x: p1.x[i], short_long: p1.short[i], k: 1 })
            rows.push({ x: p2.x[i], short_long: p1.long[i], k: 2 })


        }
    }
    console.log(rows)
    return rows;
}

function getRRResults(p, id) {
    let flag = false;
    let temp = [];
    let k1Index = 0;
    let distance;
    for (i = 0; i < p.length; i++) {
        if (p[i].k == 1) {
            flag = true;
            k1Index = i;
        }
        if (flag) {
            temp.push(p[i].short_long);
        }
        if (p[i].k == 2) {
            flag = false;
            return {
                average: getAverage(temp),
                difference: p[i].x - p[k1Index].x,
                id: id
            }
        }
    }
}

function riskReversal(opt) {
    let points = getPoints(opt);
    let distances = [];

    options.forEach((o) => {
        let sorted60 = [];
        let p2 = getPoints(o);

        // Opposites and not already matched
        if (o.position != opt.position && !o.riskreversal) {

            // if this option is k1 and put then get val
            if (isK1(points, p2) && opt.position == "put") {
                sorted60 = combineRiskReversal(points, p2); // takes k1 put as p1 and k2 call as p2
                sorted60 = sortPoints(sorted60); // Does it even need to be sorted bc only checking 
                distances.push(getRRResults(sorted60, o.optionid))

            } else if (!isK1(points, p2) && opt.position == "call") { // OK
                sorted60 = combineRiskReversal(p2, points);
                sorted60 = sortPoints(sorted60);
                distances.push(getRRResults(sorted60, o.optionid))
            }
            // otherwise it can't be matched
        }
    })
    if (distances.length == 0) {
        return "N/A"
    }
    console.log(distances)
    let arr = distances.sort((a, b) => b.difference - a.difference);
    return arr[0]
    // if (arr[0].difference == arr[1].difference) {
    //     // Tie, return max average
    //     return getMaxAvg(distances);
    // } else {
    //     return arr[0];
    // }

}

// p1 both long
function combineStraddleStrangle(p1, p2) {
    let rows = [];

    for (i = 0; i < p1.x.length; i++) {

        if (i != 14) {
            rows.push({ x: p1.x[i], short_long: p1.long[i] })
            rows.push({ x: p2.x[i], short_long: p2.long[i] })
        } else {
            rows.push({ x: p1.x[i], short_long: p1.long[i], k: isK1(p1, p2) ? 1 : 2 })
            rows.push({ x: p2.x[i], short_long: p2.long[i], k: isK1(p1, p2) ? 2 : 1 })
        }
    }
    return rows;

}

function straddleSpread(opt) {
    let points = getPoints(opt);
    let distances = [];

    options.forEach((o) => {
        let p = []
        let p2 = getPoints(o);

        if (o.position != opt.position && !o.straddle) {
            if (isK1(points, p2) && opt.position == "call" || !isK1(points, p2) && opt.position == "put") {
                p = combineStraddleStrangle(points, p2);
                p = sortPoints(p);
                let flag = false;
                let temp = [];
                let k1Index = 0;
                for (i = 0; i < p.length; i++) {
                    if (p[i].k == 1) {
                        flag = true;
                        k1Index = i;
                    }
                    if (flag) {
                        temp.push(p[i].short_long);
                    }
                    if (p[i].k == 2) {
                        flag = false;

                        distances.push({
                            average: getAverage(temp),
                            difference: Math.abs(p[i].short_long - p[k1Index].short_long),
                            id: o.optionid
                        });
                    }
                }
            }
        }
    })

    let sorted = distances.sort((a, b) => a.difference - b.difference);
    return sorted[0];
}

function strangleSpread(opt) {
    let points = getPoints(opt);
    let distances = [];

    let o = {
        x: [5.67, 11.33, 17, 22.67, 28.33, 34, 39.67, 45.33, 51, 56.67, 62.33, 68, 73.67, 79.33, 85, 90.67, 96.33, 102, 107.67, 113.33, 119, 124.67, 130.33, 136, 141.67, 147.33, 153, 158.67, 164.33, 170],
        long: [-1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, -1.48, 4.19, 9.85, 15.52, 21.19, 26.85, 32.52, 38.19, 43.85, 49.52, 55.19, 60.85, 66.52, 72.19, 77.85, 83.52],
        short: [1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 1.45, -4.22, -9.88, -15.55, -21.22, -26.88, -32.55, -38.22, -43.88, -49.55, -55.22, -60.88, -66.55, -72.22, -77.88, -83.55],
        position: "put"
    }

    //options.forEach((o) => {
    let p = []
    let p2 = getPoints(o);

    if (o.position != opt.position && !o.straddle) {
        if (isK1(points, p2) && opt.position == "call" || !isK1(points, p2) && opt.position == "put") {
            p = combineStraddleStrangle(points, p2);
            p = sortPoints(p);
            let flag = false;
            let temp = [];
            let k1Index = 0;
            for (i = 0; i < p.length; i++) {
                if (p[i].k == 1) {
                    flag = true;
                    k1Index = i;
                }
                if (flag) {
                    temp.push(p[i].short_long);
                }
                if (p[i].k == 2) {
                    flag = false;
                    distances.push({
                        average: getAverage(temp),
                        difference: 1,///Math.abs(p[i].x - p[k1Index].x), Not sure yet
                        id: o.optionid
                    });
                }
            }
        }
    }
    //  })

    let sorted = distances.sort((a, b) => a.difference - b.difference);
    return sorted[0];
}

// Long call first, long put second
function combineStrip(p1, p2) {
    let rows = [];

    for (i = 0; i < p1.x.length; i++) {

        if (i != 14) {
            rows.push({ x: p1.x[i], short_long: p1.long[i] })
            rows.push({ x: p2.x[i], short_long: 2 * p2.long[i] })
        } else {
            console.log(`KS ${p1.x[i]}  ${p2.x[i]}`);

            rows.push({ x: p1.x[i], short_long: p1.long[i], k: 1 })
            rows.push({ x: p2.x[i], short_long: 2 * p2.long[i], k: 2 })
        }
    }
    return rows;
}
// Long call first, long put second
function combineStrap(p1, p2) {
    let rows = [];

    for (i = 0; i < p1.x.length; i++) {

        if (i != 14) {
            rows.push({ x: p1.x[i], short_long: 2 * p1.long[i] })
            rows.push({ x: p2.x[i], short_long: p2.long[i] })
        } else {
            console.log(`KS ${p1.x[i]}  ${p2.x[i]}`);

            rows.push({ x: p1.x[i], short_long: 2 * p1.long[i], k: 1 })
            rows.push({ x: p2.x[i], short_long: p2.long[i], k: 2 })
        }
    }
    return rows;
}

function stripSpread(opt) {
    let points = getPoints(opt);
    let distances = [];

    options.forEach((o) => {
        let p = []
        let p2 = getPoints(o);

        if (o.position != opt.position && !o.straddle) {
            if (isK1(points, p2) && opt.position == "call" || !isK1(points, p2) && opt.position == "put") {
                p = isK1(points, p2) && opt.position == "call" ? combineStrip(points, p2) : combineStrip(p2, points);
                p = sortPoints(p);
                let flag = false;
                let temp = [];
                let k1Index = 0;
                for (i = 0; i < p.length; i++) {
                    if (p[i].k == 1) {
                        flag = true;
                        k1Index = i;
                    }
                    if (flag) {
                        temp.push(p[i].short_long);
                    }
                    if (p[i].k == 2) {
                        flag = false;
                        distances.push({
                            average: getAverage(temp),
                            difference: 1,///Math.abs(p[i].x - p[k1Index].x), Not sure yet
                            id: o.optionid
                        });
                    }
                }
            }
        }
    })
}

function strapSpread(opt) {
    let points = getPoints(opt);
    let distances = [];

    options.forEach((o) => {
    let p = []
    let p2 = getPoints(o);

    if (o.position != opt.position && !o.straddle) {
        if (isK1(points, p2) && opt.position == "call" || !isK1(points, p2) && opt.position == "put") {
            p = isK1(points, p2) && opt.position == "call" ? combineStrip(points, p2) : combineStrip(p2, points);
            p = sortPoints(p);
            let flag = false;
            let temp = [];
            let k1Index = 0;
            for (i = 0; i < p.length; i++) {
                if (p[i].k == 1) {
                    flag = true;
                    k1Index = i;
                }
                if (flag) {
                    temp.push(p[i].short_long);
                }
                if (p[i].k == 2) {
                    flag = false;
                    distances.push({
                        average: getAverage(temp),
                        difference: 1,///Math.abs(p[i].x - p[k1Index].x), Not sure yet
                        id: o.optionid
                    });
                }
            }
        }
    }
      })
}

function main() {

    options.forEach(opt => {
        let res = calculate(opt);
        opt.x = res.x;
        opt.long = res.long;
        opt.short = res.short;
    })


    options.forEach((opt) => {

        // Getting bull spread
        // if (opt.position == "call" && !opt.bull) {
        //     let bull = bullSpread(opt);
        //     let matchStrike;
        //         if (bull) {
        //     options.map((o) => {
        //         if (o.optionid == bull.id) {
        //             o.bull = {
        //                 id: opt.optionid,
        //                 axes: calculate(o, opt.strike + o.strike / 2)
        //             }
        //             matchStrike = o.strike;
        //         }
        //     })
        //   
        //         opt.bull = {
        //             id: bull.id,
        //             axes: calculate(opt, opt.strike + matchStrike / 2)
        //         }
        //     }
        // }
        // Getting Bear Spread 
        // if (opt.position == "call" && !opt.bear) {
        //     let bear = bullSpread(opt);
        //     let matchStrike;
        //      if (bear) {
        //     options.map((o) => {
        //         if (o.optionid == bear.id) {
        //             o.bear = {
        //                 id: opt.optionid,
        //                 axes: calculate(o, opt.strike + o.strike / 2)
        //             }
        //             matchStrike = o.strike;
        //         }
        //     })
        //     
        //         opt.bear = {
        //             id: bear.id,
        //             axes: calculate(opt, opt.strike + matchStrike / 2)
        //         }
        //     }
        // }

        // Straddle Spread
        if (!opt.straddle) {
            let straddle = straddleSpread(opt);
            let matchStrike;
            if (straddle) {
                options.map((o) => {
                    if (o.optionid == straddle.id) {
                        o.straddle = {
                            id: opt.optionid,
                            axes: calculate(o, opt.strike + o.strike / 2)
                        }
                        matchStrike = o.strike;
                    }
                })
                opt.straddle = {
                    id: straddle.id,
                    axes: calculate(opt, opt.strike + matchStrike / 2)
                }
            }
        }

        // Strap Spread
        if (!opt.strap) {
            let strap = strapSpread(opt);
            let matchStrike;
            if (strap) {
                options.map((o) => {
                    if (o.optionid == strap.id) {
                        o.strap = {
                            id: opt.optionid,
                            axes: calculate(o, opt.strike + o.strike / 2)
                        }
                        matchStrike = o.strike;
                    }
                })
                opt.strap = {
                    id: strap.id,
                    axes: calculate(opt, opt.strike + matchStrike / 2)
                }
            }
        }

        // Strip Spread
        if (!opt.strip) {
            let strip = stripSpread(opt);
            let matchStrike;
            if (strip) {
                options.map((o) => {
                    if (o.optionid == strip.id) {
                        o.strip = {
                            id: opt.optionid,
                            axes: calculate(o, opt.strike + o.strike / 2)
                        }
                        matchStrike = o.strike;
                    }
                })
                opt.strip = {
                    id: strip.id,
                    axes: calculate(opt, opt.strike + matchStrike / 2)
                }
            }
        }



        // // options.map(o => {
        // //     if (o.optionid = match.id)
        // //         o.bull = {
        // //             id: match.id
        // //     }
        // // })
    })

    i1 = {
        x: [2.67, 5.33, 8, 10.67, 13.33, 16, 18.67, 21.33, 24, 26.67, 29.33, 32, 34.67, 37.33, 40, 42.67, 45.33, 48, 50.67, 53.33, 56, 58.67, 61.33, 64, 66.67, 69.33, 72, 74.67, 77.33, 80],
        long: [-0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, -0.04, 2.63, 5.29, 7.96, 10.63, 13.29, 15.96, 18.63, 21.29, 23.96, 26.63, 29.29, 31.96, 34.63, 37.29, 39.96],
        short: [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, -2.65, -5.31, -7.98, -10.65, -13.31, -15.98, -18.65, -21.31, -23.98, -26.65, -29.31, -31.98, -34.65, -37.31, -39.98],
        position: "call"
    }



    // let points2 = {
    //     x: res2.x,
    //     long: res2.long,
    //     short: res2.short,
    //     position: options[1].position == "call" ? 0 : 1 
    // }

    // let r = bullSpread(i1);
    // let r2 = bearSpread(i1);
    // console.log(r);
    // console.log(r2);
    //let r4 = straddleSpread(i1);
    //console.log(r4);


    //let r3 = riskReversal(i1);
    // console.log(r3);
    //console.log(options)
    fs.writeFile("./data/test.json", JSON.stringify(options), err => {
        if (err) {
            console.log("Error writing to file");
        } else {
            console.log("Successfully written to /data/test.json");
        }
    })
    return options;
}

main();
