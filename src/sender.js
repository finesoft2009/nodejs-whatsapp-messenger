#!/usr/bin/env node

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const winston = require('winston');
const fs = require('fs');
const logSymbols = require('log-symbols');
const path = require('path');
const findChrome = require('./find_chrome');

const config = require('./config.js');
const selector = require('./selectors.js');

process.setMaxListeners(0);

// Checking if the message was passed
if (!process.argv[2]) {
  logger.warn('Message not specified, exiting ...');
  console.log(logSymbols.error, chalk.red('Message not specified, exiting ...'));
  process.exit(1);
}

// Checking the login name
if (!process.argv[3]) {
  logger.warn('Login not specified, exiting ...');
  console.log(logSymbols.error, '  ', chalk.red('Login not specified, exiting ...'));
  process.exit(1);
}

// Checking if one numbers was passed
if (!process.argv[4]) {
  logger.warn('Numbers argument not specified, exiting ...');
  console.log(logSymbols.error, '  ', chalk.red('Numbers argument not specified, exiting ...'));
  process.exit(1);
}

// Getting all arguments
let message = process.argv[2];
let userName = process.argv[3];
let numbers = [];

// Getting all number
for (let n = 4; n < process.argv.length; n++) {
  numbers.push(process.argv[n]);
}



// catch un-handled promise errors
process.on("unhandledRejection", (reason, p) => {
  //console.warn("Unhandled Rejection at: Promise", p, "reason:", reason);
});

(async function main() {

  const logger = setUpLogging();

  try {

    /**
     * Custom vars
     */
    const executablePath = findChrome().pop() || null;
    const tmpPath = path.resolve(__dirname, config.data_dir);
    const headless = !config.window;

    var promises = [];

    const browser = await puppeteer.launch({
      headless: headless,
      // path where will be save the cookies to avoid sync whatsapp everytime
      userDataDir: tmpPath + '/' + userName,
      ignoreHTTPSErrors: true,
      args: [
        '--log-level=3',
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-site-isolation-trials',
        '--no-experiments',
        '--ignore-gpu-blacklist',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--enable-features=NetworkService',
        '--disable-setuid-sandbox',
        '--no-sandbox'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36');

    await page.setRequestInterception(true);

    page.on('request', (request) => {
      request.continue();
    });

    await getAndSendQrCode(page);
    await sendMessages(message, numbers, page, browser);


  } catch (err) {
    logger.warn(err);
  }

  async function getAndSendQrCode(page) {

    page.goto('https://web.whatsapp.com/', {
      waitUntil: 'load',
      timeout: 10000
    }).then(async function (response) {

      // Wait for 10 seconds
      await page.waitFor(networkIdleTimeout);

      const title = await page.evaluate(() => {

        let nodes = document.querySelectorAll('.window-title');
        let el = nodes[nodes.length - 1];

        return el ? el.innerHTML : '';
      });

      // this means browser upgrade warning came up for some reasons
      if (title && title.includes('Google Chrome 36+')) {
        logger.warn('ERROR: Could not open whatsapp web, most likely got browser upgrade message....');
        console.log('ERROR: Could not open whatsapp web, most likely got browser upgrade message....');
        process.exit();
      }

      // Here we check if the QRCode is visible and get the data
      var qrCode = await page.waitForSelector(selector.qr_code);
      console.log(qrCode);

    });
  }

  // send messages to the numbers
  async function sendMessages(message, numbers, page, browser) {
    for (number of numbers) {
      console.log(number);

      // var messageLink = encodeURI(`https://web.whatsapp.com/send?phone=${number}&text=${message}`);
      var messageLink = `https://web.whatsapp.com/send?phone=${number}&text=${message}`;
      console.log("o link: " + messageLink);

      await page.goto(messageLink, {
        waitUntil: 'load',
        timeout: 20000
      });
      await page.waitFor(3000);
      await page.waitForSelector(selector.send_button);
      await page.waitFor(3000);
      await page.click(selector.send_button);
      await page.waitFor(3000);

    }

    await browser.close();
  }

  // setup logging
  function setUpLogging() {

    const env = process.env.NODE_ENV || 'development';
    const logDir = 'logs';

    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const tsFormat = () => (new Date()).toLocaleTimeString();

    const logger = new(winston.Logger)({
      transports: [
        // colorize the output to the console
        new(winston.transports.Console)({
          timestamp: tsFormat,
          colorize: true,
          level: 'info'
        }),
        new(winston.transports.File)({
          filename: `${logDir}/log.log`,
          timestamp: tsFormat,
          level: env === 'development' ? 'debug' : 'info'
        })
      ]
    });

    return logger;
  }

})();