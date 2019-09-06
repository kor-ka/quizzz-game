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
const makeId_1 = require("../utils/makeId");
const MDB_1 = require("../MDB");
const bson_1 = require("bson");
exports.USERS = () => MDB_1.MDB.collection('users');
exports.toClient = (user) => {
    return { _id: user._id.toHexString(), name: user.name };
};
exports.createUser = () => __awaiter(void 0, void 0, void 0, function* () {
    let token = makeId_1.makeId();
    let u = yield exports.USERS().insertOne({ token });
    console.warn(u.insertedId);
    return { id: u.insertedId.toHexString(), token };
});
exports.getUser = (id, token) => {
    return exports.USERS().findOne(Object.assign({ _id: new bson_1.ObjectId(id) }, (token !== undefined ? { token } : {})));
};
exports.handleMessage = (id, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (message.type === 'UserRename') {
        exports.USERS().updateOne({ _id: new bson_1.ObjectId(id) }, { $set: { name: message.name } });
    }
});
exports.watchUser = (id, onUpdated) => {
    let stream = exports.USERS().watch([{ $match: { _id: id } }]);
    stream.on('change', next => {
        onUpdated(next);
    });
    return () => __awaiter(void 0, void 0, void 0, function* () {
        yield stream.close();
        stream.destroy();
    });
};
