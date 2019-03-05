const config = {};
config.inTopicName = "incoming";
config.outTopicName = "outgoing";
config.kafkaOutgoingBootstrapServer = "129.146.79.59:6667";
config.kafkaIncomingBootstrapServer = "129.146.79.59:6667";

module.exports = config;