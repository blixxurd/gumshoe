module.exports = function() {
	return {
		max_concurrency: 5,
		sleep_delay: 2000,
		save_every: 50,
		report_every: 5000,
		ignore_sitemap: true,
		request : {
			timeout: 8000,
			headers: {
				'User-Agent': 'GumshoeBot'
			},
			agent: false, 
			pool: {maxSockets: Infinity},
			rejectUnauthorized: false
		}
	}
}

