module.exports = class BarnEvent {
    constructor(id, type, data, capturedAt) {
        this.id = id;
        this.type = type;
        this.data = data;
        this.capturedAt = capturedAt;
    }
}