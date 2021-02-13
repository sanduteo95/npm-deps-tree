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
  "name": "<package name>",
  "version": "<package version>",
  "dependencies": [
    {
      "name": "<dependency name>",
      "version": "<dependency version>",
      "dependencies": [
          ...
      ]
    }
  ]
}
```

### How to test
Run `npm t` and this will lint the code, run Mocha tests and gather coverage statistics under `/reports`, and finally generate documentation under `/docs`.

### Performance statistics
