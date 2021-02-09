### How to run
Run `npm start`

Call the following APIs at `http://localhost:3000`:
- GET `/package/<package>`, where `<package>` is the name of a package published to NPM
- POST `/package/<package>` with JSON body and a provided `version` field

### How to test
Run `npm t`
