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

//Get the URL
app.input.question('What URL do you want to crawl?', (url) => {
  //Discover URL
  let discovery = require('./app/controllers/discovery')(Cheerio, Request);
  let discovery_crawl = discovery.crawl(url);

  //Do discovery crawl, and set URL Data.
  discovery_crawl.then(function(res) {
  	//Successful URL data from verification
  	console.log(res);
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