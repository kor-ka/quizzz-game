import { MongoClient, Db } from 'mongodb';

// Connection URL
const url = 'mongodb://heroku_6b7qf6gd:t7n4orhupolbp12cp0rdeg5vle@ds215338.mlab.com:15338/heroku_6b7qf6gd';

// Database Name
const dbName = 'quizzz-game';

const client = new MongoClient(url);

let MDB: Db;

let connect = (resolve: (db: Db) => void) => {
    client.connect(error => {
        if (error) {
            setTimeout(() => connect(resolve), 500);
        } else {
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
}

export default MDB!;

