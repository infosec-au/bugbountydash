var blessed = require('blessed')
var contrib = require('blessed-contrib')
var request = require('request')
var unirest = require('unirest')
var openurl = require('openurl')
var reddit = require('nraw');
var cheerio = require('cheerio')
var Reddit = new reddit('shubs');
var config = require('./config.js')
var screen = blessed.screen()

function truncateString(stringInput, maxCharCount) {
    if (stringInput.length > maxCharCount) {
        stringOutput = stringInput.substring(0, maxCharCount) + "..."
        return stringOutput
    } else {
        return stringInput
    }
}

// initialize h1 variables yo'
var reports
var reports_open_count
var reports_total_count
var cacheddisclosedbugs
var h1profileurl
var h1metrics
var h1userinfo

// intialize bcrowd variables yo'
var bctitledata = []
var bcprogramdata = []
var bcstatusdata = []
var bclinksdata = []
var combinedbcdata = []
var bcstats = []
var bcuserhandle

// initialize netsec data
var cachednetsecdata

// dealing with h1's complicated login flow
var H1CookieJar = unirest.jar(true);

function isSignedIntoH1(_callback) {

    unirest.get('https://hackerone.com/current_user')
        .header('Accept', 'application/json')
        .jar(H1CookieJar)
        .end(function(response) {
            var current_user = response.body
            csrfToken = current_user["csrf_token"]
            if (current_user["signed_in?"] == true) {
                signed_in = true
                username = current_user["username"]
            } else {
                signed_in = false
            }
            return _callback();
        })
}

function getH1Session(_callback) {
    isSignedIntoH1(function() {
        if (signed_in == false) {
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
                .end(function(response) {
                    if (response.body == '<html><body>You are being <a href="https://hackerone.com/hacktivity">redirected</a>.</body></html>') {
                        signed_in = true
                    } else {
                        console.log("Could not sign into H1 for unknown reason")
                    }
                    _callback();
                })
        } else {
            _callback();
        }
    })

}

function getH1Reports(_callback) {
    getH1Session(function() {
        unirest.get('https://hackerone.com/current_user')
            .header('Accept', 'application/json')
            .jar(H1CookieJar)
            .end(function(response) {
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
                        .end(function(response) {
                            var all_report_data = response.body
                            reports = all_report_data
                            _callback()
                        })
                }
            })
    })
}

function getH1BugCount(_callback) {
    getH1Session(function() {
        unirest.get('https://hackerone.com/current_user')
            .header('Accept', 'application/json')
            .jar(H1CookieJar)
            .end(function(response) {
                var current_user = response.body
                csrfToken = current_user["csrf_token"]
                signedinstatus = current_user["signed_in?"]
                h1profileurl = current_user["url"]
                if (signedinstatus == true) {
                    unirest.get('https://hackerone.com/bugs/count?subject=user&view=open&substates%5B%5D=new&substates%5B%5D=needs-more-info&substates%5B%5D=triaged&text_query=&sort_type=latest_activity&sort_direction=descending&limit=25&page=1')
                        .header('X-CSRF-Token', csrfToken)
                        .header('X-Requested-With', 'XMLHttpRequest')
                        .header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36')
                        .header('Accept', 'application/json, text/javascript, */*; q=0.01')
                        .jar(H1CookieJar)
                        .end(function(response) {
                            reports_open_count = response.body.count
                            unirest.get('https://hackerone.com/bugs/count?subject=user&view=all&substates%5B%5D=new&substates%5B%5D=triaged&substates%5B%5D=needs-more-info&substates%5B%5D=resolved&substates%5B%5D=not-applicable&substates%5B%5D=informative&substates%5B%5D=duplicate&substates%5B%5D=spam&text_query=&sort_type=latest_activity&sort_direction=descending&limit=25&page=1')
                                .header('X-CSRF-Token', csrfToken)
                                .header('X-Requested-With', 'XMLHttpRequest')
                                .header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36')
                                .header('Accept', 'application/json, text/javascript, */*; q=0.01')
                                .jar(H1CookieJar)
                                .end(function(response) {
                                    reports_total_count = response.body.count
                                    _callback()
                                })
                        })
                }
            })
    })
}

function getH1Metrics(_callback) {

    unirest.get('https://hackerone.com/metrics')
        .header('Accept', 'application/json')
        .jar(H1CookieJar)
        .end(function(response) {
            h1metrics = response.body
            unirest.get(h1profileurl)
                .header('Accept', 'application/json, text/javascript, */*; q=0.01')
                .header('X-Requested-With', 'XMLHttpRequest')
                .jar(H1CookieJar)
                .end(function(response) {
                    h1userinfo = response.body
                    return _callback();
                })
        })
}

// dealing with bugcrowds login flow

var BCCookieJar = unirest.jar(true);

