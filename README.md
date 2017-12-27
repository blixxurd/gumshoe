# Gumshoe

Gumshoe is a NodeJS spider. It's sole purpose is to explore your website, and discover things about it. Gumshoe will be scriptable so that you can extend the spider easily with custom JS. 

## Current Status
Actively working on discovery methods. 

:large_blue_diamond: *IN PROGRESS*
:white_check_mark: *complete*

## Milestones
* Scaffold App :white_check_mark:
* Create "Discovery" methods 
* Create crawling methods

### To Do
* Handle non-200s in discovery mode
* Handle hashtags in URLs in discovery mode :white_check_mark:
* Find out what's causing infinite crawl loop bug :large_blue_diamond:
  * Previously crawled items being crawled again?? Why??
* Obey robots.txt 
* Utilize sitemap.xml if available (?) 
  * This isn't as fun as discovering on our own, but people probably want it ;) 
* Handle mailto & other non-http links. :white_check_mark:

[![forthebadge](http://forthebadge.com/images/badges/certified-steve-bruhle.svg)](http://forthebadge.com)
