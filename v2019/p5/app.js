const express = require('express');
const path = require('path');

let app = express();
let server = require('http').createServer(app);

const PORT = process.env.PORT || 8080;
app.use(express.json());
app.use(express.static(__dirname + '/src'));

app.get('/', (req, res) => {
    res.render('index');
});

server.listen(PORT, () => console.log(`Serving at localhost:${PORT}`));
