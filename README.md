## Computing the Dependency Tree for an NPM Package
This project exposes an API for computing a given NPM package's dependency tree. It was built using Node.js and Express.

**Note** The API only retrieves dependencies, so no `devDependencies`, `peerDependencies`, or `optionalDepdendencies` for now. Although it could be extended to include those very easiy.

### Project structure
```
.
+-- docs - documentation
+-- lib - business logic
+-- persistence - for now just the cache management
+-- routes - Express router and middleware
+-- test - unit tests
+-- utils - utility functions (error handling, logging, validation, and NPM registry management)
+-- app.js - definition for the Express app
+-- server.js
```
### How to run
Run `npm start` and this will start up a server on port `3000` of `localhost`

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

### How to test
Run `npm t` and this will lint the code, run Mocha tests and gather coverage statistics under `/reports`, and finally generate documentation under `/docs`.

### Performance statistics
- Ran 10 iterations for Express and the average was around 2s, with the minimum being 1.8s and the maximum being 2.3s
```
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 1.981 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.01s user 0.01s system 0% cpu 1.861 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 2.265 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 1.637 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 2.012 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 2.463 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 1.705 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 2.040 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.01s user 0.01s system 0% cpu 1.883 total
curl -s -o /dev/null -X GET http://localhost:3000/package/express  0.00s user 0.01s system 0% cpu 2.091 total
```
- Ran 10 iterations for Loopback and the average was around 11s, with the minimum being 10.2s and the maximum being 12.4s
```
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.01s user 0.01s system 0% cpu 12.370 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 11.258 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 12.357 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 10.415 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 11.007 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 12.354 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 10.296 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.00s user 0.01s system 0% cpu 11.639 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.01s user 0.01s system 0% cpu 10.205 total
curl -s -o /dev/null -X GET http://localhost:3000/package/loopback  0.01s user 0.01s system 0% cpu 10.210 total
```