function isSignedIntoBC(_callback) {
    unirest.get('https://bugcrowd.com/submissions')
        .followRedirect(false)
        .jar(BCCookieJar)
        .end(function(response) {
            if (response.code == 302) {
                signed_in = false
            } else {
                signed_in = true
            }
            _callback()
        })
}

function getBCSession(_callback) {
    isSignedIntoBC(function() {
        if (signed_in == false) {
            unirest.get('https://bugcrowd.com/user/sign_in')
                .jar(BCCookieJar)
                .end(function(response) {
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
                        .end(function(response) {
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
            .end(function(response) {
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

                $("h5 a").each(function(span_index, span) {
                    object_map = {}
                    data = $(this).attr("href")
                    if (data != undefined) {
                        object_map["report_link"] = data
                        bclinksdata.push(object_map)
                    }
                })

                // save bugcrowd username for later
                bcuserhandle = $("span.profile strong").text()

                // merge all bc lists into single json object array
                for (var i = 0; i < bctitledata.length; i++) {
                    object = {}
                    object["title"] = bctitledata[i].title
                    object["program"] = bcprogramdata[i].program
                    object["status"] = bcstatusdata[i].status
                    object["link"] = bcstatusdata[i].report_link
                    combinedbcdata.push(object)
                }
                // complete yo, big hax big cash
                _callback();
            })
    })
}

function getBCMetrics(_callback) {
    unirest.get('https://bugcrowd.com/' + bcuserhandle)
        .followRedirect(false)
        .jar(BCCookieJar)
        .end(function(response) {
            $ = cheerio.load(response.body)
            bcstats = []
            $("li.stat strong").each(function(span_index, span) {
                data = $(this).text()
                if (data != undefined) {
                    bcstats.push(data)
                }
            })
            _callback()
        })
}

var grid = new contrib.grid({
    rows: 12,
    cols: 12,
    screen: screen
})

var h1submitted = grid.set(0, 4, 6, 4, contrib.table, {
    keys: true,
    fg: 'green',
    label: 'H1: Your reports',
    columnSpacing: 1,
    columnWidth: [50, 15, 10]
})

var h1disclosed = grid.set(0, 8, 6, 4, contrib.table, {
    keys: true,
    fg: 'green',
    label: 'H1: Publicly Disclosed',
    columnSpacing: 1,
    columnWidth: [55, 10, 10]
})

var bcsubmitted = grid.set(6, 4, 6, 4, contrib.table, {
    keys: true,
    fg: 'green',
    label: 'BC: Your reports',
    columnSpacing: 1,
    columnWidth: [50, 15, 10]
})

var netsecposts = grid.set(6, 8, 6, 4, contrib.table, {
    keys: true,
    fg: 'green',
    label: '/r/netsec: Top Posts',
    columnSpacing: 1,
    columnWidth: [55, 10, 10]
})

var h1statistics = grid.set(0, 0, 4, 4, blessed.box, {
    content: "",
    label: 'H1: Statistics'
})

var h1gauge = grid.set(4, 0, 2, 4, contrib.gauge, {
    label: 'H1: Open to Closed Bug Ratio',
    percent: [80, 20]
})

var bcstatistics = grid.set(6, 0, 4, 4, blessed.textarea, {
    label: 'BC: Statistics'
})

var bcgauge = grid.set(10, 0, 2, 4, contrib.gauge, {
    label: 'BC: Open to Closed Bug Ratio',
    percent: [80, 20]
})

// set h1 resolved to unresolved ratio
setInterval(function() {
    getH1BugCount(function() {
        percentage_open = Math.round((reports_open_count / reports_total_count) * 100)
        h1gauge.setData([percentage_open, 100 - percentage_open]);
    })
}, 5000)

// set bc resolved to unresolved ratio
setInterval(function() {
    resolved_count = 0
    unresolved_count = 0
    for (var i = 0; i < combinedbcdata.length; i++) {
        if (combinedbcdata[i].status == "Resolved") {
            resolved_count = resolved_count + 1
        } else {
            unresolved_count = unresolved_count + 1
        }
    }
    bc_total_count = resolved_count + unresolved_count
    bc_percentage_resolved = Math.round((resolved_count / bc_total_count) * 100)
    bcgauge.setData([bc_percentage_resolved, 100 - bc_percentage_resolved]);
}, 10000)

setInterval(function() {
    h1_profile = "Your H1 Profile : " + h1profileurl + "\n"
    getH1Metrics(function() {
        try {
            h1_name = "Username: " + h1userinfo.username + "\n"
            h1_reputation = "Your reputation: " + h1userinfo.reputation + "\n"
            h1_report_count = "Number of resolved reports: " + h1userinfo.report_count + "\n"
            h1_signal = "Signal Percentile: " + h1userinfo.signal_percentile + "\n"
            h1_impact = "Impact Percentile: " + h1userinfo.impact_percentile + "\n"
            h1statistics.setContent(h1_profile + h1_name + h1_reputation + h1_report_count + h1_signal + h1_impact)
        } catch (e) {

        }
    })
}, 5000)


setInterval(function() {
    getBCMetrics(function() {
        // console.log(bcstats)
        try {
            bc_profile = "Your BC Profile : " + 'https://bugcrowd.com/' + bcuserhandle + "\n"
            bc_name = "Username: " + bcuserhandle + "\n"
            bc_rank = "Your rank: " + bcstats[0] + "\n"
            bc_bugs_found = "Number of bugs found: " + bcstats[1] + "\n"
            bc_points = "Points: " + bcstats[2] + "\n"
            bc_acceptance = "Acceptance Rate: " + bcstats[3] + "\n"
            bc_priority = "Average Priority: " + bcstats[4] + "\n"
            bcstatistics.setContent(bc_profile + bc_name + bc_rank + bc_bugs_found + bc_points + bc_acceptance + bc_priority)
        } catch (e) {

        }
    })
}, 5000)



function generateH1Table() {

    var data = []
    getH1Reports(function() {
        for (var i = 0; i < reports.bugs.length; i++) {
            var row = []

            row.push(truncateString(reports.bugs[i].title, 44))
            row.push(reports.bugs[i].team.profile.name)
            row.push(reports.bugs[i].state)

            data.push(row)
        }

        h1submitted.setData({
            headers: ['Finding', 'Program', 'State'],
            data: data
        })
    })
}

function generateH1DiscTable() {
    var data = []
    var options = {
        url: 'http://h1.nobbd.de/programs.json',
        headers: {
            'User-Agent': 'Bountydash'
        }
    }

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var disclosedbugs = JSON.parse(body);
            } catch (e) {
                var disclosedbugs = {}
            }
            cacheddisclosedbugs = disclosedbugs
            for (var i = 0; i < disclosedbugs.length; i++) {
                var row = []

                finding_name = disclosedbugs[i][0]
                program_name = disclosedbugs[i][3]
                bounty = disclosedbugs[i][7]

                row.push(truncateString(finding_name, 48))
                row.push(program_name)
                row.push(bounty)

                data.push(row)
            }
            h1disclosed.setData({
                headers: ['Finding', 'Program', 'Bounty'],
                data: data
            })
        }
    }

    request(options, callback);
}

function generateBCTable() {
    var data = []
    getBCReports(function() {
        for (var i = 0; i < combinedbcdata.length; i++) {
            var row = []
            row.push(truncateString(combinedbcdata[i].title, 46))
            row.push(combinedbcdata[i].program)
            row.push(truncateString(combinedbcdata[i].status, 12))
            data.push(row)
        }

        bcsubmitted.setData({
            headers: ['Finding', 'Program', 'State'],
            data: data
        })

    })

}

function generateNetSec() {
    var data = []
    try {
        Reddit.subreddit("netsec").new().exec(function(netsecdata) {
            cachednetsecdata = netsecdata
            for (var i = 0; i < netsecdata.data.children.length; i++) {

                var row = []
                row.push(truncateString(netsecdata.data.children[i].data.title, 48))
                row.push(netsecdata.data.children[i].data.ups)
                row.push(netsecdata.data.children[i].data.author)
                data.push(row)
            }
            netsecposts.setData({
                headers: ['Title', 'Upvotes', 'Author'],
                data: data
            })
        })
    } catch (e) {
        netsecposts.setData({
            headers: ['Title', 'Upvotes', 'Author'],
            data: ["Error grabbing data", "", ""]
        })
    }
}

// attempt to generate all our tables at startup
generateH1Table()
generateH1DiscTable()
generateBCTable()
generateNetSec()

h1submitted.focus()

// refresh all tables with new data every 30 seconds
setInterval(generateH1Table, 30000)
setInterval(generateH1DiscTable, 60000)
setInterval(generateBCTable, 60000)
setInterval(generateNetSec, 60000)

// refresh the screen every .5 seconds
setInterval(function() {
    screen.render()
}, 500)


// event actions when an item is selected in any table
h1submitted.rows.on('select', function(el, index) {
    openurl.open(reports.bugs[index].url)
})

bcsubmitted.rows.on('select', function(el, index) {
    openurl.open("https://bugcrowd.com" + bclinksdata[index].report_link)
})

h1disclosed.rows.on('select', function(el, index) {
    openurl.open("https://hackerone.com/reports/" + cacheddisclosedbugs[index][4])
})

netsecposts.rows.on('select', function(el, index) {
    openurl.open("https://reddit.com" + cachednetsecdata.data.children[index].data.permalink)
})

// change table focus based on keys [1 - 4] on keyboard
screen.key(['1'], function(ch, key) {
    h1submitted.focus();
});

screen.key(['2'], function(ch, key) {
    h1disclosed.focus();
});

screen.key(['3'], function(ch, key) {
    bcsubmitted.focus();
});

screen.key(['4'], function(ch, key) {
    netsecposts.focus();
});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

screen.render()