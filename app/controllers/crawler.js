module.exports = function(cheerio, request) {
	const reporter = "[CRAWLER]";
	const url_tool = require('url');
	const module = {};
	const url_list = {
		discovered: [],
		started: [],
		crawled: []
	};

	let _isRelativeUrl = (url) => {
		var absolute = /^https?:\/\/|^\/\//i;
		return absolute.test(url) ? false : true;
	};

	let _isProperDomain = (url) => {
		let _root = url_tool.parse(global.config.root_domain).hostname;
		let _crawled = url_tool.parse(url).hostname;
		return (_root == _crawled) ? true : false;
	};

	let _isPristine = (url) => {
		return (url_list.discovered.length == 0 && url_list.started.length == 0  && url_list.crawled.length == 0) ? true : false;
	};

	let _checkArray = (url, arr) => {
		return {exists: (arr.indexOf(url) > -1 ? true : false), index: arr.indexOf(url)};
	};

	let _removeFromArray = (url, arr) => {
		let index = arr.indexOf(url);
		if (index > -1) {
			arr.splice(index, 1);
		}
	}

	let _notYetFound = (url) => {
		return (!_checkArray(url, url_list.started).exists && !_checkArray(url, url_list.crawled).exists && !_checkArray(url, url_list.discovered).exists);
	}

	let _getPageLinks = ($, url) => {
		let links = [],
				link_count = $('a').length;
		console.log(reporter, `Found ${link_count} links on page.`);
		$('a').each(function(i, ele) {
			let l = $(this).attr('href');
			if(typeof l == "string") {
				if(_isRelativeUrl(l)) {
					l = url_tool.resolve(url, l);
				}
				if(_notYetFound(l) && _isProperDomain(l)) {
					links.push(l);
				}
			}
		});
		console.log(reporter, `Adding ${links.length} newly discovered links to URL List.`);
		return links;
	};

	let _crawlPage = (url, action) => {
		return new Promise(function(resolve, reject) {
			let rq_config =  global.config.request;
					rq_config.uri = url;
			console.log(reporter, `Starting Page Crawl on ${rq_config.uri}`);
			request(rq_config, function(error, response, body){
				if(error) {
					console.log(reporter, `Crawl request failed on url : ${rq_config.uri} -- ${error}`);
					reject(error);
				} else {
					$page = cheerio.load(body);
					console.log(reporter, `Successful page crawl. Resolving to action.`);
					resolve(action($page, url));
				}
			});
		});
	}

	let _runCrawlLoop = (callback) => {
		url_list.discovered.forEach(function(e) {
			//Send Request to the page
			if(url_list.started.length > 5) {
				console.log(reporter, `Crawl Limit Hit. Sleeping for 5 seconds...`)
				setTimeout(() => {
					_runCrawlLoop();
				}, interval)
			} else if((!_checkArray(e, url_list.started).exists && !_checkArray(e, url_list.crawled).exists) || _isPristine) {
				console.log(reporter, "PASSED CRAWL LIST");
				_removeFromArray(e, url_list.discovered);
				url_list.started.push(e);

				_crawlPage(e, _getPageLinks).then(function(links) {
					_removeFromArray(e, url_list.started);
					url_list.crawled.push(e);
					for (var i = links.length - 1; i >= 0; i--) {
						if(_notYetFound(links[i])) {
							url_list.discovered.push(links[i]);
						}
					}
					if(url_list.discovered.length > 0) {
						_runCrawlLoop();
					}
					if(typeof callback == 'function' && url_list.discovered.length==0) {
						//Done...
						callback();
					}
				}).catch(function(err) {
					url_list.discovered.push(e);
				});

			} else {
				console.log(reporter, 'Unhandled Scenario');
				callback();
			}

		});
			//Send Request to the page
				//CrawlPage
					//Get Page Links
						//Repeat if discovered list is same size

	};

	//Revealed Modules
	module.findUrls = (callback) => {
		console.log(reporter, "Hunting for URLs.");
		//Set entry URL first.
		url_list.discovered.push(global.config.entry);
		_runCrawlLoop(function() {
			console.log("Done!");
		});
		//callback(url_list);
	};

	return module;

};