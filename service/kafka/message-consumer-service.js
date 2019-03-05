const Kafka = require('node-rdkafka');
const BarnService = require('../barn-service.js');
const barnService = new BarnService();
const BarnEvent = require('../../model/barn-event.js');

module.exports = class MessageConsumer {

    constructor(topic, server, app) {
        this.topic = topic;
        this.server = server;
        this.expressApp = app;
        this.consumer = new Kafka.KafkaConsumer({
            'group.id': 'barn_pi_group_2',
            'metadata.broker.list': server,
            'auto.offset.reset': 'earliest',
        }, {});
    }

    start() {
        this.consumer.connect();

        this.consumer.on('ready', () => {
            this.consumer.subscribe([this.topic]);
            this.consumer.consume();
        });

        this.consumer.on('data', (data) => {
            let msg = '';
            try {
                msg = JSON.parse(data.value.toString());
                //console.log(`[INFO] Received: `, msg);
                const evt = new BarnEvent(null, msg.type, JSON.stringify(msg.data), new Date(data.timestamp));
                barnService.save(evt);
                this.expressApp.emit("incomingMessage", { message: { type: evt.type, capturedAt: evt.capturedAt, data: evt.data }, timestamp: evt.capturedAt });
            }
            catch (e) {
                console.error('Error parsing msg ->', e);
            }
        });
    }
};