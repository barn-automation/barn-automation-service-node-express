const dateFormat = require('dateformat');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

module.exports = class BarnService {

    constructor(){
    }

    async getConnection(){
        /*
        NOTE:  must set env vars ATP_USER and ATP_PASSWORD
        */
        const connection = await oracledb.getConnection({
            user: process.env.ATP_USER,
            password: process.env.ATP_PASSWORD,
            connectString: 'barnevents_low',
        });
        return connection;
    }

    async test() {
        const connection = await this.getConnection();
        const result = await connection.execute("select SYSDATE from dual");
        connection.close();
        return result;
    }

    async save(barnEvent) {
        const connection = await this.getConnection();
        let result;
        try {
            result = await connection.execute("insert into BARN.BARN_EVENT (TYPE, DATA, CAPTURED_AT) values (:type, :data, to_timestamp(:capturedAt, 'yyyy-mm-dd HH24:mi:ss'))",
                {
                    type: barnEvent.type,
                    data: barnEvent.data,
                    capturedAt: dateFormat(barnEvent.capturedAt, 'yyyy-mm-dd HH:MM:ss'),
                }
            );
            await connection.commit();
            connection.close();
        }
        catch (e) {
            console.error('Error whilst saving -->', e);
        }
        return result;
    }

    async countEvents() {
        const connection = await this.getConnection();
        const result = await connection.execute("select count(1) as NUM from BARN_EVENT");
        connection.close();
        return result.rows[0]["NUM"];
    }

    async countEventsByEventType(type) {
        const connection = await this.getConnection();
        const result = await connection.execute("select count(1) as NUM from BARN_EVENT where type = :type", {type: type});
        connection.close();
        return result.rows[0]["NUM"];
    }

    async listEventsByEventType(type, offset=0, max=50) {
        const connection = await this.getConnection();
        const result = await connection.execute("select * from BARN_EVENT where TYPE = :type OFFSET :offset ROWS FETCH NEXT :max ROWS ONLY",
            {
                type: type,
                max: max,
                offset: offset
            }
        );
        connection.close();
        const events = result.rows.map((row) => {
            return {
                id: row.ID,
                type: row.TYPE,
                data: JSON.parse(row.DATA),
                capturedAt: row.CAPTURED_AT
            }
        })
        return events;
    }
    async listEvents(offset=0,max=50) {
        const connection = await this.getConnection();
        const result = await connection.execute("select * from BARN_EVENT OFFSET :offset ROWS FETCH NEXT :max ROWS ONLY",
            {
                max: max,
                offset: offset
            }
        );
        connection.close();
        const events = result.rows.map((row) => {
            return {
                id: row.ID,
                type: row.TYPE,
                data: JSON.parse(row.DATA),
                capturedAt: row.CAPTURED_AT
            }
        })
        return events;
    }
}