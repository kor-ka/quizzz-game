import { MongoClient, Db } from 'mongodb';


// Connection URL
const url = process.env.MONGODB_URI || require('../../secret.json').mdbUrl;

// Database Name
const dbName = 'quizzz-game';

export const MDBClient = new MongoClient(url);

export let MDB: Db;

let connect = (resolve: (db: Db) => void) => {
    MDBClient.connect(error => {
        console.warn('[MDB]', 'connect', url);
        if (error) {
            console.warn('[MDB]', error);
            setTimeout(() => connect(resolve), 500);
        } else {
            console.warn('[MDB]', 'inited');
            resolve(MDBClient.db(dbName));
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

    MDB.collection('game_questions').createIndex({ qid: 1, gid: 1 }, { unique: true });
    MDB.collection('game_user_answer').createIndex({ qid: 1, gid: 1, uid: 1 }, { unique: true });
    MDB.collection('game_user_score').createIndex({ gid: 1, uid: 1 }, { unique: true });
    // MDB.collection('work_queue').createIndex({ ttl: 1 });

}
