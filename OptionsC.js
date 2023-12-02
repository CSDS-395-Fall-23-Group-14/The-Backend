const options = require("./options.json");

/*
    You need to download the options.json from the shared google drive folder
    and adjust the imported file paths accordingly
 */

function calculate(option) {
    // inputs
    
    // 0 is call, 1 is put
   // let position = 0;
    let strike = option.strike;
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

        x_point = x_point.map(x => x.toFixed(2));
        long_call = long_call.map(x => x.toFixed(2));
        short_call = short_call.map(x => x.toFixed(2));

        return {
            x: x_point,
            long: long_call,
            short: short_call
        }
    } else {

        put_axis();
        long_put_axis();
        short_put_axis();

        x_point = x_point.map(x => x.toFixed(2));
        long_put = long_put.map(x => x.toFixed(2));
        short_put = short_put.map(x => x.toFixed(2));

        return {
            x: x_point,
            long: long_put,
            short: short_put
        }
    }
}

function detectChange(points) {
    // set initial state of consistent
    // similar consecutives = true; diff consecutives = false;
    let consistent = (points[0] === points[1]); 
    for (let i = 1; i < points.length - 1; i++){
        if (consistent && points[i] !== points[i+1]) {
            consistent = false;
            return i;
        }
        else if (!consistent && points[i] === points[i+1]){
            consistent = true;
            return i;
        }
    } 

    // no change found
    return -1;
}

function main() {

    options.forEach(opt => {
        let res = calculate(opt);
        opt.x_point = res.x;
        opt.long = res.long;
        opt.short = res.short;
        let lc = detectChange(res.long);
        let sc = detectChange(res.short);
        console.log(opt);
        console.log(lc);
        console.log(sc);
    })

    
    return options;
}

main();
