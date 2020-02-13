const fs = require("fs");

module.exports.CANADA_BANK_URL =
  "https://ubmswww.bank-banque-canada.ca/en/Property/SearchIndex";

module.exports.DATE = new Date().valueOf();

const sleep = ms => new Promise(r => setTimeout(r, ms));

const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports.randomSleep = () => sleep(randomInt(1, 1000));
