const BarnEvent = require('../../model/barn-event.js');

const ConfigFileAuthProvider = require('oci-node-sdk/src/codes/recursive/auth/ConfigFileAuthProvider.js');
const StreamingClient = require('oci-node-sdk/src/codes/recursive/client/StreamingClient.js');
const CreateCursorRequest = require('oci-node-sdk/src/codes/recursive/model/streaming/CreateCursorRequest.js');
const CreateCursorDetails = require('oci-node-sdk/src/codes/recursive/model/streaming/CreateCursorDetails.js');
const GetMessagesRequest = require('oci-node-sdk/src/codes/recursive/model/streaming/GetMessagesRequest.js');
const configAuthProvider = new ConfigFileAuthProvider(process.env.OCI_CONFIG_PATH || '~/.oci/config');

module.exports = class CameraConsumer {

    constructor(streamId, app) {
        this.streamId = streamId;
        this.expressApp = app;
        this.consumerInterval = null;
        this.client = new StreamingClient(configAuthProvider, 'us-phoenix-1');
    }

    start() {
        const createCursorDetails = new CreateCursorDetails('0', 'LATEST');
        const createCursorRequest = new CreateCursorRequest(this.streamId, createCursorDetails);

        this.client.createCursor(createCursorRequest)
            .then((cursorResult) => {
                const getMessagesRequest = new GetMessagesRequest(this.streamId, cursorResult.body.value);
                this.consumerInterval = setInterval(() => {
                    //console.log(`${new Date()}[INFO] Checking ${this.streamId}`)
                    this.client.getMessages(getMessagesRequest)
                        .then((getMessageResult) => {
                            if( getMessageResult.body.length ) {
                                getMessageResult.body.forEach((el, i) => {
                                    let msg = Buffer.from(el.value, 'base64').toString('binary');
                                    try {
                                        msg = JSON.parse(msg);
                                        console.log(`[INFO] Received: `, msg);
                                        const evt = new BarnEvent(null, msg.type, JSON.stringify(msg.data), new Date());
                                        this.expressApp.emit('cameraMessage', { message: { type: evt.type, capturedAt: evt.capturedAt, data: evt.data }, timestamp: evt.capturedAt });
                                    }
                                    catch(ex) {
                                        console.error(ex);
                                    }
                                });
                            }
                            else {
                                //console.log(new Date().getTime(), '<--- no messages');
                            }
                            getMessagesRequest.cursor = getMessageResult.headers['opc-next-cursor'];
                        })
                        .catch((err) => console.log(err));
                }, 500);
            })
            .catch((err) => console.error(err));
    }

    close() {
        console.log(`[INFO] Closing ${this.streamId}`)
        clearInterval(this.consumerInterval);
    }
};