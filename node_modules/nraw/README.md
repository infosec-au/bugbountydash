# NRAW.js

## Index
 - [Home](#nrawjs)
 - [Description](#description)
 - [How to](#how-to)
 - [Execute requests](#execute-requests)
 - [Users](#user)
 - [Subreddits](#subreddit)
 - [Multireddits](#multireddits)
 - [Comments](#comments)
 - [Posts](#posts)
 - [Voting](#voting)
 - [Searching](#searching)
 - [Random](#random)
 - [Queries][1]
 - [Filters (User)][2]
 - [Filters (Subreddit)][3]


## Description
NRAW.js simplifies the use of Reddit's API with an easy-to-use chainable functions.


## How to
Start by installing NRAW.js:

```sh
$ npm install nraw
```

Then require it in your server:

```javascript
var r = require("nraw");
```

Now, make a new instance of the `r`-object, which you can do by providing a User-agent.

```javascript
var Reddit = new r("Testbot v0.0.1 by Mobilpadde");
```

Or you can fill in three parameters, which are a user-agent, a cookie and the modhash of a Reddit user: 

```javascript
var Reddit = new r("Testbot v0.0.1 by Mobilpadde", cookie, modhash);
```


### Execute requests
Executing requests can be done in two ways:  

```javascript
Reddit.user("Mobilpadde").exec(function(data){
    // Some super awesome code
})
```

Or

```javascript
Reddit.user("Mobilpadde", function(data){
    // Some super awesome code
})
```

In the examples below, the first method will be applied.


### User
Get the 25 latest posts (Links, self-posts or comments) of a given user:

```javascript
Reddit.user("Mobilpadde").exec(function(data){
    // Some super awesome code
})
```

"That's stupid! Who'd ever need the latest 25 posts of a user?", you say? Well, NRAW.js is smart enough to handle [queries][1] too!  
Let's make a basic request that gets the top five posts (Links, self-posts and comments) of a user:

```javascript
Reddit.user("Mobilpadde").sort("top").limit(5).exec(function(data){
    // Some super awesome code
})
```

Pretty cool, 'eh?  
"But what if I want to see seven of my liked posts and comments?" - That's super easy too! Simply use the `login`-function and the `liked`-[filter][2]:

```javascript
Reddit.login(user, pass).user("Mobilpadde").liked().limit(7).exec(function(data){
    // Some super awesome code
})
```


### Subreddit
Get the 25 latest posts (Links and self-posts) of a given subreddit:

```javascript
Reddit.subreddit("CatReactionGifs").exec(function(data){
    // Some super awesome code
})
```

"That's not useful *at* all! I hate you" - You.
Well, like last time, we have [queries][1] that can be applied, but wait! There's more! Subreddits even have the ability to be [filtered][3]!  
Let's make a request of the 25 most controversial posts from the last year from a given subreddit, but only the ones after the post with the id `t3_2k0r3o`:

```javascript
Reddit.subreddit("CatReactionGifs").controversial().after("t3_2k0r3o").exec(function(data){
    // Some super awesome code
})
```

Or how about we make a request, that finds the 42 top comments of a given subreddit, using the [filter][3] `comments`:

```javascript
Reddit.subreddit("CatReactionGifs").comments().top().limit(42).exec(function(data){
    // Some super awesome code
})
```

"Can I get a single post if I know its id?" - Easy peasy!

```javascript
Reddit.subreddit("CatReactionGifs").post("2zmdf9").exec(function(data){
	// Some super awesome code
})
```

"Whoa, that's pretty awesome, but can I post a link?" - Of course you can! We just need to login and use the `post`-function:

```javascript
Reddit.login(user, pass).subreddit("CatReactionGifs").post().link("How I feel when there's only one pizza slice left", "http://i.imgur.com/CFSwHdq.gif").exec(function(data){
    // Some super awesome code
})
```

"Wow! C-c-can I subscribe to subreddits then?" - Yea you can! Though we'll have to get our hands a bit dirty:

```javascript
Reddit.subreddit("CatReactionGifs", function(info){
	Reddit.login(user, pass).subreddit(info.data.children[0].data.subreddit_id).subscribe(function(data){
		// Some super awesome code
	 })
 })
```

"Awesome! But what if I don't like a subreddit anymore?" - Well, that's a bit tougher! Ha! Gotcha! You should've seen your face! Priceless! Don't worry, it's super easy too:

```javascript
Reddit.subreddit("DogReactionGifs", function(info){
	Reddit.login(user, pass).subreddit(info.data.children[0].data.subreddit_id).unsubscribe(function(data){
		// Some super awesome code
	})
})
```

We can even search through a subreddit:

```javascript
Reddit.subreddit("CatReactionGifs").search("Cat").exec(function(data){
	// Some super awesome code
})
```

"What if I want a random thread from a given subreddit?" - Pure easiness! Simply do:

```javascript
Reddit.subreddit("cats").random().exec(function(data){
    // Some super awesome code
})
```


### Multireddits
You can also get multireddits:

```javascript
Reddit.user("Mobilpadde").multireddit("kittehs").exec(function(data){
    // Some super awesome code
})
```


### Comments
How about we play around with some comments for a while?

Let's get all the new comments (Login so we don't have to wait 30 seconds before we can request new comments):

```javascript
Reddit.login(user, pass).comments().exec(function(data){
    // Some super awesome code
})
```

"Well, now for a tough one! Can I post comments?" - Yes! Yes you can! All you need is an id of the parent (In this case we're gonna use `t3_31cvo9`):

```javascript
Reddit.login(user, pass).post().comment("t3_31cvo9", "I love you!").exec(function(data){
	// Some super awesome code
})
```

"What if I want to see a specific comment and I have its id?" - Well, that's super easy like everything else:

```javascript
Reddit.subreddit("CatReactionGifs").post("2zmdf9").comment("cpkmvc4").exec(function(data){
	// Some super awesome code
})
```

"I want to delete my comment, please help!" - Alrighty! It's as easy as pie: 

```javascript
Reddit.login(user, pass).comment("t1_cq0ev3j").delete().exec(function(data){
    // Some super awesome code
})
```


### Posts
You can also delete a post if you misspelled something:

```javascript
Reddit.login(user, pass).post("t3_31cvo9").delete().exec(function(data){
    // Some super awesome code
})
```

"But I want the related posts of a post to which I know the id" - That's even easier! Take a look at this:

```javascript
Reddit.post("2v5oi5").related().exec(function(data){
    // Some super awesome code
})
```


### Voting
Upvoting:

```javascript
Reddit.login(user, pass).post("t3_2v5oi5").upvote().exec(function(data){
    // Some super awesome code
})
```

Unvoting:

```javascript
Reddit.login(user, pass).post("t3_2v5oi5").unvote().exec(function(data){
    // Some super awesome code
})
```

Downvoting:

```javascript
Reddit.login(user, pass).post("t3_2v5oi5").downvote().exec(function(data){
    // Some super awesome code
})
```

Ps. add `.comment("t1_coestfz")`, if you want to vote on a comment instead of a post.


### Searching
You can also search for every thread - in every subreddit - containing the word `cat`:

```javascript
Reddit.search("cat").exec(function(data){
	// Some super awesome code
})
```


### Random
How 'bout getting a random thread, you say?

```javascript
Reddit.random().exec(function(data){
    // Some super awesome code
})
```


## Queries
 - after - *postId*
 - before - *postId*
 - count - 1- 100
 - limit - 1 - 100
 - from - "hour", "week", "month", "year", "all"
 - sort - "hot", "top", "new", "controversial"

## Filters (User)
 - comments
 - disliked
 - hidden
 - liked
 - overview
 - saved
 - submitted

## Filters (Subreddit)
 - comments
 - controversial
 - hot
 - gilded
 - new
 - promoted
 - rising
 - top

[Top](#nrawjs)

[1]:#queries
[2]:#filters-user
[3]:#filters-subreddit