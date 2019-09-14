import { MDB } from "../MDB";
import { User } from './User';
import { MDBChangeOp } from "../utils/MDBChangeOp";
export let USERS = () => MDB.collection<User>('users');

const listeners = new Map<string, Set<(user: User) => void>>();

const getListeners = (id: string) => {
    let ltnrs = listeners.get(id);
    if (!ltnrs) {
        ltnrs = new Set();
        listeners.set(id, ltnrs);
    }
    return ltnrs;
}

let started = false;
const startWatcher = () => {
    if (started) {
        return;
    }
    started = true;
    let watcher = USERS().watch([], { fullDocument: 'updateLookup' });
    watcher.on('change', async (next: MDBChangeOp<User>) => {
        if (next.operationType === 'update') {
            let ltnrs = getListeners(next.fullDocument._id.toHexString());
            ltnrs.forEach(l => l(next.fullDocument));
        }
    });

}

export const watchUser = (id: string, listener: (user: User) => void) => {
    startWatcher();
    let ltnrs = getListeners(id);
    ltnrs.add(listener);
    return () => {
        ltnrs.delete(listener);
    }
}

