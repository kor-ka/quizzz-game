import { MongoClient, Db } from 'mongodb';

// Connection URL
const url = 'mongodb://heroku_6b7qf6gd:t7n4orhupolbp12cp0rdeg5vle@ds215338.mlab.com:15338/heroku_6b7qf6gd';

// Database Name
const dbName = 'quizzz-game';

const client = new MongoClient(url);

export let MDB: Db;

let connect = (resolve: (db: Db) => void) => {
    client.connect(error => {
        console.warn('[MDB]', 'connect');
        if (error) {
            console.warn('[MDB]', 'error');
            setTimeout(() => connect(resolve), 500);
        } else {
            console.warn('[MDB]', 'inited');
            resolve(client.db(dbName));
        }
    })
};

let getMDB = async () => {
    return new Promise<Db>((resolve) => {
        connect(resolve);
    });
}

export let initMDB = async () => {
    if (MDB) {
        return;
    }
    MDB = await getMDB();

    // indexes
    MDB.collection('sessionUsers').createIndex({ sid: 1, uid: 1 }, { unique: true });

}
