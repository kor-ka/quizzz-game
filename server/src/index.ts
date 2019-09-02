import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
var path = require('path');
const PORT = process.env.PORT || 5000
import { createServer } from 'http';
import * as socketIo from 'socket.io';
import * as MobileDetect from 'mobile-detect';
import { initMDB } from './MDB';
import { createUser } from './user/User';

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


  .use(async (req, res) => {
    let md = new MobileDetect(req.headers['user-agent'] as string);
    res.cookie('isMobile', md.mobile() ? 'true' : 'false');
  })

  .use(async (req, res) => {
    await initMDB();
  })

  // auth if not
  .use(async (req, res) => {
    for (let k of Object.keys(req.cookies || {})) {
      if (k === 'quizzz-game-user') {
        return;
      }
    }
    let u = await createUser();
    res.cookie('quizzz-game-user', `${u.id}:${u.token}`);
  })


  .get('/', (_, res) => {
    res.redirect('/new');
  })
  .get('/new', async (req, res) => {
    let target = await createSession();
    res.redirect('/' + target)
  })
  .use(express.static(path.resolve(__dirname + '/../../public')))
  .use('/build', express.static(__dirname + '/../../public/build'))
  .post('/test', async (req, res) => {
    console.log(req);
    console.log(req.body);
    console.log(req.headers);
  })
  .get('/:id', async (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../public/index.html'));
  })

//
// Configure ws
//

let server = createServer(app);
let io = socketIo(server, { transports: ['websocket'] });

io.on('connect', (socket) => {
  console.log('Connected client on port %s.', PORT);
  let listener = new SocketListener(socket);

  socket.on('disconnect', () => {
    listener.dispose();
  });
});


server.listen(PORT, () => console.log(`lll on ${PORT}`))

