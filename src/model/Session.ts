import * as socketIo from 'socket.io-client';
import { Message } from '../../server/src/entity/messages';
import { ClientUser } from '../../server/src/user/User';
import { SessionState } from '../../server/src/Session';
import { Event } from '../../server/src/entity/events';

export const endpoint = window.location.hostname.indexOf('localhost') >= 0 ? 'http://localhost:5000' : '';

class Emitter {
    socket: SocketIOClient.Socket;
    constructor(socket: SocketIOClient.Socket) {
        this.socket = socket;
    }
    emit = (message: Message) => {
        this.socket.emit('message', JSON.stringify(message));
    }
}

export class Session {
    id: string;
    io: Emitter;

    users: ClientUser[] = [];
    usersListeners = new Set<(users: ClientUser[]) => void>();

    sesssionState: { state: SessionState | 'connecting', ttl: number } = { state: 'connecting', ttl: 0 };
    sesssionStateListeners = new Set<(sessionState: { state: SessionState | 'connecting', ttl: number }) => void>();

    constructor(id: string) {
        this.id = id;
        this.io = this.init();
    }

    init = () => {
        let socket = socketIo(endpoint, { transports: ['websocket'], reconnectionAttempts: Number.MAX_SAFE_INTEGER });
        let io = new Emitter(socket);
        socket.on('event', this.handleBatch);
        socket.on('connect', () => io.emit({ type: 'InitSession', id: this.id }));
        socket.on('disconnect', socket.open)
        socket.on('connect_error', socket.open)
        socket.on('connect_timeout', socket.open)

        return io;
    }

    handleBatch = (batchRaw: string) => {
        let batch = JSON.parse(batchRaw);
        let notifyers = new Set<() => void>();
        for (let event of batch.batch) {
            console.log('[event]', event);
            if (event.type === 'UserUpdatedEvent') {
                this.users = this.users.map(u => u._id === event.user._id ? event.user : u);
                notifyers.add(this.notifyUser);
            } else if (event.type === 'SessionUserJoinedEvent') {
                if (!this.users.find(u => u._id === event.user._id)) {
                    this.users.push(event.user);
                }
                notifyers.add(this.notifyUser);
            } else if (event.type === 'SessionUserLeftEvent') {
                this.users = this.users.filter(u => u._id !== event.user._id)
                notifyers.add(this.notifyUser);
            } else if (event.type === 'SessionStateChangedEvent') {
                this.sesssionState = { state: event.state, ttl: event.ttl || 0 };
                notifyers.add(this.notifyState);
            }
        }

        notifyers.forEach(n => n());
    }

    ////
    // io
    ////

    subscribeUsers = (listener: (users: ClientUser[]) => void) => {
        this.usersListeners.add(listener);
        listener([...this.users]);
        return () => {
            this.usersListeners.delete(listener);
        }
    }

    subscribeSessionState = (listener: (state: { state: SessionState | 'connecting', ttl: number }) => void) => {
        this.sesssionStateListeners.add(listener);
        listener(this.sesssionState);
        return () => {
            this.sesssionStateListeners.delete(listener);
        }
    }

    notifyUser = () => {
        this.usersListeners.forEach(l => l([...this.users]));
        console.log('[session]', 'new users', this.users);
    }

    notifyState = () => {
        this.sesssionStateListeners.forEach(l => l({ ...this.sesssionState }));
        console.log('[session]', 'new state', this.sesssionState);
    }
}