const osc = require('osc');
const ws = require('ws');

class OSCRelayCommunicator {
    constructor({webSocketPort, udpReceivePort, udpSendPort}) {
        this.webSocketPort = webSocketPort;
        this.udpReceivePort = udpReceivePort;
        this.udpSendPort = udpSendPort;

        // Establishes a UDP address/port to receive from (local) and an address/port to send to (remote)
        // 127.0.0.1, a.k.a. localhost, is a way to refer to this computer 
        this.udpPort = new osc.UDPPort({
            localAddress: "127.0.0.1",             
            localPort: this.udpReceivePort,
            remoteAddress: "127.0.0.1",
            remotePort: this.udpSendPort
        });

        // This function is called when the UDP port is opened and ready to use
        this.udpPort.on("ready", () => {
            console.log("OSC Listening on port " + this.udpPort.options.localPort + ", sending to port " + this.udpPort.options.remotePort);
        });

        // This will store callback functions supplied via `map()`
        this.mappings = {};

        // Handle incoming messages
        this.udpPort.on("message", this.onUDPMessage.bind(this));

        // Open the UDP port
        this.udpPort.open();

        // Create a server to receive web socket connections from a browser
        this.wss = new ws.Server({
            port: this.webSocketPort
        });

        this.wss.on("ready", () => {
            console.log("Web Socket Port Open"); 
        });

        // This function is called when a browser connects to the server
        this.wss.on("connection", this.onWSConnection.bind(this));
    }

    /**
     * Map a callback to a given OSC address
     * @param address : an address (usually prefixed with a "/", e.g. "/play") to associate with the given callback
     * @param callback : a function with one parameter, a list of arguments from the OSC message sent to address
     */
    map(address, callback) {
        this.mappings[address] = callback;
    }

    /**
     * Called by the "message" event of the web socket port
     * @param message : the OSC message received over web socket
     */
    onUDPMessage(message) {
        let cb = this.mappings[message.address];
        if(cb != undefined) cb(message.address, message.args);
    }

    onWSConnection(socket) {
        console.log("ws client connected");
        var socketPort = new osc.WebSocketPort({
            socket: socket
        });

        // This relays messages sent from the browser via web socket to the UDP port, out to the remote UDP port (and 
        var relay_midi = new osc.Relay(this.udpPort, socketPort, {
            raw: true
        });
    }
};

module.exports = OSCRelayCommunicator;
