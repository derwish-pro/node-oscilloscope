var settings = require("./settings");
var SerialPort = require("serialport");
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);



var SYNC_TRESHOLD = 0;
var FRAME_LENGTH = 1000;
var FPS_LIMIT = 5


var lastFrameTime = new Date();
var receivedData = [];


function addNewData(byte) {
    // calcFreq(byte);

    receivedData.push(byte);

    //sync image    
    if (receivedData.length > FRAME_LENGTH * 1.5
        || receivedData.length >= FRAME_LENGTH && byte <= SYNC_TRESHOLD) {


        //check FPS
        var elapsedTime = new Date() - lastFrameTime;
        if (elapsedTime > 1000 / FPS_LIMIT) {
            io.emit('new data', receivedData);
            lastFrameTime = new Date();
        }
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



if (settings.serialport) {
    connectToSerialPort(settings.serialport);
}
else {
    SerialPort.list(function (err, ports) {
        ports.forEach(function (port) {
            if (port.manufacturer == 'Arduino LLC (www.arduino.cc)') {
                connectToSerialPort(port.comName);
            }
        })
    });
}


function connectToSerialPort(portName) {
    var port = new SerialPort(portName, {
        baudRate: settings.baudRate
    });

    port.on('open', function () {
        console.log('Port ' + portName + ' opened');
    });

    port.on('error', function (err) {
        console.log('Error: ', err.message);
    })

    port.on('data', function (buffer) {
        var data = new Uint8Array(buffer);
        data.forEach(function (el) {
            addNewData(el);
        })
    });
}


//send fake data
// var fakeData = 0;
// setInterval(function () {
//     for (var i = 0; i < 100; i++) {
//         fakeData++;
//         addNewData(fakeData);
//     }
// }, 5);