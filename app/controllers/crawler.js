module.exports = function(cheerio, request) {
	const reporter = "[CRAWLER]";
	const url_tool = require('url');
	const URL = require('./url')(cheerio, request);
	const module = {};
	const url_list = {
		discovered: [],
		started: [],
		crawled: [],
		failed: []
	};

	let active_loops = 0;

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

	let _hasHash = (url) => {
		return url_tool.parse(url).hash == null ? false : true;
	}

	let _removeHash = (url) => {
		let new_url = url_tool.parse(url);
				new_url.hash = null;
		return new_url.href;
	}

	let _noRemaining = () => {
		return (url_list.discovered.length == 0 && url_list.started.length == 0) ? true : false;
	}

	let _needsToBeCrawled = (url) => {
		return (!_checkArray(url, url_list.started).exists && !_checkArray(url, url_list.crawled).exists && _checkArray(url, url_list.discovered).exists);
	}

	let _notYetFound = (url) => {
		return (!_checkArray(url, url_list.started).exists && !_checkArray(url, url_list.crawled).exists && !_checkArray(url, url_list.discovered).exists);
	}

	let _getPageLinks = ($, url) => {
		let links = [],
				link_count = $('a').length;
		//console.log(reporter, `[${url}] Found ${link_count} links on page.`);
		$('a').each(function(i, ele) {
			let l = $(this).attr('href');
			if(typeof l == "string") {
				//Resolve relative URLs
				if(_isRelativeUrl(l)) {
					l = url_tool.resolve(url, l);
				}
				//Remove Any hashes...
				if(_hasHash(l)) {
					l = _removeHash(l);
				}
				if(_notYetFound(l) && _isProperDomain(l) && !_hasHash(l) && URL.properProtocol(l)) {
					links.push(l);
				}
			}
		});
		//console.log(reporter, `[${url}] Adding ${links.length} newly discovered links to URL List.`);
		return links;
	};

	let _crawlPage = (url, action) => {
		return new Promise(function(resolve, reject) {
			let rq_config =  global.config.request;
					rq_config.uri = url;
			//console.log(reporter, `Starting Page Crawl on ${rq_config.uri}`);

			request(rq_config, function(error, response, body){
				if(error) {
					reject(error);
				} else {
					$page = cheerio.load(body);
					//console.log(reporter, `[${url}] Resolving to action.`);
					resolve(action($page, url));
				}
			});
		});
	}

	let _runCrawlLoop = (callback) => {
		//Future Aaron -- Add a way to log the number of active loops here, and then set a limit for those to stop multiple URLs from being crawled at once. 
		if(active_loops == 0) {
			active_loops++;
			//console.log('----NEW CRAWL LOOP----');
			url_list.discovered.forEach(function(e, index) {
				//Send Request to the page
				if(url_list.started.length > global.config.max_concurrency) {
					return;
				} else if(_needsToBeCrawled(e) || _isPristine) {
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
						//console.log('----CRAWL CALLBACK POST LOOP----');
						if(url_list.discovered.length > 0) {
							active_loops = 0;
							//console.log('----CALLING RECURSIVE CRAWL LOOP----');
							_runCrawlLoop(callback);
						} 
						if(_noRemaining() && index==0) {
							//Done...
							//console.log('----CALLING CALLBACK----');
							callback();
							return;
						}
						console.log(`Discovered: ${url_list.discovered.length} || Crawled: ${url_list.discovered.length} || || In Progress: Index: ${url_list.started.length} || Current URL: ${e} || Index: ${index}`);
					}).catch(function(err) {
						//console.log('----CATCHING EXCEPTION----');
						console.log(reporter, `[${e}] ${err}`);
						url_list.failed.push(e);
						console.log(reporter, "Error caught. Waiting 10 seconds to resume loop.");
						active_loops = 0;
						setTimeout(function() {
							active_loops = 0;
							_runCrawlLoop(callback);
						}, 10000);
					});

				} else {
					//console.log('----UNHANDLED SCENARIO----');
					callback();
				}

			});
		} else {
			//console.log('----TOO MANY LOOPS RECURSIVE CALL----');
			active_loops = 0;
			_runCrawlLoop(callback);
		}

	};

	//Revealed Modules
	module.findUrls = (callback) => {
		console.log(reporter, "Hunting for URLs.");
		//Set entry URL first.
		url_list.discovered.push(global.config.entry);
		_runCrawlLoop(function() {
			console.log("Done!");
		});
	};

	return module;

};