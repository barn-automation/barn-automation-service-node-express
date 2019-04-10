const dateFormat = require('dateformat');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

module.exports = class BarnService {

    constructor(defaultConnection, pool){
        this.defaultConnection = defaultConnection;
        this.pool = pool;
    }

    static getConnectionParameters() {
        return {
            user: process.env.ATP_USER,
            password: process.env.ATP_PASSWORD,
            connectString: 'barnevents_low',
        }
    }

    static async init() {
        console.log('constructing connection...')
        const pool = await oracledb.createPool({
            user: process.env.ATP_USER,
            password: process.env.ATP_PASSWORD,
            connectString: 'barnevents_low',
        });
        const defaultConnection = await pool.getConnection();
        console.log('constructing connection complete...')

        return new BarnService(defaultConnection, pool);
    }

    getConnection(){
        return this.defaultConnection
    }

    async test() {
        const connection = this.getConnection();
        const result = await connection.execute("select SYSDATE from dual");
        return result.rows;
    }

    save(barnEvent) {
        this.pool.getConnection().then( (conn) => {
            conn.execute("insert into BARN.BARN_EVENT (TYPE, DATA, CAPTURED_AT) values (:type, :data, to_timestamp(:capturedAt, 'yyyy-mm-dd HH24:mi:ss'))",
                {
                    type: barnEvent.type,
                    data: barnEvent.data,
                    capturedAt: dateFormat(barnEvent.capturedAt, 'yyyy-mm-dd HH:MM:ss'),
                }
            ).then( (result) => {
                conn.commit();
                conn.close();
            }).catch( (err) => {
                conn.close();
                console.error('[WARN] Save failed...')
            })
        }).catch( (err) => {
            console.error(err);
            console.error('[WARN] Could not get a connection...');
        })
    }

    async countEvents() {
        const connection = this.getConnection();
        const result = await connection.execute("select count(1) as NUM from BARN_EVENT");
        return result.rows[0]["NUM"];
    }

    async countEventsByEventType(type) {
        const connection = this.getConnection();
        const result = await connection.execute("select count(1) as NUM from BARN_EVENT where type = :type", {type: type});
        return result.rows[0]["NUM"];
    }

    async listEventsByEventType(type, offset=0, max=50) {
        const connection = this.getConnection();
        const result = await connection.execute("select * from BARN_EVENT where TYPE = :type OFFSET :offset ROWS FETCH NEXT :max ROWS ONLY",
            {
                type: type,
                max: max,
                offset: offset
            }
        );
        const events = result.rows.map((row) => {
            return {
                id: row.ID,
                type: row.TYPE,
                data: JSON.parse(row.DATA),
                capturedAt: row.CAPTURED_AT
            }
        });
        return events;
    }
    async listEvents(offset=0,max=50) {
        const connection = this.getConnection();
        const result = await connection.execute("select * from BARN_EVENT OFFSET :offset ROWS FETCH NEXT :max ROWS ONLY",
            {
                max: max,
                offset: offset
            }
        );
        const events = result.rows.map((row) => {
            return {
                id: row.ID,
                type: row.TYPE,
                data: JSON.parse(row.DATA),
                capturedAt: row.CAPTURED_AT
            }
        });
        return events;
    }

    async close() {
        this.connection.close();
        console.log("SQL Connection Pool closed")
    }
}