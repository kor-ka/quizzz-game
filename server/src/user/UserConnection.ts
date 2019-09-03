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
        console.warn(this.socket.request.headers.cookie);
        for (let h of this.socket.request.headers.cookie.split('; ')) {
            let cookie = decodeURIComponent(h);
            console.warn(cookie);
            if (cookie.startsWith('quizzz-game-user=')) {

                let auth = cookie.replace('quizzz-game-user=', '');
                if (typeof auth === 'string') {
                    console.warn(auth);
                    let split = auth.split(':');
                    let user = await getUser(split[0], split[1]);
                    console.warn(user);
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

        await handleMessage(this.user!._id.toHexString(), message);

        if (this.sessionWatcher) {
            await this.sessionWatcher.handleMessage(message);
        }

    }

    emit = (event: Event | Event[]) => {
        let events = Array.isArray(event) ? event : [event];
        this.socket.emit('event', JSON.stringify({ batch: events }));
    }

    close = () => {
        this.socket.disconnect();
        if (this.sessionWatcher) {
            this.sessionWatcher.dispose();
        }
    }
}