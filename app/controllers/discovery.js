module.exports = function(cheerio, request) {
	const module = {};
	const URL = require('./url')(cheerio, request);
	const CRAWLER = require('./crawler')(cheerio, request);

	//Revealed Modules
	module.crawl = (url) => {
		return new Promise(function(resolve, reject) {
			// Do async job
			URL.getUrlData(url, function(res) {
				if(res.error) {
					reject(res.error);
				} else {
					resolve(res);
				}
			});
		})
	};

	module.getAllUrls = (host_data) => {
		return new Promise(function(resolve, reject) {
			resolve(CRAWLER.findUrls(host_data));
		});
	};

	return module;

};