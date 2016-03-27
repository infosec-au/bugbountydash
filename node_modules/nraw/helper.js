var request = require("request");
	that = {},
	helper = function(obj, cookie, modhash){
		that = obj;
		exports.cookie = cookie;
		exports.modhash = modhash;
	};

helper.prototype.querify = function(get){
	var query = "?";
	if(get){
		for(var i in that.query){
			query += i + "=" + that.query[i] + "&";
		}
		return query.slice(0, -1);
	}else{
		if(that.postage.comment.do) query += "api_type=json&text=" + encodeURIComponent(that.postage.comment.text) + "&thing_id=" + that.postage.comment.parent;
		else if(that.postage.link.do)
			query += "title=" + encodeURI(that.postage.link.title) + 
					 "&url=" + encodeURI(that.postage.link.link) + 
					 "&sr=" + that.subreddit + 
					 "&kind=link";
		else if(that.postage.self.do) 
			query += "title=" + encodeURI(that.postage.self.title) + 
					 "&text=" + encodeURI(that.postage.self.text) + 
					 "&sr=" + that.subreddit + 
					 "&kind=self";
		else if(that.postId && !that.commentId) query += "id=" + that.postId;
		else if(that.postId && that.commentId) query += "id=" + that.commentId;
		else if(that.subscribe && that.subreddit) query += "action=" + that.subscribe + "&sr=" + that.subreddit;
		else throw new Error("Something went wrong.");
		if(that.vote != null) query += "&dir=" + that.vote;
		return query;
	}
}

helper.prototype.url = function(get){
	if(get){
		var url = "http://www.reddit.com";
		if(that.username) url += "/user/" + that.username;
		else if(that.subreddit){
			url += "/r/" + that.subreddit;
			if(that.query.q) url += "/search";
			else{
				if(that.postId) url += "/comments/" + that.postId;
				if(that.commentId) url += "/NRAW/" + that.commentId;
			}
		}
		if(that.username && that.filter) url += "/" + that.filter;
		else if(that.subreddit && that.filter) url += "/" + that.filter;
		else if(that.multireddit) url += "/m/" + that.multireddit;
		else if(that.comments) url += "/comments";
		else if(that.query.q && url.indexOf("search") == -1) url += "/search";
		else if(that.random) url += "/random";
		else if(that.related && that.postId) url += "/related/" + that.postId;
		url += ".json"
		return url;
	}else{
		var url;
		if(that.postage.do && that.postage.comment.do) url = "https://www.reddit.com/api/comment";
		else if(that.postage.do || that.postage.link.do || that.postage.self.do) url = "http://www.reddit.com/api/submit";
		else if((that.postId || that.commentId) && that.delete) url = "https://www.reddit.com/api/del";
		else if(that.subscribe && that.subreddit) url = "https://www.reddit.com/api/subscribe";
		else if(that.vote != null) url = "https://www.reddit.com/api/vote";
		else throw new Error("Something went wrong.");
		return url;
	}
}

helper.prototype.login = function(callback){
	var _this = this;
	if(exports.cookie && exports.modhash){
		if((that.postId || that.commentId) && that.delete) _this.deleteStuff(callback);
		else if(that.postage.do || that.subscribe) this.postStuff(callback);
		else if(
			that.username || 
			(that.subreddit && !that.subscribe && !that.postage.do) || 
			that.comments || 
			that.multireddit ||
			that.query.q != null || 
			that.random || 
			(that.related && that.postId)
		) this.getStuff(callback);
		else callback({cookie: exports.cookie, modhash: exports.modhash});
		return true;
	}
	else{
		request.post(
			"https://ssl.reddit.com/api/login?api_type=json&user=" + 
			 that.credentials.username + "&passwd=" + 
			 that.credentials.password + "&rem=True", {
			"headers": {
				"User-Agent": that.userAgent,
				"X-Modhash": exports.modhash,
				"Cookie": "reddit_session=" + encodeURIComponent(exports.cookie)
			}
		}, function(err, response, body){
			if(err) callback(err);
			else if(response.statusCode != 200) callback(response);
			else{
				exports.cookie = JSON.parse(body).json.data.cookie;
				exports.modhash = JSON.parse(body).json.data.modhash;
				if((that.postId || that.commentId) && that.delete) _this.deleteStuff(callback);
				else if(that.postage.do || that.subscribe || that.vote != null) _this.postStuff(callback);
				else if(
					that.username || 
					(that.subreddit && !that.subscribe && !that.postage.do) || 
					that.comments || 
					that.multireddit ||
					that.query.q != null || 
					that.random || 
					(that.related && that.postId)
				) _this.getStuff(callback);
				else callback(JSON.parse(body).json.data);
				return true;
			}
		})
	}
}

helper.prototype.getStuff = function(callback){
	request.get(this.url(true) + this.querify(true), {
		"headers": {
			"User-Agent": that.userAgent,
			"X-Modhash": exports.modhash,
			"Cookie": "reddit_session=" + encodeURIComponent(exports.cookie)
		}
	}, function(err, response, body){
		if(err) callback(err);
		if(response.statusCode != 404) callback(JSON.parse(body) ? JSON.parse(body) : body);
		else callback(response);
		return true;
	})
}

helper.prototype.postStuff = function(callback){
	request.post(this.url(false) + this.querify(false), {
		"headers": {
			"User-Agent": that.userAgent,
			"X-Modhash": exports.modhash,
			"Cookie": "reddit_session=" + encodeURIComponent(exports.cookie)
		}
	}, function(err, response, body){
		if(err) callback(err);
		if(response.statusCode != 404){
			var parsed = JSON.parse(body);
			if(Object.keys(parsed).length == 0) callback({Yay: true});
			else callback(parsed);
		}else callback(response);
		return true;
	})
}

helper.prototype.deleteStuff = function(callback){
	request.post(this.url(false) + this.querify(false), {
		"headers": {
			"User-Agent": that.userAgent,
			"X-Modhash": exports.modhash,
			"Cookie": "reddit_session=" + encodeURIComponent(exports.cookie)
		}
	}, function(err, response, body){
		if(err) callback(err);
		if(response.statusCode != 404) callback(JSON.parse(body));
		else callback(response);
		return true;
	})
}

helper.prototype.reset = function(){
	return {
		userAgent: that.userAgent || "Testbot v0.0.1 by /u/undefined",
		query: {},
		delete: false,
		url: null,
		related: false,
		random: false, 
		postId: null,
		commentId: null,
		vote: null,
		multireddit: null,
		subreddit: null,
		subscribe: null,
		filter: null,
		username: null,
		comments: false,
		login: false,
		postage: {
			do: false,
			comment: {
				do: false,
				parent: null,
				text: null
			},
			link: {
				do: false,
				title: null,
				link: null
			},
			self: {
				do: false,
				title: null,
				text: null
			}
		},
		credentials: {
			username: null,
			password: null
		}
	}
}

module.exports = helper;