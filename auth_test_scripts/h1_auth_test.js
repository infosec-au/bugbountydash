var request = require('request')
var unirest = require('unirest')
var config = require('./config.js')

//1 check current_user json to see if signed in
//2 if not signed in, login - else return session jar and get csrf token and return
//3 check current_user again to get csrf token
//4 return session jar and csrf token
var H1CookieJar = unirest.jar(true);

function isSignedIntoH1(_callback) {
	
	unirest.get('https://hackerone.com/current_user')
	.header('Accept', 'application/json')
	.jar(H1CookieJar)
	.end(function (response) {
	  var current_user = response.body
	  csrfToken = current_user["csrf_token"]
	  if (current_user["signed_in?"] == "true") {
	  	signed_in = true
	} else {
		signed_in = false
	}
	  return _callback();
	})
}

function getH1Session(_callback) {
	isSignedIntoH1(function(){
		if (signed_in == false) {
			// console.log(csrfToken)
			// console.log(encodeURIComponent(config.hackerone.user_name))
			// console.log(encodeURIComponent(config.hackerone.password))
			unirest.post('https://hackerone.com/users/sign_in')
			.type('form')
			.followRedirect(false)
			.header('Referer', 'https://hackerone.com/')
			.header('Origin', 'https://hackerone.com')
			.header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36')
			.header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
			.send('authenticity_token=' + encodeURIComponent(csrfToken))
			.send('user%5Bemail%5D=' + encodeURIComponent(config.hackerone.user_name))
			.send('user%5Bpassword%5D=' + encodeURIComponent(config.hackerone.password))
			.jar(H1CookieJar)
			.end(function (response) {
				console.log(response.headers['set-cookie']['0']);
				if (response.body == '<html><body>You are being <a href="https://hackerone.com/hacktivity">redirected</a>.</body></html>') {
					// H1CookieJar.add();
					// console.log(response.body)
					signed_in = true
				} else {
					console.log("Could not sign into H1 for unknown reason")
				}
			  	_callback();
			})
		} else {
			console.log(signed_in);
			_callback();
		}
	})

}

function getH1Reports() {
	getH1Session(function(){
		console.log("valid session : getting csrf token and status")
		unirest.get('https://hackerone.com/current_user')
		.header('Accept', 'application/json')
		.jar(H1CookieJar)
		.end(function (response) {
		  var current_user = response.body
		  csrfToken = current_user["csrf_token"]
		  signedinstatus = current_user["signed_in?"]
		  if (signedinstatus == true) {
			unirest.get('https://hackerone.com/bugs.json?subject=user&report_id=0&view=all&substates%5B%5D=new&substates%5B%5D=triaged&substates%5B%5D=needs-more-info&substates%5B%5D=resolved&substates%5B%5D=not-applicable&substates%5B%5D=informative&substates%5B%5D=duplicate&substates%5B%5D=spam&text_query=&sort_type=latest_activity&sort_direction=descending&limit=25&page=1')
			.header('X-CSRF-Token', csrfToken)
			.header('X-Requested-With', 'XMLHttpRequest')
			.header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36')
			.header('Accept', 'application/json, text/javascript, */*; q=0.01')
			.jar(H1CookieJar)
			.end(function (response) {
			  var all_report_data = response.body
			  return all_report_data
			})
		  }
		})
	})
}

getH1Reports();