const express = require('express');
const path = require('path');
const osc = require('osc');
const ws = require('ws');

// Establishes a UDP address/port to receive from (local) and an address/port to send to (remote)
let udp_midi = new osc.UDPPort({
    localAddress: "127.0.0.1", // 127.0.0.1, a.k.a. localhost, is a way to refer to this computer
    localPort: 6000,
    remoteAddress: "127.0.0.1",
    remotePort: 6001
});

// This function is called when the UDP port is opened and ready to use
udp_midi.on("ready", () => {
    console.log("OSC Listening on port " + udp_midi.options.localPort + ", sending to port " + udp_midi.options.remotePort);
});

// Open the UDP port
udp_midi.open();

// Create a server to receive web socket connections from a browser
let wss_midi = new ws.Server({
    port: 8081
});

// This function is called when a browser connects to the server
wss_midi.on("connection", function (socket) {
    console.log("ws client connected");
    var socketPort = new osc.WebSocketPort({
        socket: socket
    });

    // This relays messages sent from the browser via web socket to the UDP port, out to the remote UDP port.
    var relay_midi = new osc.Relay(udp_midi, socketPort, {
        raw: true
    });
});

let udp_bot = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 6002,
    remoteAddress: "127.0.0.1",
    remotePort: 6003
});

udp_bot.on("ready", () => {
    console.log("OSC Listening on port " + udp_bot.options.localPort + ", sending to port " + udp_bot.options.remotePort);
});

udp_bot.open();

// Create a server to receive web socket connections from a browser
let wss_bot = new ws.Server({
    port: 8082
});

// This function is called when a browser connects to the server
wss_bot.on("connection", function (socket) {
    console.log("ws client connected");
    var socketPort = new osc.WebSocketPort({
        socket: socket
    });

    var relay_bot = new osc.Relay(udp_bot, socketPort, {
        raw: true
    });
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
