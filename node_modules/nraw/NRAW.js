var h = require("./helper"),
	that = {};

exports.cookie = null;
exports.modhash = null;

var Reddit = function(uA, cookie, modhash){
	var helper = new h(that, exports.cookie, exports.modhash);
	that = helper.reset();
	that.userAgent = uA || that.userAgent;

	if(cookie) exports.cookie = cookie;
	if(modhash) exports.modhash = modhash;

	return this;
}

Reddit.prototype.login = function(username, password, callback){
	that.credentials.username = username;
	that.credentials.password = password;
	that.login = true;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.random = function(callback){
	that.random = true;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.related = function(callback){
	that.related = true;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.user = function(username, callback){
	that.username = username;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.multireddit = function(multireddit, callback){
	that.multireddit = multireddit;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.subreddit = function(subreddit, callback){
	that.subreddit = subreddit;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.subscribe = function(callback){
	that.subscribe = "sub";
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.unsubscribe = function(callback){
	that.subscribe = "unsub";
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

var filters = [
	"overview", "comments", "submitted", "liked", "disliked", "hidden", "saved", // User
	"hot", "new", "rising", "controversial", "top", "gilded", "promoted" // Subreddit
];
filters.forEach(function(filter){
	Reddit.prototype[filter] = function(callback){
		if(that.filter) throw new Error("Only one filter can be applied.");
		else{ if(filter == "promoted") that.filter = "ads"; else that.filter = filter; }
		if(typeof callback == "function") this.exec(callback);
		else return this;
	}
})

Reddit.prototype.comments = function(callback){
	that.comments = true;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

var queries = ["after", "before", "count", "from", "limit", "sort"];
queries.forEach(function(query){
	Reddit.prototype[query] = function(value, callback){
		if(query == "from") that.query.t = value;
		else that.query[query] = value;
		if(typeof callback == "function") this.exec(callback);
		else return this;
	}
})

Reddit.prototype.search = function(query, callback){
	that.query.q = query;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.post = function(id, callback){
	if(id){
		that.postId = id;
		if(typeof callback == "function") this.exec(callback);
		else return this;
	}else{
		that.postage.do = true;
		that.restrict_sr = true;
		return this;
	}
}

Reddit.prototype.comment = function(parent, text, callback){
	if(parent && (!text || typeof text == "function")){
		that.commentId = parent;
		if(typeof text == "function") this.exec(text);
		else return this;
	}else{
		if(that.postage.comment.do) throw new Error("You can only post one comment at the time.");
		else{
			that.postage.comment.do = true;
			that.postage.comment.parent = parent;
			that.postage.comment.text = text;
		}
		if(typeof callback == "function") this.exec(callback); else return this;
	}
}

Reddit.prototype.upvote = function(callback){
	that.vote = 1;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.unvote = function(callback){
	that.vote = 0;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.downvote = function(callback){
	that.vote = -1;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.delete = function(callback){
	that.delete = true;
	if(typeof callback == "function") this.exec(callback);
	else return this;
}

Reddit.prototype.link = function(title, link, callback){
	if(!that.subreddit) throw new Error("No subreddit specified.");
	else{
		if(that.postage.link.do) throw new Error("You can only post one link at a time.");
		else{
			that.postage.link.do = true;
			that.postage.link.title = title;
			that.postage.link.link = link;
		}
		if(typeof callback == "function") this.exec(callback); else return this;
	}
}

Reddit.prototype.self = function(title, text, callback){
	if(!that.subreddit) throw new Error("No subreddit specified.");
	else{
		if(that.postage.self.do) throw new Error("You can only post one self-post at a time.");
		else{
			that.postage.self.do = true;
			that.postage.self.title = title;
			that.postage.self.text = text;
		}
		if(typeof callback == "function") this.exec(callback); else return this;
	}
}


Reddit.prototype.exec = function(callback){
	var helper = new h(that, exports.cookie, exports.modhash);
	if(typeof callback == "function"){
		if(that.login || that.subscribe || that.postage.do){
			exports.cookie = helper.cookie;
			exports.modhash = helper.modhash;
			helper.login(function(data){
				callback(data);
				that = helper.reset();
			})
		}else if(
			that.username || 
			(that.subreddit && !that.subscribe && !that.postage.do) || 
			that.comments || 
			that.multireddit || 
			that.query.q != null || 
			that.random || 
			(that.related && that.postId)){
			helper.getStuff(function(data){
				callback(data);
				that = helper.reset();
			});
		}else if(that.related && !that.url) throw new Error("No url specified.");
		else if((that.postId || that.commentId) && that.delete){
			helper.deleteStuff(function(data){
				callback(data);
				that = helper.reset();
			});
		}
		else if(!that.subreddit && that.postId) throw new Error("No subreddit specified.");
		else if(that.postage.do){
			helper.postStuff(function(data){
				callback(data);
				that = helper.reset();
			});
		}else throw new Error("Something went terribly wrong.");
	}else{
		throw new Error("Please specify a callback.");
		that = helper.reset();
		return true;
	}
}

module.exports = Reddit;