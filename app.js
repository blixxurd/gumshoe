//Global config
global.config = require(`./app/config/${process.env.NODE_ENV}.js`)();

//Include External Libs
const Cheerio 		= require('cheerio'),
			WebServer 	= require('express'),
			Request 		= require('request'),
			Readline		= require('readline');


//App level includes
const app = require("./app/initializers");
			app.input = Readline.createInterface({
  			input: process.stdin,
  			output: process.stdout
			});
			app.errors = [];

//Set Reporter for Debugging
const reporter = '[App]';

//Get the URL
app.input.question('What URL do you want to crawl?', (url) => {
  //Discover URL
  let discovery = require('./app/controllers/discovery')(Cheerio, Request);

  //Do discovery crawl, and set URL Data.
  discovery.crawl(url).then(function(res) {
  	//Successful URL data from verification
  	global.config.entry = res.data.host.href;
  	global.config.root_domain = `${res.data.host.protocol}//${res.data.host.hostname}`;
  	// console.log(res.data.robots.isAllowed(res.data.host.href+'wp-admin/', 'GumshoeBot'));
  	discovery.getAllUrls(res).then(function(url_list) {
  		console.log(reporter, `Found ${url_list.crawled.length} URLs on ${global.config.root_domain}`);
  	});
  }, function(err) {
  	app.errors = err;
  });

  app.input.close();
});

/* App Core
	
	Known Dependencies: 
		-Cheerio
		-Express

*/