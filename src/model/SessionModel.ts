import * as socketIo from 'socket.io-client';
import { Message } from '../../server/src/entity/messages';
import { ClientUser } from '../../server/src/user/User';
import { SessionState } from '../../server/src/session/Session';
import * as Cookie from 'js-cookie';
import { Event } from '../../server/src/entity/events';
import { GameModel } from './GameModel';
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

export class SessionModel {
    id: string;
    io: Emitter;

    users = new Map<string, ClientUser>();
    usersListeners = new Set<(users: Map<string, ClientUser>) => void>();

    sesssionState: { state: SessionState | 'connecting', ttl: number } = { state: 'connecting', ttl: 0 };
    sesssionStateListeners = new Set<(sessionState: { state: SessionState | 'connecting', ttl: number }) => void>();

    myId: string;
    me?: ClientUser;
    meListeners = new Set<(me: ClientUser) => void>();

    isMobile?: boolean;

    game = new GameModel(this);

    constructor(id: string) {
        this.id = id;
        this.io = this.init();
        this.myId = Cookie.get('quizzz-game-user')!.split(':')[0];

        this.isMobile = Cookie.get('isMobile') === 'true';
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
        let batch: { batch: Event[] } = JSON.parse(batchRaw);
        let notifyers = new Set<() => void>();
        batch.batch.forEach(e => this.handleEvent(e, notifyers));
        notifyers.forEach(n => n());
    }

    handleEvent = (event: Event, notifyers: Set<() => void>) => {
        console.log('[event]', event);
        if (event.type === 'UserUpdatedEvent') {
            this.users.set(event.user._id, event.user);
            notifyers.add(this.notifyUser);
            if (event.user._id === this.myId) {
                this.me = event.user;
                notifyers.add(this.notifyMeUser);
            }
        } else if (event.type === 'SessionUserJoinedEvent') {
            this.users.set(event.user._id, event.user);
            if (event.user._id === this.myId) {
                this.me = event.user;
                notifyers.add(this.notifyMeUser);
            }
            notifyers.add(this.notifyUser);
        } else if (event.type === 'SessionUserLeftEvent') {
            this.users.delete(event.user._id);
            notifyers.add(this.notifyUser);
        } else if (event.type === 'SessionStateChangedEvent') {
            this.sesssionState = { state: event.state, ttl: event.ttl || 0 };
            notifyers.add(this.notifyState);
        }

        this.game.handleEvent(event, notifyers);
    }

    ////
    // io
    ////

    subscribeUsers = (listener: (users: Map<string, ClientUser>) => void) => {
        this.usersListeners.add(listener);
        listener(this.users);
        return () => {
            this.usersListeners.delete(listener);
        }
    }

    subscribeMeUser = (listener: (me: ClientUser) => void) => {
        this.meListeners.add(listener);
        if (this.me) { listener(this.me); }
        return () => {
            this.meListeners.delete(listener);
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
        this.usersListeners.forEach(l => l(new Map(this.users)));
        console.log('[session]', 'new users', this.users);

    }

    notifyMeUser = () => {
        this.meListeners.forEach(l => l({ ...this.me! }));
        console.log('[session]', 'new me', this.me);
    }

    notifyState = () => {
        this.sesssionStateListeners.forEach(l => l({ ...this.sesssionState }));
        console.log('[session]', 'new state', this.sesssionState);
    }
}