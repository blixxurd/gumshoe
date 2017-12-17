module.exports = function(cheerio, request) {
	const module = {};
	const URL = require('./url')(cheerio, request);

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

	return module;

};