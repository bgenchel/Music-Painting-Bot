class OSCClient {
    constructor() {
        // Create the web socket port
        this.oscPort = new osc.WebSocketPort({
            url: "ws://localhost:8081",
        });

        // Open the port
        this.oscPort.open();

        // Flag to make sure sending isn't attempted before the port is open
        this.ready = false;

        // This function is called when the port is open and ready to use
        this.oscPort.on("ready", this.onReady.bind(this));

        // This will store callback functions supplied via `map()`
        this.mappings = {};

        // This function is called every time there is an OSC message sent from Python
        this.oscPort.on("message", this.onMessage.bind(this));
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
     * Called when the web socket port is open and ready to use
     */
    onReady() {
        this.ready = true;
        console.log("ws port open");
    }

    /**
     * Called by the "message" event of the web socket port
     * @param message : the OSC message received over web socket
     */
    onMessage(message) {
        let cb = this.mappings[message.address];
        if(cb != undefined) cb(message.address, message.args);
    }

    /**
     * Sends a message to Python
     * @param address : an address (usually prefixed with a "/", e.g. "/play") to which to send the message
     * @param args : a list of arguments (N.B. must be a list!)
     */
    send(address, args) {
        if(this.ready) {
            this.oscPort.send({
                address: address,
                args: args
            });
        } else console.log("Failed to send, port is not yet open.");
    }
}
