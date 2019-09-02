import { ObjectID } from "bson";

export interface MDBChangeOp<T> {
    documentKey: { _id: ObjectID };
    operationType: 'insert'
    | 'delete'
    | 'replace'
    | 'update'
    | 'drop'
    | 'rename'
    | 'dropDatabase'
    | 'invalidate';
    fullDocument: T
}