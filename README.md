# nodejs-whatsapp-messenger
A tool to send WhatsApp messages using Puppeteer

This project is based on [whatspup](https://github.com/sarfraznawaz2005/whatspup) project.

###How to install
1. `git clone https://github.com/odravison/nodejs-whatsapp-messenger.git`
2. `npm install`

###How to use
`node sender.js 'My message example' usernameToSeparateCookies 55123456789 55123456789 55123456789`

###Developed Features:
  - [x] Sends one messages to set of numbers
  - [x] Sends QrCode to a external endpoint
  - [x] Separate cookies by users name
  - [ ] Retry to send QrCode after WhatsApp timeout
  - [ ] Send messages resume for a remote endpoint
  - [ ] Enable remote live progressbar