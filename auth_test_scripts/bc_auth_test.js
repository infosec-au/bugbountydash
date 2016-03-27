var request = require('request')
var unirest = require('unirest')
var config = require('./config.js')
var cheerio = require('cheerio')

var BCCookieJar = unirest.jar(true);

bctitledata = []
bcprogramdata = []
bcstatusdata = []
combinedbcdata = []

function isSignedIntoBC(_callback) {
	unirest.get('https://bugcrowd.com/submissions')
	.followRedirect(false)
	.jar(BCCookieJar)
	.end(function (response) {
		if (response.code == 302) {
			signed_in = false 
		} else {
			signed_in = true
		}
		_callback()
	})
}

function getBCSession(_callback) {
	isSignedIntoBC(function(){
		if (signed_in == false) {
			unirest.get('https://bugcrowd.com/user/sign_in')
			.jar(BCCookieJar)
			.end(function (response) {
				$ = cheerio.load(response.body)
				csrfToken = $('meta[name=csrf-token]').attr('content')
				unirest.post('https://bugcrowd.com/user/sign_in')
					   .type('form')
					   .followRedirect(false)
					   .header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36')
					   .header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
					   .send('authenticity_token=' + encodeURIComponent(csrfToken))
					   .send('user%5Bemail%5D=' + encodeURIComponent(config.bugcrowd.user_name))
					   .send('user%5Bpassword%5D=' + encodeURIComponent(config.bugcrowd.password))
					   .jar(BCCookieJar)
					   .end(function (response) {
								if (response.body == '<html><body>You are being <a href="https://bugcrowd.com/submissions">redirected</a>.</body></html>') {
									// H1CookieJar.add();
									// console.log(response.body)
									signed_in = true
								} else {
									console.log("Could not sign into BC for unknown reason")
								}
							  	_callback()
						})
			})
		}
	})
}

function getBCReports(_callback) {
	getBCSession(function() {
		unirest.get('https://bugcrowd.com/submissions')
		       .followRedirect(false)
		       .jar(BCCookieJar)
		       .end(function (response) {
		       		$ = cheerio.load(response.body)
		       		 $("li.submission.row div").each(function(div_index, div) {
		       		 	object_map = {}
		       		 	data = $(this).find("a").get(0)
		       		 	if (data != undefined) {
		       		 		object_map["title"] = data.children[0].data
		       		 		bctitledata.push(object_map)
		       		 	}
		       		 })

		       		 $("p.bounty a").each(function(a_index, a) {
		       		 	object_map = {}
		       		 	data = $(this).text()
		       		 	if (data != undefined) {
		       		 		object_map["program"] = data
		       		 		bcprogramdata.push(object_map)
		       		 	}
		       		 })

		       		 $("div.reason").each(function(span_index, span) {
		       		 	object_map = {}
		       		 	data = $(this).find("span").get(0)
		       		 	if (data != undefined) {
		       		 		object_map["status"] = data.children[0].data
		       		 		bcstatusdata.push(object_map)
		       		 	}
		       		 })

		       		 // merge all bc lists into single json object array
				    for (var i=0; i<bctitledata.length; i++) {
				    	object = {}
				    	object["title"] = bctitledata[i].title
				    	object["program"] = bcprogramdata[i].program
				    	object["status"] = bcstatusdata[i].status
				    	combinedbcdata.push(object)
				    }
				    // complete yo, big hax big cash
				    
				    _callback();
		       })
	})
}

getBCReports(function() {
	console.log(combinedbcdata[0])
})