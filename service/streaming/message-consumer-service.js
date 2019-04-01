const BarnService = require('../barn-service.js');
const barnService = new BarnService();
const BarnEvent = require('../../model/barn-event.js');

const ConfigFileAuthProvider = require('oci-node-sdk/src/codes/recursive/auth/ConfigFileAuthProvider.js');
const StreamingClient = require('oci-node-sdk/src/codes/recursive/client/StreamingClient.js');
const CreateGroupCursorRequest = require('oci-node-sdk/src/codes/recursive/model/streaming/CreateGroupCursorRequest.js');
const CreateGroupCursorDetails = require('oci-node-sdk/src/codes/recursive/model/streaming/CreateGroupCursorDetails.js');
const GetMessagesRequest = require('oci-node-sdk/src/codes/recursive/model/streaming/GetMessagesRequest.js');
const configAuthProvider = new ConfigFileAuthProvider(process.env.OCI_CONFIG_PATH || '~/.oci/config');

module.exports = class MessageConsumer {

    constructor(streamId, app) {
        this.streamId = streamId;
        this.expressApp = app;
        this.client = new StreamingClient(configAuthProvider, 'us-phoenix-1');
    }

    start() {
        const createGroupCursorDetails = new CreateGroupCursorDetails('TRIM_HORIZON', 'group-0', null, null, null, true);
        const createGroupCursorRequest = new CreateGroupCursorRequest(this.streamId, createGroupCursorDetails);
        this.client.createGroupCursor(createGroupCursorRequest)
            .then((cursorResult) => {
                const getMessagesRequest = new GetMessagesRequest(this.streamId, cursorResult.body.value);
                setInterval(() => {
                    this.client.getMessages(getMessagesRequest)
                        .then((getMessageResult) => {
                            if( getMessageResult.body.length ) {
                                getMessageResult.body.forEach((el, i) => {
                                    let msg = Buffer.from(el.value, 'base64').toString('binary');
                                    try {
                                        msg = JSON.parse(msg);
                                        console.log(`[INFO] Received: `, msg);
                                        const evt = new BarnEvent(null, msg.type, JSON.stringify(msg.data), new Date());
                                        barnService.save(evt);
                                        this.expressApp.emit("incomingMessage", { message: { type: evt.type, capturedAt: evt.capturedAt, data: evt.data }, timestamp: evt.capturedAt });

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
};