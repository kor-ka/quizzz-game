"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
// Connection URL
const url = process.env.MONGODB_URI || require('../../secret.json').mdbUrl;
// Database Name
const dbName = 'quizzz-game';
const client = new mongodb_1.MongoClient(url);
let connect = (resolve) => {
    client.connect(error => {
        console.warn('[MDB]', 'connect', url);
        if (error) {
            console.warn('[MDB]', error);
            setTimeout(() => connect(resolve), 500);
        }
        else {
            console.warn('[MDB]', 'inited');
            resolve(client.db(dbName));
        }
    });
};
let getMDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        connect(resolve);
    });
});
exports.initMDB = () => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.MDB) {
        return;
    }
    exports.MDB = yield getMDB();
    // indexes
    exports.MDB.collection('sessionUsers').createIndex({ sid: 1, uid: 1 }, { unique: true });
    exports.MDB.collection('game_questions').createIndex({ qid: 1, gid: 1 }, { unique: true });
    exports.MDB.collection('game_user_answer').createIndex({ qid: 1, gid: 1, uid: 1 }, { unique: true });
    exports.MDB.collection('game_user_score').createIndex({ gid: 1, uid: 1 }, { unique: true });
    // MDB.collection('work_queue').createIndex({ ttl: 1 });
});
