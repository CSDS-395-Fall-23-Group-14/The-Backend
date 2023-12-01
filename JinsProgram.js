const financials = require("./data/financials.json");
const stocks = require('./data/stocks.json');
const fs = require('fs')

let nans = 0;
let num = 0;
let apl = 0;
let dc = 0;
let dw = 0;
let wc = 0;
let noSO=0;
function calculate(company, price) {

	const PERIODS = 5;

	// Conservative assumptions, low fluctuations;
	let beta = 1;
	let terminal_growth = .03;

	// 10/15/2023 Data on share price & U.S.10 Year Treasury Note
	let risk_free = .04627;
	let share_price = price; // From stocks

	// current year (end of fiscal year 2022 annual report)
	// From financials

	let ebit = company.EBIT;
	let tax = company.Tax ? company.Tax : 0;
	let depreciation = company.Depreciation ? company.Depreciation : 1;
	let ppe = company.PPE ? company.PPE : 0;
	let ar = company.AR ? company.AR : 0;
	let inventory = company.Inventory ? company.Inventory : 0;
	let ap = company.AP ? company.AP : 0;
	let cash = company.Cash ? company.Cash : 0;

	let debt = !company.Debt && !company.InterestExpense ? 1 : company.Debt;
	let interestExpense = company.InterestExpense ? company.InterestExpense : 0;
	let eps = company.EPS;
	let sharesOutstanding = company.SharesOutstanding;

	// previous year (end of fiscal year 2021 annual report)
	let py_ebit = company.PY_EBIT ? company.PY_EBIT : 0;
	let py_ppe = company.PY_PPE ? company.PY_PPE : 1;
	let py_ar = company.PY_AR ? company.AR : 0;
	let py_inventory = company.PY_Inventory ? company.PY_Inventory : 0;
	let py_ap = company.PY_AP ? company.PY_AP : 0;
	// end financials
	// forecast variables
	let tax_rate;
	let ebit_growth;
	let depreciation_rate;
	let risk_premium;
	let capex;
	let capex_ratio;
	let nwc;
	let nwc_ratio;

	// discount rate variables
	let market_cap;
	let wacc;

	// unlevered free cash flow variables
	let ufcf_val = []; // Array of 5
	let ufcf_sum = 0;
	let ufcf_pv_val = []; // Array of 5
	let ufcf_pv_sum = 0;

	// enterprise value variables
	let terminal_val;
	let terminal_val_pv;
	let enterprise_val;

	// implied price variables
	let implied_equity_val;
	let intrinsic_val;

	function forecast() {
		// calculates tax rate from current year operating income 
		tax_rate = tax / ebit;
		if (isNaN(tax_rate)) {tax_rate = 0;}
		
		// calculates growth in gross profit for cash flow forecast
		ebit_growth = ebit / py_ebit;
		if (isNaN(ebit_growth)) {ebit_growth = 0;}

		// calculates depreciationciation percent
		depreciation_rate = depreciation / py_ppe;
		if (isNaN(depreciation_rate)) {depreciation_rate = 0;}
		// calculates capital expenditures from fixed assets also known as Property, Plant, and Equipment (ppe)
		capex = ppe - py_ppe + depreciation;
		if (isNaN(capex)) { capex = 0;}
		
		// calculates the ratio of capital expenditures to gross profit
		capex_ratio = capex / ebit;
		if (isNaN(capex_ratio)) {capex_ratio = 0}
		// calculates net working capital
		nwc = (ar + inventory - ap) - (py_ar + py_inventory - py_ap);
		if (isNaN(nwc)) {nwc = 0;}

		nwc_ratio = nwc / ebit;
		if (isNaN(nwc_ratio)) {nwc_ratio = 0}
		// calculates market risk premium using the earning based approach
		risk_premium = eps / share_price;
		if(isNaN(risk_premium)) {risk_premium = 0;}
	}

	// discount rate using weighted average cost of capital (wacc)
	function discount_rate() {
		let debt_c;
		let equity_c;
		let debt_w;
		let equity_w;

		// market capitalization
		market_cap = share_price * sharesOutstanding;

		// cost of debt & weight of debt
		debt_c = interestExpense / debt;

		debt_w = debt / (market_cap + debt);

		// cost of equity & weight of equity
		equity_c = beta * risk_premium + risk_free;
		
		equity_w = market_cap / (market_cap + debt);
		//wacc = discount rate
		wacc = equity_w * equity_c + debt_w * debt_c * (1 - tax_rate);

		if (isNaN(debt_c)) {
			dc++;
		}
		if (isNaN(debt_w)) {
			dw++;
		}
		if (isNaN(wacc)) {
			wc++;
		}
	}

	// unlevered free cash flow
	function ufcf() {
		let ebit_forecast;
		let tax_forecast;
		let capex_forecast;
		let depreciation_forecast;
		let ppe_forecast = ppe;
		let nwc_forecast_1 = nwc;
		let nwc_forecast_2;

		var count = 1;
		while (count <= PERIODS) {
			// cash flow by period
			ebit_forecast = ebit * Math.pow(ebit_growth, count);
			tax_forecast = (ebit * Math.pow(ebit_growth, count) * tax_rate);
			capex_forecast = capex_ratio * ebit_forecast;
			depreciation_forecast = depreciation_rate * ppe_forecast;
			ppe_forecast = ppe_forecast + capex_forecast - depreciation_forecast;
			nwc_forecast_2 = ebit_forecast * nwc_ratio;
			let nwc_change = nwc_forecast_2 - nwc_forecast_1;
			nwc_forecast_1 = nwc_forecast_2;

			// ufcf
			ufcf_val[count - 1] = ebit_forecast - tax_forecast - capex_forecast - nwc_change + depreciation_forecast;

			// ufcf sum
			ufcf_sum = ufcf_sum + ufcf_val[count - 1];

			// ufcf present value (pv)
			ufcf_pv_val[count - 1] = ufcf_val[count - 1] / (Math.pow((1 + wacc), count));

			// ufcf pv sum
			ufcf_pv_sum = ufcf_pv_sum + ufcf_pv_val[count - 1];

			count += 1;
		}
	}

	// enterprise value using the perpetual growth model
	function enterprise_value() {
		// terminal value for last year cash flow		
		terminal_val = (ufcf_val[PERIODS - 1] * (1 + terminal_growth)) / (wacc - terminal_growth);

		// terminal value present value
		terminal_val_pv = terminal_val / Math.pow((1 + wacc), PERIODS);

		// enterprise value by adding terminal pv and ufcf pv sum
		enterprise_val = terminal_val_pv + ufcf_pv_sum;
	}

	function implied_share_price() {
		// implied equity value taking out debt and adding cash 
		implied_equity_val = enterprise_val - debt + cash;
		if (sharesOutstanding ==0) {
			noSO++;
		}
		// instrinsic value through implied share price
		intrinsic_val = implied_equity_val / sharesOutstanding;
	}

	forecast();
	discount_rate();
	ufcf();
	enterprise_value();
	implied_share_price();

	//printf("%f \n", intrinsic_val);
	//console.log(`Intrinsic Value: ${intrinsic_val}`);
	if (isNaN(intrinsic_val)) {
		nans++;
	} else {
		num++;
	}
	if (intrinsic_val < 1 && intrinsic_val >= 0) {
		console.log(intrinsic_val);
	}
	return intrinsic_val;


}

