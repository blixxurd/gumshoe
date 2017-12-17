module.exports = function(cheerio, request) {
	const reporter = "[URL VALIDITY CHECK]";
	const validUrl = require('valid-url');
	const net_verify = {
		'http:' 	: require('http'),
		'https:'	: require('https')
	};
	const module = {};

	function _netVerify(data, callback) {
		console.log(reporter, `Attempting Net Verify over ${data.host.protocol}// protocol on port ${data.host.port}`);
    let req = net_verify[data.host.protocol].request({method: 'HEAD', host: data.host.host, port: data.host.port, path: data.host.pathname}, function(r) {
        if(r && r.headers && r.headers.server) {
        	console.log(reporter, `Net Verify succeeded. Server is running on ${r.headers.server}`);
        	data.server = r.headers.server;
        } else {
        	console.log(reporter, `Net Verify failed. Website does not currently point to any server.`);
        	data.valid = false;
        }
        callback(data);
    });
		req.end();
	}

	function _checkUrl(url, callback) {
		console.log(reporter, "Checking URL Details...");
		let rq_config =  global.config.request;
				rq_config.uri = url;

		let return_data = {url: url, valid: false, host: undefined};

		//Check for http, append if necesary
		if (url.indexOf('http://') == -1 && url.indexOf("https://") == -1) {
			console.log(reporter, "No protocol found. Defaulting to http://.");
			url = rq_config.uri = `http://${url}`;
		}

		//Poll URL to determine real URL data
		if(validUrl.isUri(url)) {
			console.log(reporter, "URL is formatted correctly.");
			request(rq_config, function(error, response){
				if(error) {
					console.log(reporter, "Error retrieving URL info from host.");
					callback(return_data);
				} else {
					return_data.host = response.request.uri;
					return_data.valid = true;
					console.log(reporter, "Successfully retrieved host data.");
					_netVerify(return_data, function() {
						callback(return_data);
					});
				}
			});
		} else {
			console.log(reporter, "Error in URL formatting detected.");
			callback(return_data);
		}
	}

	//Revealed Modules
	module.getUrlData = (url,callback) => {
		console.log(reporter, "Getting URL Data...");
		_checkUrl(url, function(data) {
			if(data.valid && data.host!==undefined) {
				console.log(reporter, "This is a valid URL.");
				callback({data: data});
			} else {
				console.log(reporter, "This is an invalid URL.");
				callback({error: "Invalid URL", data: data});
			}
		});
	};

	return module;

};