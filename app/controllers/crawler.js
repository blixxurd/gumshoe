module.exports = function(cheerio, request) {
	const reporter = "[CRAWLER]";
	const module = {};
	const url_list {
		discovered: [],
		crawled: []
	}


	let _runCrawlLoop = () => {
		//For Each Discovered
			//Send Request to the page
				//CrawlPage
					//Get Page Links
						//Repeat if discovered list is same size

	}

	let _getPageLinks = ($page) => {

	};

	let _crawlPage = (action) => new Promise(function(resolve, reject) {
		//Send request, and return the action with page data when complete.
	});

	//Revealed Modules
	module.findUrls = (data) => {
		console.log(reporter, "Hunting for URLs.");
		return _url_list;
	};

	return module;

};