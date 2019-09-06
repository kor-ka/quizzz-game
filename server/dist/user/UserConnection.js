"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./User");
const SesionWatcher_1 = require("../session/SesionWatcher");
const Session_1 = require("../session/Session");
const Game_1 = require("../game/Game");
const makeId_1 = require("../utils/makeId");
class UserConnection {
    constructor(socket) {
        this.id = makeId_1.makeId();
        this.inited = false;
        this.messages = [];
        this.init = () => __awaiter(this, void 0, void 0, function* () {
            // autj
            for (let h of this.socket.request.headers.cookie.split('; ')) {
                let cookie = decodeURIComponent(h);
                if (cookie.startsWith('quizzz-game-user=')) {
                    let auth = cookie.replace('quizzz-game-user=', '');
                    if (typeof auth === 'string') {
                        let split = auth.split(':');
                        let user = yield User_1.getUser(split[0], split[1]);
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
            this.messages.forEach(this.handleMessage);
        });
        this.handleMessage = (message) => __awaiter(this, void 0, void 0, function* () {
            if (!this.inited) {
                this.messages.push(message);
                return;
            }
            // subscribe updates
            if (message.type === 'InitSession') {
                this.sessionWatcher = yield SesionWatcher_1.getSessionWatcher(message.id);
                this.sessionWatcher.addUserConnection(this);
            }
            // some actions
            yield User_1.handleMessage(this.user._id.toHexString(), message);
            yield Session_1.handleMessage(message);
            yield Game_1.gameHandleMessage(this.user._id.toHexString(), message);
        });
        this.emit = (event) => {
            let events = Array.isArray(event) ? event : [event];
            console.log('[EMIT]', event);
            this.socket.emit('event', JSON.stringify({ batch: events }));
        };
        this.close = () => __awaiter(this, void 0, void 0, function* () {
            this.socket.disconnect();
            if (this.sessionWatcher) {
                yield this.sessionWatcher.removeUserConnection(this);
            }
        });
        this.socket = socket;
        this.socket.on('message', (m) => __awaiter(this, void 0, void 0, function* () {
            console.log('[server](message): %s', m);
            if (!m) {
                return;
            }
            let message = JSON.parse(m);
            this.handleMessage(message);
        }));
        this.init();
    }
}
exports.UserConnection = UserConnection;
