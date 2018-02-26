module.exports = function(cheerio, request) {
	const url_tool = require('url');
	const Sitemapper = require('sitemapper');
	const RobotsParser = require('robots-parser');
	const FS = require('fs');
	const OS = require('os');
	const Util = require('util');
	const URL = require('./url')(cheerio, request);
	const module = {};
	const url_list = {
		discovered: [],
		started: [],
		crawled: [],
		failed: []
	};
	const reporter = "[CRAWLER]";
	let started = 0;
	let last_success = 0;
	let logger, reporting_iterator;

	let active_loops = 0;

	let _currentTime = () => {
		return Date.now() / 1000;
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

	let _isPristine = () => {
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
		if(typeof url == 'string') {
			return (!_checkArray(url, url_list.started).exists && !_checkArray(url, url_list.crawled).exists && _checkArray(url, url_list.discovered).exists);
		} else {
			return false;
		}
	}

	let _notYetFound = (url) => {
		return (!_checkArray(url, url_list.started).exists && !_checkArray(url, url_list.crawled).exists && !_checkArray(url, url_list.discovered).exists);
	}

	let _hasCapacity = () => {
		return url_list.started.length < global.config.max_concurrency ? true : false;
	}

	let _isNoFollow = ($) => {

	}

	let _safeStatusCode = (code) => {
		return code.toString()[0] == 2 ? true : false;
	}

	let _safeContentType = (type) => {
		return type.indexOf('text/html') == 0 ? true : false;
	}

	let _loadSitemapPages = () => {
		let sitemap = new Sitemapper({
		  url: global.config.root_domain + '/sitemap.xml',
		  timeout: 15000
		});
		return sitemap.fetch();
	}

	let _saveProgress = () => {
		const filename = url_tool.parse(global.config.root_domain).hostname + '.json';
		const path = 'tmp/valid_sites/' + filename;
		FS.writeFile(path, JSON.stringify(url_list, null, 2), function(err) {
			console.log(err ? err : '\r\n----------\r\nProgress Saved.\r\n----------\r\n')
		}); 
	}

	let _logReport = () => {
		_saveProgress();
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		const time = new Date();
		const load_average = OS.loadavg();
		console.log(`\r\n-----${time.toISOString()}-----`);
		console.log(`Discovered: ${url_list.discovered.length}`);
		console.log(`Crawled: ${url_list.crawled.length}`);
		console.log(`In Progress: ${url_list.started.length}`);
		console.log(`Omitted: ${url_list.failed.length}`);
		console.log(`Memory: ${Math.round(used * 100) / 100} MB`);
		console.log(`CPU Load: ${load_average}`);
		console.log(`Time Elapsed: ${Math.ceil(_currentTime() - started)} Seconds`);
		console.log(`---------------------------------\r\n`);
	};

	let _getPageLinks = ($, url) => {
		let links = [],
				link_count = $('a').length;
		//console.log(reporter, `[${url}] Found ${link_count} links on page.`);
		$('a').each(function(i, ele) {
			let l = $(this).attr('href');
			const rel = $(this).attr('rel');
			const nofollow = (typeof rel == "string" && rel == "nofollow") ? true : false;

			if(typeof l == "string" && !nofollow) {
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

			let r = request(rq_config, function(error, response, body){
				if(error) {
					reject(error);
				} else {
					if(_safeStatusCode(response.statusCode) && _safeContentType(response.headers['content-type'])) {
						$page = cheerio.load(body);
						//console.log(reporter, `[${url}] Resolving to action.`);
						resolve(action($page, url));
					} else {
						reject(`Unsafe Status Code or Content Type - ${response.statusCode} - ${response.headers['content-type']}`);
					}
				}
			});

			//Maybe pass this in the callback, and abort if needed there? 
			setTimeout(function() {
				r.abort();
			}, global.config.request.timeout + 1000);
		});
	}

	let _runCrawlLoop = (callback) => {

		//Add the entry URL if it's not already there
		if(_notYetFound(global.config.entry)) {
			url_list.discovered.push(global.config.entry);
		}

		if(_noRemaining()) {
			//We're done. Clear interval, save, and stop.
			_saveProgress();
			callback(url_list);
			clearInterval(reporting_iterator);
			return;
		}

		//Set the crawl loop URL
		let e = url_list.discovered[0];

		//Send Request to the page
		//console.log(`(${_needsToBeCrawled(e)} || ${_isPristine()}) && ${_hasCapacity()}`);
		if((_needsToBeCrawled(e) || _isPristine()) && _hasCapacity()) {
			_removeFromArray(e, url_list.discovered);
			url_list.started.push(e);

			_crawlPage(e, _getPageLinks).then(function(links) {


				//Remove the item from the started list & add to crawled
				_removeFromArray(e, url_list.started);
				url_list.crawled.push(e);

				//Lopp through found links & add to discovered if legit
				for (var i = links.length - 1; i >= 0; i--) {
					if(_notYetFound(links[i]) && typeof links[i] == 'string') {
						url_list.discovered.push(links[i]);
					}
				}

				last_success = _currentTime();

				//Call the loop recursively again if we still have more
				//console.log('----CRAWL CALLBACK POST LOOP----');
				if(url_list.discovered.length > 0) {
					_runCrawlLoop(callback);
					return;
				} 

				//Callback if we don't have more
				if(_noRemaining()) {
					//Done... Clear interval, save, and stop.
					_saveProgress();
					clearInterval(reporting_iterator);
					callback(url_list);
					return;
				}
				
			}).catch(function(err) {
				//console.log('----CATCHING EXCEPTION----');
				_removeFromArray(e, url_list.started);
				console.log(reporter, `${err}`);
				url_list.failed.push(e);
				//console.log(reporter, "Error caught. Waiting 10 seconds to resume loop.");
				active_loops = 0;
				setTimeout(function() {
					active_loops = 0;
					_runCrawlLoop(callback);
				}, global.config.sleep_delay);
			});


			// Throttle not reached. Crawl more things!!
			if(_hasCapacity() && url_list.discovered.length > 0) {
				setTimeout(function() {
					_runCrawlLoop(callback);
				}, global.config.sleep_delay);
			}

		} else {
			if(!_needsToBeCrawled(e)) {
				_removeFromArray(e, url_list.discovered);
				url_list.failed.push(e);
				//console.log(`${!_checkArray(e, url_list.started).exists} && ${!_checkArray(e, url_list.crawled).exists} && ${_checkArray(e, url_list.discovered).exists}`);
				// console.log(reporter, `Page does not need to be crawled. Possible dupe? || ${e}`);
				//_runCrawlLoop(callback);
			} else if (!_hasCapacity()) {
				//console.log(reporter, `No Capacity. Sleeping.`);
				setTimeout(function() {
					_runCrawlLoop(callback);
				}, global.config.sleep_delay);
			} else {
				console.log(reporter, "UNHANDLED SCENARIO. URL: ${e}");
			}
		}

	};

	//Revealed Modules
	module.findUrls = (callback) => {
		started = _currentTime();
		//Load URLs from the sitemap
		_loadSitemapPages().then((data) => {
			console.log(reporter, `Found ${data.sites.length} in Sitemap`);
			for (var i = data.sites.length - 1; i >= 0; i--) {
				if(_notYetFound(data.sites[i])) {
					url_list.discovered.push(data.sites[i]);
				}
			}
			//url_list.discovered = url_list.discovered.concat(url_list.discovered, data.sites);
			reporting_iterator = setInterval(_logReport,global.config.report_every);
			_runCrawlLoop(callback);
		}).catch((error) => {
			console.log(reporter, 'No sites found in sitemap.');
			_runCrawlLoop(callback);
		});

	};

	module.robotsTester = () => {

	}

	return module;

};