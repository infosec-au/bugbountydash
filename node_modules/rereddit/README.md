#rereddit

## About

Rereddit is a NodeJS wrapper for interfacing with reddit.com's API.  It is built around [superagent](https://github.com/visionmedia/superagent) with a few extentions to its Request object for convenience.  This extension allows for requests to be made like so:

```js
rereddit.read('funny').limit(25).after('t3_a515a')
    .end(function(err, posts) {
        // Do something with posts.
    });
```

Rereddit also allows for accessing protected content, returning a `user` object from a successful call to `login` that can be stored within a session and passed back to the module when needed.

```js
rereddit.login('username', 'password').end(function(err, user) {
    rereddit.me().as(user)
        .end(function(err, details) {
            // Now we have the user's details. 
        });
});
```

## Usage

Install via NPM.

    $ npm install rereddit

Then simply require within your application.

```js
var rereddit = require('rereddit');
```

## License

> The MIT License (MIT)

> Copyright (c) 2013 Chuck Preslar

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

### Release v1.0.0
