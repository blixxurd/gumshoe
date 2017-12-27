module.exports = function() {
	return {
		max_concurrency: 3,
		request : {
			timeout: 2000,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
			},
			agent: false, 
			pool: {maxSockets: 100}
		}
	}
}

