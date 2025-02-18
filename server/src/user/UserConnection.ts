import { Socket } from 'socket.io'
import { User, getUser, handleMessage as userHandeMessage } from './User';
import { Event } from '../entity/events';
import { Message } from '../entity/messages';
import { SessionWatcher, getSessionWatcher } from '../session/SesionWatcher';
import { handleMessage as sessionHandleMessage, SESSIONS } from '../session/Session';
import { gameHandleMessage } from '../game/Game';
import { makeId } from '../utils/makeId';
import { MDBClient } from '../MDB';
import { ClientSession, ObjectId } from 'mongodb';

export class UserConnection {
    id = makeId();
    socket: Socket
    user?: User;
    isMobile?: boolean;
    sessionWatcher?: SessionWatcher;
    inited = false;
    messages: Message[] = [];
    session: ClientSession;
    constructor(socket: Socket) {
        this.socket = socket;

        this.socket.on('message', async (m: string) => {
            console.log('[server](message): %s', m);
            if (!m) {
                return;
            }
            let message = JSON.parse(m) as Message
            this.handleMessage(message);

        });

        this.session = MDBClient.startSession({
            defaultTransactionOptions: {
                readConcern: { level: 'local' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary'
            }
        });

        this.init();
    }

    init = async () => {

        // autj
        for (let h of this.socket.request.headers.cookie.split('; ')) {
            let cookie = decodeURIComponent(h);
            if (cookie.startsWith('quizzz-game-user=')) {

                let auth = cookie.replace('quizzz-game-user=', '');
                if (typeof auth === 'string') {
                    let split = auth.split(':');
                    let user = await getUser(split[0], split[1]);
                    if (user) {
                        this.user = user;
                    }

                }
            }

            // detect is mobile
            if (cookie.startsWith('isMobile=')) {
                this.isMobile = h === 'isMobile=true';
            }
        }
        if (!this.user) {
            this.socket.disconnect();
        }
        this.inited = true;
        this.messages.forEach(async (m) => {
            await this.handleMessage(m);
        });
    }

    handleMessage = async (message: Message) => {
        await this.session.withTransaction(async () => {
            if (!this.inited) {
                this.messages.push(message);
                return;
            }
            // subscribe updates
            if (message.type === 'InitSession') {
                let _id;
                try {
                    _id = ObjectId.createFromHexString(message.id)
                } catch (e) {
                    // 
                }
                let s = await SESSIONS().findOne({ $or: [{ _id }, { alias: message.id }] });
                this.sessionWatcher = await getSessionWatcher(s._id.toHexString());
                this.sessionWatcher.addUserConnection(this);
            }

            // some actions
            await userHandeMessage(this.user!._id.toHexString(), message);
            await sessionHandleMessage(message, this.session);
            await gameHandleMessage(this.user!._id.toHexString(), message);
        });
    }

    emit = (event: Event | Event[]) => {
        let events = Array.isArray(event) ? event : [event];
        console.log('[EMIT]', event)
        this.socket.emit('event', JSON.stringify({ batch: events }));
    }

    close = async () => {
        if (this.sessionWatcher) {
            await this.sessionWatcher.removeUserConnection(this);
        }
    }
}