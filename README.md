# Gumshoe

Gumshoe is a NodeJS spider. It's sole purpose is to explore your website, and discover things about it. Gumshoe will be scriptable so that you can extend the spider easily with custom JS. 

## Current Status
:large_blue_diamond: **IN PROGRESS**

Actively working on discovery methods. 

## Milestones
* Scaffold App :white_check_mark:
* Create "Discovery" methods :white_check_mark:
* Create custom script injection :large_blue_diamond: 
* Create crawling scripts

### To Do
* Handle non-200s in discovery mode :white_check_mark:
* Make sure discovery mode is only looking for text/html types :white_check_mark:
* Handle hashtags in URLs in discovery mode :white_check_mark:
* Find out what's causing infinite crawl loop bug :white_check_mark:
* Utilize sitemap.xml if available (sitemapper npm) :white_check_mark:
* Handle mailto & other non-http links. :white_check_mark:
* State saving :white_check_mark:
* Obey NOFOLLOW :white_check_mark:
* Obey robots.txt (robots npm) :large_blue_diamond:
* Loading from saved state 
* Timed cleanup task that sorts out orphaned processes. (Switch all these over to use NPM heartbeat)
* Bad Error Code Listener (Run special events on 500, etc.)


[![forthebadge](http://forthebadge.com/images/badges/certified-steve-bruhle.svg)](http://forthebadge.com)
