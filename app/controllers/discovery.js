module.exports = function(cheerio, request) {
	const reporter = "[DISCOVERY]";
	const module = {};
	const URL = require('./url')(cheerio, request);
	const CRAWLER = require('./crawler')(cheerio, request);

	//Revealed Modules
	module.crawl = (url) => {
		return new Promise(function(resolve, reject) {
			console.log(reporter, 'Initiating domain data discovery.');
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
			console.log(reporter, 'Initiating URL List Discovery.');
			CRAWLER.findUrls(function(url_list) {
				console.log(reporter, 'Successfully processed discovery crawl.');
				resolve(url_list);
			});
		});
	};

	return module;

};