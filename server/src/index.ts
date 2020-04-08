import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
var path = require('path');
const PORT = process.env.PORT || 5000
import { createServer } from 'http';
import * as socketIo from 'socket.io';
import * as MobileDetect from 'mobile-detect';
import { initMDB } from './MDB';
import { createUser, getUser, User, USERS } from './user/User';
import { createSession, SESSIONS } from './session/Session';
import { UserConnection } from './user/UserConnection';
import { startWorker } from './workQueue/WorkQueue';
import { ObjectId } from 'mongodb';

const notSoSoon = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 1000);

//
// Configure http
//
let app = express();
app
  .use(bodyParser.json())
  .use(cookieParser())
  .get('/favicon.ico', async (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../public/favicon.ico'));
  })
  // .get('/legal/terms-and-conditions', async (req, res) => {
  //   res.sendFile(path.resolve(__dirname + '/../../public/terms.html'));
  // })
  // .get('/legal/privacy-policy', async (req, res) => {
  //   res.sendFile(path.resolve(__dirname + '/../../public/privacy-policy.html'));
  // })
  // .get('/legal/cookie-policy', async (req, res) => {
  //   res.sendFile(path.resolve(__dirname + '/../../public/cookie-policy.html'));
  // })


  // .use(async (req, res, next) => {

  //   next();
  // })

  .use(async (req, res, next) => {
    await initMDB();
    next();
  })

  .get('/', (req, res) => {
    res.redirect('/new');
  })
  .get('/new', async (req, res) => {
    let target = await createSession();
    res.redirect('/' + target.insertedId.toHexString());
  })
  .use(express.static(path.resolve(__dirname + '/../../build')))
  .post('/test', async (req, res) => {
    console.log(req);
    console.log(req.body);
    console.log(req.headers);
  })
  .get('/:id', async (req, res) => {
    let id = req.params['id'];
    let _id;
    try {
      _id = ObjectId.createFromHexString(id)
    } catch (e) {
      // 
    }
    let session = await SESSIONS().findOne({ $or: [{ _id }, { alias: id }] });
    if (!session) {
      await createSession(id);
    }
    let local = req.hostname.includes('localhost');
    let secureCookie = local ? {} : { secure: true, sameSite: 'None' };
    // detect host
    let md = new MobileDetect(req.headers['user-agent'] as string);
    res.cookie('isMobile', (md.mobile() || req.query.name) ? 'true' : 'false', { ...secureCookie });
    // auth if not
    let user: User | undefined;
    for (let k of Object.keys(req.cookies || {})) {
      if (k === 'quizzz-game-user') {
        let auth = req.cookies[k].split(':');
        user = await getUser(auth[0], auth[1]);
        if (user) {
          // reset old auth - new flags
          res.cookie('quizzz-game-user', `${auth[0]}:${auth[1]}`, { expires: notSoSoon, ...secureCookie });
          break;
        }
      }
    }
    if (!user) {
      user = await createUser();
      res.cookie('quizzz-game-user', `${user._id}:${user.token}`, { expires: notSoSoon, ...secureCookie });
    }
    if (req.query.name) {
      await USERS().updateOne({ _id: user._id }, { $set: { name: req.query.name } });
    }


    res.sendFile(path.resolve(__dirname + '/../../build/index.html'));
  })

//
// Configure ws
//

let server = createServer(app);
let io = socketIo(server, { transports: ['websocket'] });

io.on('connect', async (socket) => {
  await initMDB();
  startWorker();
  console.log('Connected client on port %s.', PORT);
  let listener = new UserConnection(socket);

  socket.on('disconnect', async () => {
    await listener.close();
  });
});


server.listen(PORT, () => console.log(`lll on ${PORT}`))

