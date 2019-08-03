# H2S Student Management API

This API connects the H2S Student Management App to both our own firebase database & 42's Intra API.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project.

### Prerequisites

- [Node](https://nodejs.org/en/)
  - version 12.7

_If you need to upgrade / downgrade your Node Js version, you can use [nvm](https://github.com/creationix/nvm)_
  - `nvm install 12.7`
### Installing & Starting

```
nvm use 12.7
npm install
npm start
```

_For live updates in development use_ `npm run start-watch`

## Contributing

Please read [CONTRIBUTING.md](https://github.com/donald-stolz/H2S-frontend/blob/master/.github/CONTRIBUTING.md) for details on how to best get involved, and the process for submitting pull requests to us.

## Deployment

Our API is deployed using [Heroku](https://heroku.com/). ~~Any changes made on the `master` branch are tested through [Travis CI](https://travis-ci.org/), passing builds are automatically deployed.~~ Once a branch is merged with `master` it must be manually tested & deployed.
## Built With

> [Express](https://expressjs.com/) Server Framework  
> [Firebase](https://firebase.google.com/) Database

### Additional Libraries

> [body-parser](https://github.com/expressjs/body-parser)  
> [bottleneck](https://github.com/SGrondin/bottleneck)  
> [cors](https://github.com/expressjs/cors)  
> [Moment Timezone](http://momentjs.com/timezone/)  
> [request-promise](https://github.com/request/request-promise)

### Development & Testing Tools

> [Postman](https://www.getpostman.com/)  
> [dotenv](https://github.com/motdotla/dotenv)  
> [jest](https://github.com/facebook/jest)  
> [nodemon](https://github.com/remy/nodemon)  
> [supertest](https://github.com/visionmedia/supertest)

## Authors

- **[Donald Stolz](https://donstolz.tech/)** - Intial work & design

# TODO
 - env file placement & node/npm trouble shooting
