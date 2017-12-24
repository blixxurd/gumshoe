# Gumshoe

Gumshoe is a NodeJS spider. It's sole purpose is to explore your website, and discover things about it. Gumshoe will be scriptable so that you can extend the spider easily with custom JS. 

## Milestones
* Scaffold App
* Create "Discovery" methods
* Create crawling methods

## Current Status
Actively working on discovery methods. 

### To Do
* Handle non-200s in discovery mode
* Handle hashtags in URLs in discovery mode
* Find out what's causing infinite crawl loop bug
** Previously crawled items being crawled again?? Why??
* Obey robots.txt
* Utilize sitemap.xml if available (?)
** This isn't as fun as discovering on our own, but people probably want it ;) 
* Handle mailto & other non-http links. 
** Update URL Helper to check for these and kill them with fire. 

[![forthebadge](http://forthebadge.com/images/badges/certified-steve-bruhle.svg)](http://forthebadge.com)
