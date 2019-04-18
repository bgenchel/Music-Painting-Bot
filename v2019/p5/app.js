const express = require('express');
const path = require('path');
const osc = require('osc');
const ws = require('ws');

const OSCCommunicator = require('./oscCommunicator.js');

// Communication Channel for the Visualizer
let visComm = new OSCCommunicator({
    webSocketPort: 8081,
    udpReceivePort: 6000,
    udpSendPort: 6001
});

function coordinateHandler(adress, args) {

visComm.map('/coordinate',  

// Communication Channel for the Robot
let botComm = new OSCCommunicator({
    webSocketPort: 8082,
    udpReceivePort: 6002,
    udpSendPort: 6003
});


let app = express();
let server = require('http').createServer(app);

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));
app.get('/', (req, res) => {
    res.render('index');
});

server.listen(PORT, () => console.log(`Serving at localhost:${PORT}`));
