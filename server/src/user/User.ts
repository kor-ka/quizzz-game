import MDB from "../MDB";
import { Message } from "../entity/messages";
export let USERS = MDB.collection<User>('users');

export interface User {
    _id: string;
    name?: string;
    token: string
}

export interface ClientUser {
    _id: string;
    name?: string;
}

export let toClient = (user: User): ClientUser => {
    return { _id: user._id, name: user.name };
}

export let createUser = async () => {
    let token = makeId();
    let u = await USERS.insert({ token });
    return { id: u.insertedId.toHexString(), token };
}

export let getUser = async (id: string, token?: string) => {
    return USERS.findOne({ _id: id, ...(token !== undefined ? { token } : {}) });
}

export let handleMessage = async (id: string, message: Message) => {
    if (message.type === 'UserRename') {
        USERS.updateOne({ _id: id }, { $set: { name: message.name } });
    }
}

export let watchUser = (id: string, onUpdated: (user: User) => void) => {
    let stream = USERS.watch([{ $match: { _id: id } }]);
    stream.on('change', next => {
        onUpdated(next);
    });
    return async () => {
        await stream.close();
        stream.destroy();
    }
}