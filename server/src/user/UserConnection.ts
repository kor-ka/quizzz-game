import { Socket } from 'socket.io'
import { User, getUser, handleMessage as userHandeMessage } from './User';
import { Event } from '../entity/events';
import { Message } from '../entity/messages';
import { SessionWatcher, getSessionWatcher } from '../session/SesionWatcher';
import { handleMessage as sessionHandleMessage } from '../session/Session';

export class UserConnection {
    socket: Socket
    user?: User;
    isMobile?: boolean;
    sessionWatcher?: SessionWatcher;
    inited = false;
    messages: Message[] = [];
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

        this.init();
    }

    init = async () => {
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

            if (cookie.startsWith('isMobile=')) {
                this.isMobile = h === 'isMobile=true';
            }
        }
        if (!this.user) {
            this.socket.disconnect();
        }
        this.inited = true;
        this.messages.forEach(this.handleMessage);
    }

    handleMessage = async (message: Message) => {
        if (!this.inited) {
            this.messages.push(message);
            return;
        }
        if (message.type === 'InitSession') {
            this.sessionWatcher = await getSessionWatcher(message.id);
            this.sessionWatcher.addUserConnection(this);
        }

        await userHandeMessage(this.user!._id.toHexString(), message);
        await sessionHandleMessage(message);
    }

    emit = (event: Event | Event[]) => {
        let events = Array.isArray(event) ? event : [event];
        this.socket.emit('event', JSON.stringify({ batch: events }));
    }

    close = () => {
        this.socket.disconnect();
        if (this.sessionWatcher) {
            this.sessionWatcher.removeUserConnection(this);
        }
    }
}