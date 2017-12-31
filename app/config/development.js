module.exports = function() {
	return {
		max_concurrency: 4,
		sleep_delay: 1000,
		save_every: 50,
		request : {
			timeout: 10000,
			headers: {
				'User-Agent': 'GumshoeBot'
			},
			agent: false, 
			pool: {maxSockets: Infinity}
		}
	}
}

