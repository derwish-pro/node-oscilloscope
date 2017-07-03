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
        baudRate: settings.baudRate
    });

    // port.on('open', function () {
    //     console.log('Port ' + portName + ' opened');
    // });

    // port.on('error', function (err) {
    //     console.log('Error: ', err.message);
    // })

    port.on('data', function (buffer) {
        var data = new Uint8Array(buffer);
        data.forEach(function (el) {
            addNewData(el);
        })
    });
}

var theshold = 0;
var dataLenth = 1000;

function addNewData(byte) {
    // calcFreq(byte);

    receivedData.push(byte);

    if (receivedData.length > dataLenth + 500
        || receivedData.length >= dataLenth && byte <= theshold) {
        io.emit('new data', receivedData);
        receivedData = [];
    }
}

var waveLength = 0;
var lastByte = 0;

function calcFreq(byte) {
    waveLength++;
    if (byte == 0 && byte != lastByte) {
        var bytesPerSec = settings.baudRate / 8;
        var freq = 1000 / ((1 / bytesPerSec * waveLength) * 1000);
        waveLength = 0;

        console.log(freq);
    }
    lastByte = byte;
}

calcFreq();

// setInterval(function () {
//     console.log(receivedData.length);
//     receivedData = [];
// }, 1000);



io.on('connection', function (socket) {
    console.log("new connection");

    socket.on('get data', function (msg) {
        // console.log(receivedData);
        // io.emit('new data', receivedData);
    });
});

app.use(express.static('public'));

http.listen(settings.webserver.port, function () {
    console.log('Server started at port ' + settings.webserver.port);
});