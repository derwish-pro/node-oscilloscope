var settings = require("./settings");
var SerialPort = require("serialport");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var receivedData = [];

if (settings.serialport) {
    connect(settings.serialport);
}
else {
    SerialPort.list(function (err, ports) {
        ports.forEach(function (port) {
            if (port.manufacturer == 'Arduino LLC (www.arduino.cc)') {
                connect(port.comName);
            }
        })
    });
}


function connect(portName) {
    var port = new SerialPort(portName, {
        baudRate: 115200
    });

    // port.on('open', function () {
    //     console.log('Port ' + portName + ' opened');
    // });

    // port.on('error', function (err) {
    //     console.log('Error: ', err.message);
    // })

    port.on('data', function (buffer) {

        if (receivedData.length > 1000) {
            receivedData = [];
        }

        var data = new Uint8Array(buffer);
        data.forEach(function (el) {
            receivedData.push(el);
        })
    });
}


// setInterval(function () {
//     console.log(receivedData.length);
//     receivedData = [];
// }, 1000);



io.on('connection', function (socket) {
    console.log("new connection");

    socket.on('get data', function (msg) {
        console.log(receivedData);
        io.emit('new data', receivedData);
    });
});

app.use(express.static('public'));

http.listen(settings.webserver.port, function () {
    console.log('Server started at port ' + settings.webserver.port);
});