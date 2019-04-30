
const BarnEvent = require('../../model/barn-event.js');

const ConfigFileAuthProvider = require('oci-node-sdk/src/codes/recursive/auth/ConfigFileAuthProvider.js');
const StreamingClient = require('oci-node-sdk/src/codes/recursive/client/StreamingClient.js');
const CreateGroupCursorRequest = require('oci-node-sdk/src/codes/recursive/model/streaming/CreateGroupCursorRequest.js');
const CreateGroupCursorDetails = require('oci-node-sdk/src/codes/recursive/model/streaming/CreateGroupCursorDetails.js');
const GetMessagesRequest = require('oci-node-sdk/src/codes/recursive/model/streaming/GetMessagesRequest.js');
const configAuthProvider = new ConfigFileAuthProvider(process.env.OCI_CONFIG_PATH || '~/.oci/config');

module.exports = class MessageConsumer {

    constructor(streamId, barnService, app) {
        this.streamId = streamId;
        this.barnService = barnService;
        this.expressApp = app;
        this.consumerInterval = null;
        this.client = new StreamingClient(configAuthProvider, 'us-phoenix-1');
    }

    start() {
        const createGroupCursorDetails = new CreateGroupCursorDetails('TRIM_HORIZON', 'group-0', null, null, null, true);
        const createGroupCursorRequest = new CreateGroupCursorRequest(this.streamId, createGroupCursorDetails);

        this.client.createGroupCursor(createGroupCursorRequest)
            .then((cursorResult) => {
                const getMessagesRequest = new GetMessagesRequest(this.streamId, cursorResult.body.value);
                this.consumerInterval = setInterval(() => {
                    //console.log(`${new Date()}[INFO] Checking ${this.streamId}`)
                    this.client.getMessages(getMessagesRequest)
                        .then((getMessageResult) => {
                            if( getMessageResult.hasOwnProperty("body") && getMessageResult.body.length ) {
                                getMessageResult.body.forEach((el, i) => {
                                    let msg = Buffer.from(el.value, 'base64').toString('binary');
                                    try {
                                        msg = JSON.parse(msg);
                                        console.log(`[INFO] Received: `, msg);
                                        const evt = new BarnEvent(null, msg.type, JSON.stringify(msg.data), new Date());
                                        if( evt.type != 'CAMERA_0' ) {
                                            this.expressApp.emit('incomingMessage', { message: { type: evt.type, capturedAt: evt.capturedAt, data: evt.data }, timestamp: evt.capturedAt });
                                        }
                                        try {
                                            this.barnService.save(evt)
                                        }
                                        catch(e) {
                                            console.log(e)
                                        }
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