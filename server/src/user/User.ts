import { Message } from "../entity/messages";
import { makeId } from "../utils/makeId";
import { MDB } from "../MDB";
import { ObjectId, ObjectID } from "bson";
export let USERS = () => MDB.collection<User>('users');

export interface User {
    _id: ObjectID;
    name?: string;
    token: string
}

export interface ClientUser {
    _id: string;
    name?: string;
}

export let toClient = (user: User & { _id: ObjectId }): ClientUser => {
    return { _id: user._id.toHexString(), name: user.name };
}

export let createUser = async () => {
    let token = makeId();
    let u = await USERS().insertOne({ token });
    console.warn(u.insertedId);
    return { _id: u.insertedId, token };
}

export let getUser = (id: string, token?: string) => {
    return USERS().findOne({ _id: new ObjectId(id), ...(token !== undefined ? { token } : {}) });
}

export let handleMessage = async (id: string, message: Message) => {
    if (message.type === 'UserRename') {
        await USERS().updateOne({ _id: new ObjectId(id) }, { $set: { name: message.name } });
    }
}