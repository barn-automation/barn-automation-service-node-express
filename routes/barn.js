const express = require('express');
const router = express.Router();
const BarnService = require('../service/barn-service.js');
const barnService = new BarnService();
const asyncHandler = require('express-async-handler')
const MessageProducer = require('../service/kafka/message-producer-service.js');
const config = require('../utils/config.js');
const producer = new MessageProducer(config.inTopicName, config.kafkaIncomingBootstrapServer);
const SSE = require('sse');
const cors = require('cors');

/* GET home page. */
router.get('/', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ health: "OK" }));
}));

router.get('/events/type/:type', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( await barnService.listEventsByEventType(req.params.type) ) );
}));

router.get('/events/type/:type/:offset/:max', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( await barnService.listEventsByEventType(req.params.type, req.params.offset, req.params.max) ) );
}));

router.get('/events/count/:type', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( { total: await barnService.countEventsByEventType(req.params.type) } ) );
}));

router.get('/events/count', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( { total: await barnService.countEvents() } ) );
}));

router.get('/events/:offset/:max', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( await barnService.listEvents(req.params.offset, req.params.max) ) );
}));

router.get('/events', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    res.send( JSON.stringify( await barnService.listEvents() ) );
}));

// enable pre-flight check for POST
router.options('/control', cors());

router.post('/control', cors(), asyncHandler( async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    producer.send(req.body);
    res.send( JSON.stringify( {sent: true} ) );
}));

router.get('/stream', cors(), (req, res, next) => {
    const client = new SSE.Client(req, res);
    client.initialize();
    client.send( JSON.stringify( {ok: true} ) );

    const messageHandler = (data) => {
        client.send(JSON.stringify({
            message: {
                type: data.message.type,
                capturedAt: data.message.capturedAt,
                data: JSON.parse(data.message.data)
            },
            timestamp: data.timestamp
        }));
    };

    res.app.on('incomingMessage', messageHandler);

    res.on('close', () => {
        console.log('closing...')
        res.app.removeListener('incomingMessage', messageHandler);
        client.close();
    });

});

module.exports = router;
