const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const barnRouter = require('./routes/barn');
const config = require('./utils/config.js');
const MessageConsumer = require('./service/streaming/message-consumer-service.js');
const CameraConsumer = require('./service/streaming/camera-consumer-service.js');
const BarnService = require('./service/barn-service.js');
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const getBarnService = async () => {
    const bs = await BarnService.init();
    console.log('gotem')
    return bs;
};

app.get('/', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ health: "OK", at: new Date(), source: 'node-express' }));
})
app.use('/barn', barnRouter);

const cameraConsumer = new CameraConsumer(config.cameraStreamId, app);
cameraConsumer.start();

BarnService.init().then((barnService) => {
    app.set('barnService', barnService);
    const messageConsumer = new MessageConsumer(config.outgoingStreamId, app.get('barnService'), app);
    messageConsumer.start();
});

process.on('exit', function() {
    app.get('barnService').close();
    console.log('goodbye rabbit...');
});

module.exports = app;
