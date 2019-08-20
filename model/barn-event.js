module.exports = class BarnEvent {
    constructor(id, type, data, source, capturedAt) {
        this.id = id;
        this.type = type;
        this.data = data;
        this.source = source;
        this.capturedAt = capturedAt;
    }
}