function writeStonks(newStocks) {
	fs.writeFile("./data/stocks.json", JSON.stringify(newStocks), err => {
		if (err) {
			console.log("ERROR WRITING TO FILE");
		} else {
			console.log("SUCCESSFULLY WRITTEN");
		}
	})
}


function main() {

	let matches = 0;
	let doublematches = 0;
	let nomatches = 0;
	let none = [];
	let dm = [];

	stocks.forEach(stock => {
		const company = financials.filter(fin => {
			let temp = stock.companyname
			if (stock.companyname.toUpperCase().includes(" CLASS")) {
				let index = stock.companyname.indexOf(" CLASS");
				temp = stock.companyname.slice(0, index);
			}
			return temp.toUpperCase() == fin.companyname.toUpperCase()
		})
		// end filter

		if (company != [] && company.length >= 1) {
			//console.log("COMPANY FOUND BITCH");
			matches++;
			if (company.length > 1) {
				doublematches++;
				company.forEach(c => dm.push(c.companyname));
			}

			// HAVE MATCHES: TAKE FIRST ONE [INDEX 0] AND PASS TO FUNCTION TO GET INTRINSIC VALUE!
			let iv = calculate(company[0], stock.currentprice);
			if (iv==null) 
			{
				console.log(stock.companyname)
			}
			if (isNaN(iv)) {
				stock.intrinsic_val = "N/A";
			} else if (!isFinite(iv)) {
				stock.intrinsic_val = "N/A"
			} else {
				stock.intrinsic_val = iv;
			}

			


			if (stock.companyname == "NVIDIA CORP") {
				console.log("NVIDIA");
				apl = iv;
			} 
				
				
		}
		else {
			nomatches++;
			none.push(stock.companyname)
			stock.intrinsic_val = "N/A"
		}
	})

	writeStonks(stocks);
	console.log("some stats for me")
	console.log(`Matches: ${matches}`);
	console.log(`Double Matches: ${doublematches}`);
	console.log(`Unmatched: ${nomatches}`);
	console.log(`NaNs: ${nans}`);
	console.log(`Vals Calced: ${num}`);
	console.log(`Apple's Val: ${apl}`);
	console.log(`debt_c: ${dc}`);
	console.log(`debt_w: ${dw}`);
	console.log(`wacc: ${wc}`);
	console.log(`SharesOut: ${noSO}`);
}

main();
