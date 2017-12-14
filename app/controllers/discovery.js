module.exports = function(cheerio, request) {
	const module = {};
	const URL = require('./url')(cheerio, request);

	//Revealed Modules
	module.crawl = (url) => {
		console.log(URL.getUrlData(url));
	};

	return module;

};