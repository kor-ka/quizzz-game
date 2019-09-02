import { Socket } from 'socket.io'
import { User, getUser, handleMessage } from './User';
import { Event } from '../entity/events';
import { Message } from '../entity/messages';
import { SessionWatcher, getSessionWatcher } from '../Session';

export class UserConnection {
    socket: Socket
    user?: User;
    isMobile?: boolean;
    sessionWatcher?: SessionWatcher;
    constructor(socket: Socket) {
        this.socket = socket;
        this.init();
    }

    init = async () => {
        for (let k of Object.keys(this.socket.request.cookies || {})) {
            if (k === 'quizzz-game-user') {
                let auth = this.socket.request.cookies[k];
                if (typeof auth === 'string') {
                    let split = auth.split(':');
                    let user = await getUser(split[0], split[1]);
                    if (user) {
                        this.user = user;
                    }

                }
            }

            if (k === 'isMobile') {
                this.isMobile = this.socket.request.cookies[k] === 'true';
            }
        }
        if (!this.user) {
            this.socket.disconnect();
        }

        this.socket.on('message', async (m: string) => {
            console.log('[server](message): %s', m);
            if (!m) {
                return;
            }
            let message = JSON.parse(m) as Message
            this.handleMessage(message);

        });
    }

    handleMessage = async (message: Message) => {
        if (message.type === 'InitSession') {
            this.sessionWatcher = await getSessionWatcher(message.id);
        }

        await handleMessage(this.user!._id, message);

        if (this.sessionWatcher) {
            await this.sessionWatcher.handleMessage(message);
        }

    }

    emit = (event: Event | Event[]) => {
        let events = Array.isArray(event) ? event : [event];
        this.socket.emit(JSON.stringify({ batch: events }));
    }

    close = () => {
        this.socket.disconnect();
        if (this.sessionWatcher) {
            this.sessionWatcher.dispose();
        }
    }
}