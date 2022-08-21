const ping = require('ping');
const express = require('express');
const fs = require('fs');
const path = require("path");
const router = express.Router();

const cfg = {
  timeout: 10,
  extra: ['-6'],
};

const top1mAlexa = parseCSVToArray(path.join(__dirname, '..', 'routes','top-1m.csv'));

function parseCSVToArray(csvPath) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim().split(',');
    result.push(currentLine);
  }
  return result;
}

function stripToTop100Domains(alexaTop1m) {
    let top100 = alexaTop1m.slice(0, 100);
    top100 = top100.map(row => row[1]);
    top100 = [...top100, "nftm.art", "shitpoststatus.com", "vote.hive.uno", "engine.hive.uno", "hivel.ink", "babushkaspin.com", "featurefilms.co", "hotsingles.cyou", "cookieclicker.dbuidl.com"];
    return top100;
}

const top100Alexa = stripToTop100Domains(top1mAlexa);

let pingResults = [];

async function pingTop100() {
  let tmpPingResults = [];

  // ping top 100 alexa sites
  for (let i = 0; i < top100Alexa.length; i++) {
    let doesIpv6 = false;
    try {
      let pingResponse = await ping.promise.probe(top100Alexa[i], cfg);
      doesIpv6 = pingResponse.alive;
    } catch (e) {}

    tmpPingResults.push({domain: top100Alexa[i], ipv6: doesIpv6, number: i + 1});
  }

  pingResults = tmpPingResults;
}

setInterval(pingTop100, 1000 * 60 * 60 * 24);

pingTop100();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { pingResults: [...pingResults].slice(0, 100), pingResultsMe: [...pingResults].slice(100), title: "Top 100 Sites IPv6 Test | NoIPv6.wtf?" });
});

module.exports = router;
