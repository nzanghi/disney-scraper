const axios = require('axios'),
  fs = require('fs'),
  beeper = require('beeper'),
  chalk = require('chalk');

const URI =
  'https://disneyworld.disney.go.com/api/wdpro/explorer-service/public/finder/dining-availability/80007798;entityType=destination?searchDate=2018-01-15&partySize=2&mealPeriod=80000714';
const AUTH_URI =
  'https://disneyworld.disney.go.com/authentication/get-client-token';
/**
 * 16660079;entityType=restaurant : Be Our Guest
 * 90002464;entityType=restaurant : Cinderella's Royal Table
 * 90002606;entityType=restaurant : Ohana
 */
const restaurants = ['16660079;entityType=restaurant', '90002464;entityType=restaurant', '90002606;entityType=restaurant'];
let cache = {};

const requestLoop = setInterval(() => {
  if (cache.auth) {
    mainUriCall();
  } else {
    authUriCall();
  }
}, 5000);

function authUriCall() {
  axios
    .get(AUTH_URI)
    .then(({ data }) => {
      cache.auth = `BEARER ${data.access_token}`;
      mainUriCall();
    })
    .catch(err => {
      console.log(err);
    });
}

function mainUriCall() {
  axios.defaults.headers.common['Authorization'] = cache.auth;

  axios
    .get(URI)
    .then(({ data }) => {
      const restaurant = data.availability[resID].availableTimes[0];
      if (restaurant.unavailableReason) {
        let logEntry = new Date() + `: ${restaurant.unavailableReason}\n`;
        fs.appendFile('log.txt', logEntry, err => {
          if (err) console.log(chalk.red(err));
        });
      } else {
        const avail = restaurant.offers.map(val => {
          return val.time;
        });
        beeper('***');
        console.log(chalk.cyan(new Date() + `: ${avail.join(', ')}`));
      }
    })
    .catch(err => {
      authUriCall();
    });
}
