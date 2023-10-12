const express = require('express');
const fs = require('fs');
const path = require("path");
const router = express.Router();
const http = require('http');

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
    top100 = [...top100, "noipv6.wtf", "nftm.art", "shitpoststatus.com", "vote.hive.uno", "engine.hive.uno", "hivel.ink", "babushkaspin.com", "featurefilms.co", "hotsingles.cyou", "cookieclicker.dbuidl.com"];
    return top100;
}

const top100Alexa = stripToTop100Domains(top1mAlexa);

let requestResults = [];

async function makeRequest(domain) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: domain,
      port: 80,
      path: '/',
      method: 'GET',
      family: 6,
      timeout: 10000,
    }, (res) => {
      resolve(res);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy(new Error('ETIMEDOUT'));
    });

    req.end();
  });
}

async function pingTop100() {
  let tmpRequestResults = [];

  // request (ipv6 only) from top 100 alexa sites
  for (let i = 0; i < top100Alexa.length; i++) {
    let doesIpv6 = false;
    try {
      // make an ipv6-only get request to the base url
      console.log(`Pinging ${top100Alexa[i]}`);

      const res = await makeRequest(top100Alexa[i]);

      if (res.socket.remoteFamily === 'IPv6') {
        doesIpv6 = true;
      }

    } catch (e) {
        console.log(e);
    }

    tmpRequestResults.push({domain: top100Alexa[i], ipv6: doesIpv6, number: i + 1});
  }

  console.log(tmpRequestResults, requestResults);

  requestResults = tmpRequestResults;
}

setInterval(pingTop100, 1000 * 60 * 60 * 24);

pingTop100();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { pingResults: [...requestResults].slice(0, 100), pingResultsMe: [...requestResults].slice(100), title: "Top 100 Sites IPv6 Test | NoIPv6.wtf?" });
});

module.exports = router;
