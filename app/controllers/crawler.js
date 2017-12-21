module.exports = function(cheerio, request) {
	const reporter = "[CRAWLER]";
	const url_tool = require('url');
	const module = {};
	const url_list = {
		discovered: [],
		started: [],
		crawled: [],
		promised: [],
	};

	let _isRelativeUrl = (url) => {
		var absolute = /^https?:\/\/|^\/\//i;
		return absolute.test(url) ? false : true;
	};

	let _isProperDomain = (url) => {
		let _root = url_tool.parse(global.config.root_domain).hostname;
		let _crawled = url_tool.parse(url).hostname;
		return (_root == _crawled) ? true : false;
	}

	let _checkArray = (url, arr) => {
		return {exists: (arr.indexOf(url) > -1 ? true : false), index: arr.indexOf(url)};
	};

	let _removeFromArray = (url, arr) => {
		let index = arr.indexOf(url);
		if (index > -1) {
    	arr.splice(index, 1);
		}
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
				if(!_checkArray(l, url_list.discovered).exists && !_checkArray(l, url_list.crawled).exists && _isProperDomain(l)) {
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
			if(!_checkArray(url, url_list.started).exists && !_checkArray(url, url_list.crawled).exists) {
				request(rq_config, function(error, response, body){
					if(error) {
						console.log(reporter, `Crawl request failed on url : ${rq_config.uri}`);
						reject(error);
					} else {
						$page = cheerio.load(body);
						console.log(reporter, `Successful page crawl. Resolving to action.`);
						resolve(action($page, url));
					}
				});
			} else {
				resolve(function() {
					console.log("Page already in progress.")
				}());
			}
		});
	}

	let _runCrawlLoop = (callback) => {
		url_list.discovered.forEach(function(e) {
			//Send Request to the page
			url_list.promised.push(
				_crawlPage(e, _getPageLinks).then(function(links) {
					if(_checkArray(e, url_list.discovered).exists) {
						//Remove Page & Add to crawled list
						_removeFromArray(e, url_list.discovered);
						url_list.started.push(e);
						if(!_checkArray(e, url_list.crawled).exists) {
							_removeFromArray(e, url_list.started);
							url_list.crawled.push(e);
						}
					}
					for (var i = links.length - 1; i >= 0; i--) {
						if(url_list.discovered.indexOf(links[i]) == -1) {
							url_list.discovered.push(links[i]);
						}
					}
					if(url_list.discovered.length > 0) {
						//console.log(url_list);
						_runCrawlLoop();
					}
					if(typeof callback == 'function' && url_list.discovered.length==0) {
						//Done...
						callback();
					}
				})
			);
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
			if(url_list.discovered.length > 0) {

			}
		});
		//callback(url_list);
	};

	return module;

};