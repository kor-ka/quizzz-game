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
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var path = require('path');
const PORT = process.env.PORT || 5000;
const http_1 = require("http");
const socketIo = require("socket.io");
const MobileDetect = require("mobile-detect");
const MDB_1 = require("./MDB");
const User_1 = require("./user/User");
const Session_1 = require("./session/Session");
const UserConnection_1 = require("./user/UserConnection");
const WorkQueue_1 = require("./workQueue/WorkQueue");
const notSoSoon = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 1000);
//
// Configure http
//
let app = express();
app
    .use(bodyParser.json())
    .use(cookieParser())
    .get('/favicon.ico', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile(path.resolve(__dirname + '/../../public/favicon.ico'));
}))
    // .get('/legal/terms-and-conditions', async (req, res) => {
    //   res.sendFile(path.resolve(__dirname + '/../../public/terms.html'));
    // })
    // .get('/legal/privacy-policy', async (req, res) => {
    //   res.sendFile(path.resolve(__dirname + '/../../public/privacy-policy.html'));
    // })
    // .get('/legal/cookie-policy', async (req, res) => {
    //   res.sendFile(path.resolve(__dirname + '/../../public/cookie-policy.html'));
    // })
    .use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let md = new MobileDetect(req.headers['user-agent']);
    res.cookie('isMobile', md.mobile() ? 'true' : 'false');
    next();
}))
    .use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield MDB_1.initMDB();
    next();
}))
    // auth if not
    .use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    for (let k of Object.keys(req.cookies || {})) {
        if (k === 'quizzz-game-user') {
            let auth = req.cookies[k].split(':');
            if (yield User_1.getUser(auth[0], auth[1])) {
                next();
                return;
            }
        }
    }
    let u = yield User_1.createUser();
    res.cookie('quizzz-game-user', `${u.id}:${u.token}`, { expires: notSoSoon });
    next();
}))
    .get('/', (req, res) => {
    res.redirect('/new');
})
    .get('/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let target = yield Session_1.createSession();
    res.redirect('/' + target.insertedId.toHexString());
}))
    .use(express.static(path.resolve(__dirname + '/../../build')))
    .post('/test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req);
    console.log(req.body);
    console.log(req.headers);
}))
    .get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.sendFile(path.resolve(__dirname + '/../../build/index.html'));
}));
//
// Configure ws
//
let server = http_1.createServer(app);
let io = socketIo(server, { transports: ['websocket'] });
io.on('connect', (socket) => __awaiter(void 0, void 0, void 0, function* () {
    yield MDB_1.initMDB();
    WorkQueue_1.startWorker();
    console.log('Connected client on port %s.', PORT);
    let listener = new UserConnection_1.UserConnection(socket);
    socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
        yield listener.close();
    }));
}));
server.listen(PORT, () => console.log(`lll on ${PORT}`));
