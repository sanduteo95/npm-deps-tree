## Computing the Dependency Tree for an NPM Package
This project exposes an API for computing a given NPM package's dependency tree. It was built using [Node.js](https://nodejs.org/en/) and [Express](https://expressjs.com/) and tested using [Mocha](https://mochajs.org/).

The API was implemented with Node.js v12.

**Note 1** The API only retrieves dependencies, so no `devDependencies`, `peerDependencies`, or `optionalDepdendencies` for now. Although it could be extended to include those very easily.
**Note 2** If provided with a version of `latest`, it never gets cached.

### Project structure
```
.
+-- docs - documentation
+-- lib - business logic
+-- persistence - for now just the cache management logic
+-- routes - Express router and middleware
+-- test - unit tests
+-- utils - utility functions (error handling, logging, validation, and NPM registry management logic)
+-- app.js - Express app
+-- server.js
```
### How to run
Run `npm start` and this will start up a server on port `3000` of `localhost`

### API
Call the following APIs at `http://localhost:3000`:
- GET `/package/<package>`, where `<package>` is the name of a package published to NPM
e.g.
```sh
curl -X GET http://localhost:3000/package/express
```
- POST `/package/<package>` with JSON body and a provided `version` field
```sh
curl -X POST http://localhost:3000/package/express -d '{ "version": "latest" }'
```

The response format is:
```
{
  "<package name>": {
    "version": "<package version>",
    "dependencies": [
      {
        "<dependency name>": {
          "version": "<dependency version>",
          "dependencies": {
              ...
          }
        }
      }
    ]
  }
}
```

### How to test
Run `npm t` and this will lint the code, run Mocha tests and gather coverage statistics under `/reports`, and finally generate documentation under `/docs`.
### Performance statistics
Using [Artillery](https://artillery.io/), I have gathered some statistics. These depend on external factors but show the benefits of caching.

To install Artillery, run:
```sh
npm i -g artillery
```

Without caching, we see that without caching 95% and 99% of the requests take 12s, whereas the minimum one can take is 4s.
```sh
artillery quick -c 10 -n 20 http://localhost:3000/package/express

Summary report @ 15:07:02(+0000) 2021-02-13
  Scenarios launched:  10
  Scenarios completed: 10
  Requests completed:  200
  Mean response/sec: 1.07
  Response time (msec):
    min: 4836
    max: 13096.9
    median: 9047.1
    p95: 11433.9
    p99: 12509.3
  Scenario counts:
    0: 10 (100%)
  Codes:
    200: 200
```

With caching, we see that 95% and 99% percent of the requests take 2s - 3s, whereas the minimum one can take is 0.6s:
```sh
artillery quick -c 10 -n 20 http://localhost:3000/package/express

Summary report @ 15:20:14(+0000) 2021-02-13
  Scenarios launched:  10
  Scenarios completed: 10
  Requests completed:  200
  Mean response/sec: 5.25
  Response time (msec):
    min: 693.3
    max: 3015.6
    median: 1811.6
    p95: 2525.9
    p99: 2911.3
  Scenario counts:
    0: 10 (100%)
  Codes:
    200: 200
```