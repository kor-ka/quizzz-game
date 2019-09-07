(window["webpackJsonpquizzz-game"]=window["webpackJsonpquizzz-game"]||[]).push([[0],{109:function(e,t,n){"use strict";n.r(t);var i=n(0),o=n.n(i),r=n(15),a=n.n(r),s=(n(51),n(52),n(7)),c=n(4),u=n(41),l=n(22);function d(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,i)}return n}function f(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?d(n,!0).forEach(function(t){Object(s.a)(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):d(n).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}var m=function e(t){var n=this;Object(c.a)(this,e),this.session=void 0,this.state={scores:new Map,state:"wait",ttl:0,stack:[]},this.setState=function(e){n.state=f({},n.state,{},e)},this.listeners=new Set,this.listen=function(e){return n.listeners.add(e),e(n.state),function(){n.listeners.delete(e)}},this.notify=function(){n.listeners.forEach(function(e){return e(n.state)})},this.handleEvent=function(e,t){if("GameStateChangedEvent"===e.type){"wait"===n.state.state&&"question"===e.state&&n.session.onGameStarted(),e.stack.reverse();var i=e.stack.map(function(t){var n=t.qid===(e.question&&e.question._id);return console.warn(t.qid,e.question&&e.question._id),f({},t,n?{question:e.question,active:!t.completed}:{active:!0})});n.setState({id:e.gid,question:e.question,state:e.state,ttl:e.ttl||0,stack:i}),t.add(n.notify)}else if("GameScoreChangedEvent"===e.type){var o=n.session.users.get(e.uid);o&&(n.state.scores.set(e.uid,{user:o,score:e.score}),n.setState({scores:new Map(n.state.scores)})),t.add(n.notify)}},this.reset=function(){n.state={scores:new Map,state:"wait",ttl:0,stack:[]},n.notify()},this.session=t};function h(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,i)}return n}function p(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?h(n,!0).forEach(function(t){Object(s.a)(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):h(n).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}var g=window.location.hostname.indexOf("localhost")>=0?"http://localhost:5000":"",b=function e(t){var n=this;Object(c.a)(this,e),this.socket=void 0,this.emit=function(e){n.socket.emit("message",JSON.stringify(e))},this.socket=t},v=function e(t){var n=this;Object(c.a)(this,e),this.id=void 0,this.io=void 0,this.users=new Map,this.usersListeners=new Set,this.sesssionState={state:"connecting",ttl:0},this.sesssionStateListeners=new Set,this.myId=void 0,this.me=void 0,this.meListeners=new Set,this.isMobile=void 0,this.game=new m(this),this.init=function(){var e=u(g,{transports:["websocket"],reconnectionAttempts:Number.MAX_SAFE_INTEGER}),t=new b(e);return e.on("event",n.handleBatch),e.on("connect",function(){return t.emit({type:"InitSession",id:n.id})}),e.on("disconnect",e.open),e.on("connect_error",e.open),e.on("connect_timeout",e.open),t},this.handleBatch=function(e){var t=JSON.parse(e),i=new Set;t.batch.forEach(function(e){return n.handleEvent(e,i)}),i.forEach(function(e){return e()})},this.handleEvent=function(e,t){console.log("[event]",e),"UserUpdatedEvent"===e.type?(n.users.set(e.user._id,e.user),t.add(n.notifyUser),e.user._id===n.myId&&(n.me=e.user,t.add(n.notifyMeUser))):"SessionUserJoinedEvent"===e.type?(n.users.set(e.user._id,e.user),e.user._id===n.myId&&(n.me=e.user,t.add(n.notifyMeUser)),t.add(n.notifyUser)):"SessionUserLeftEvent"===e.type?(n.users.delete(e.user._id),t.add(n.notifyUser)):"SessionStateChangedEvent"===e.type&&(n.sesssionState={state:e.state,ttl:e.ttl||0},t.add(n.notifyState),"await"===e.state&&n.game.reset()),n.game.handleEvent(e,t)},this.onGameStarted=function(){"countdown"===n.sesssionState.state&&(n.sesssionState={state:"game",ttl:0},n.notifyState())},this.subscribeUsers=function(e){return n.usersListeners.add(e),e(n.users),function(){n.usersListeners.delete(e)}},this.subscribeMeUser=function(e){return n.meListeners.add(e),n.me&&e(n.me),function(){n.meListeners.delete(e)}},this.subscribeSessionState=function(e){return n.sesssionStateListeners.add(e),e(n.sesssionState),function(){n.sesssionStateListeners.delete(e)}},this.notifyUser=function(){n.usersListeners.forEach(function(e){return e(new Map(n.users))}),console.log("[session]","new users",n.users)},this.notifyMeUser=function(){n.meListeners.forEach(function(e){return e(p({},n.me))}),console.log("[session]","new me",n.me)},this.notifyState=function(){n.sesssionStateListeners.forEach(function(e){return e(p({},n.sesssionState))}),console.log("[session]","new state",n.sesssionState)},this.id=t,this.io=this.init(),this.myId=l.get("quizzz-game-user").split(":")[0],this.isMobile="true"===l.get("isMobile")},w=n(2),y=n(1),S=n(42),E=n(44),x=n(43),O=n(45),k=n(3);function j(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,i)}return n}window.chrome;var C=k.a.div(function(e){return function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?j(n,!0).forEach(function(t){Object(s.a)(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):j(n).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}({display:"flex",flexDirection:"column",flexShrink:0,WebkitOverflowScrolling:"touch",boxSizing:"border-box","> *":e.style&&"row"===e.style.flexDirection?{marginLeft:void 0!==e.divider?e.divider:5,marginRight:void 0!==e.divider?e.divider:5}:{marginTop:void 0!==e.divider?e.divider:5,marginBottom:void 0!==e.divider?e.divider:5},">:first-child":e.style&&"row"===e.style.flexDirection?{marginLeft:0}:{marginTop:0},">:last-child":e.style&&"row"===e.style.flexDirection?{marginRight:0}:{marginBottom:0}},e.style)}),T=(k.a.div({"@media only screen and (orientation: portrait)":{display:"none"}}),k.a.div({"@media only screen and (orientation: landscape)":{display:"none"}}),k.a.div(function(e){return{minWidth:28,color:"black",whiteSpace:"pre-wrap",fontSize:"16px",backgroundColor:"danger"===e.type?"rgba(250, 200, 200, 0.6)":"rgba(250, 250, 250, 0.6)",padding:1,paddingTop:11,paddingBottom:9,display:"flex",flexDirection:"column",justifyContent:"center",borderRadius:10,cursor:"pointer",textAlign:"center",userSelect:"none",":focus":{outline:0}}})),z=function(e){return i.createElement(T,{type:e.type,className:e.className,style:e.style,onClick:e.onClick},e.children)},R=(k.a.div(function(e){return{whiteSpace:"pre-wrap",border:e.selected?"1px solid #3E5C6B":void 0,color:"rgba(0, 0, 0, 0.8)",fontSize:"16px",backgroundColor:"rgba(250, 250, 250, 0.4)",padding:10,borderRadius:10,userSelect:"none",cursor:"pointer"}}),k.a.div(function(e){return{whiteSpace:"pre-wrap",color:"rgba(0, 0, 0, 0.8)",fontSize:"16px",backgroundColor:"rgba(250, 250, 250, 0.4)",padding:10,userSelect:"none",borderRadius:10}}),k.a.input({minHeight:24,outline:0,borderWidth:"0 0 0px",backgroundColor:"transparent",fontSize:16,minWidth:50,lineHeight:1.5,appearance:"none"})),q=(window.chrome,i.createContext({})),P=function(e){function t(e){var n;return Object(c.a)(this,t),(n=Object(E.a)(this,Object(x.a)(t).call(this,e))).ref=i.createRef(),n.scene=void 0,n.cam=void 0,n.renderer=void 0,n.frameId=void 0,n.minSceneCamZ=500,n.tickListeners=new Set,n.subscribeTicks=function(e){return n.tickListeners.add(e),function(){n.tickListeners.delete(e)}},n.start=function(){n.frameId||(n.frameId=requestAnimationFrame(n.tick))},n.stop=function(){cancelAnimationFrame(n.frameId)},n.tick=function(){n.tickListeners.forEach(function(e){return e()}),n.renderScene(),n.frameId=window.requestAnimationFrame(n.tick)},n.renderScene=function(){n.renderer.render(n.scene,n.cam)},n.state={},n}return Object(O.a)(t,e),Object(S.a)(t,[{key:"componentDidMount",value:function(){if(this.ref.current){var e=r.findDOMNode(this.ref.current),t=e.clientWidth,n=e.clientHeight;this.scene=new y.k,this.cam=new y.i(75,t/n,.1,Number.MAX_SAFE_INTEGER),this.cam.position.z=this.minSceneCamZ,this.cam.position.y=-500;var i=new y.b(16777215,1);i.position.set(0,10,400),i.target.position.set(5,500,200),this.scene.add(i),this.scene.add(i.target),this.renderer=new y.o({antialias:!0}),this.renderer.setClearColor("#ffffff"),this.renderer.setSize(t,n),e.appendChild(this.renderer.domElement),new y.d(1e5,1e3).rotateX(1.5708),this.start(),this.setState({scene:this.scene,cam:this.cam})}}},{key:"componentWillUnmount",value:function(){this.stop()}},{key:"render",value:function(){return i.createElement(q.Provider,{value:{scene:this.state.scene,cam:this.state.cam,subscribeTicks:this.subscribeTicks}},i.createElement("div",{style:{width:window.innerWidth,height:window.innerHeight},ref:this.ref}),i.createElement(C,{style:{width:"100%",height:"100%",position:"absolute"}},this.state.cam&&this.state.scene&&this.props.children))}}]),t}(i.PureComponent),M=function(){var e=i.useState({state:"connecting",ttl:0}),t=Object(w.a)(e,2),n=t[0],o=t[1],r=i.useState(0),a=Object(w.a)(r,2),s=(a[0],a[1]),c=i.useState(!1),u=Object(w.a)(c,2),l=u[0],d=u[1],f=i.useContext(Q);i.useEffect(function(){return f.subscribeSessionState(function(e){d(!1),o(e)})},[f]),i.useEffect(function(){var e=setInterval(function(){var t=n.ttl-(new Date).getTime();s(t),t<=0&&clearInterval(e)},100)},[n.ttl]);var m=i.useCallback(function(){d(!0),"await"===n.state?f.io.emit({type:"SessionStartGameCountdown",id:f.id}):f.io.emit({type:"SessionStopGameCountdown",id:f.id})},[n.state]);i.useCallback(function(){f.io.emit({type:"SessionReset",id:f.id})},[n.state]);return i.createElement(C,{style:{position:"absolute",height:"100%",width:"100%",zIndex:100}},i.createElement(D,null),("await"===n.state||"countdown"===n.state)&&i.createElement(z,{onClick:m,style:{opacity:l?.5:1,position:"fixed",bottom:20,left:20,right:20,fontSize:120}},"await"===n.state?"start":Math.floor(Math.max(0,(n.ttl-(new Date).getTime())/1e3))))},D=function(){var e=i.useState(),t=Object(w.a)(e,2),n=t[0],o=t[1],r=i.useContext(Q);i.useEffect(function(){return r.subscribeMeUser(function(e){o(e)})},[r]);var a=i.useCallback(function(e){r.io.emit({type:"UserRename",name:e.target.value})},[]);return i.createElement(R,{style:{alignSelf:"strech",textAlign:"center",fontSize:50,padding:20},defaultValue:n?n.name:"",onChange:a,placeholder:"Your Name"})},A=function(e){var t=i.useState(),n=Object(w.a)(t,2),o=n[0],r=n[1],a=i.useCallback(function(t){r(t),e.onPick(t)},[]);return i.createElement(i.Fragment,null,e.answers.map(function(e){return i.createElement(z,{style:{backgroundColor:e===o?"black":"white",color:e===o?"white":"black"},onClick:function(){return a(e)}},e)}))},I=function(e){var t=i.useState(),n=Object(w.a)(t,2),o=(n[0],n[1]),r=i.useCallback(function(t){var n=t.target.value;o(n),e.onPick(n)},[]);return i.createElement(i.Fragment,null,i.createElement(R,{style:{border:"1px solid black",borderRadius:8},onChange:r}))},L=function(){var e=i.useContext(Q),t=i.useState(0),n=Object(w.a)(t,2),o=n[0],r=n[1],a=i.useState(e.game.state),s=Object(w.a)(a,2),c=s[0],u=s[1];return i.useEffect(function(){return e.game.listen(function(e){u(e)})},[e]),i.useEffect(function(){var e=setInterval(function(){var t=Math.floor(Math.max(0,(c.ttl-(new Date).getTime())/1e3));r(t),t<=0&&clearInterval(e)},100)},[c.ttl]),i.createElement(i.Fragment,null,o)},U=function(e){var t=i.useState(),n=Object(w.a)(t,2),o=n[0],r=n[1],a=i.useState(!1),s=Object(w.a)(a,2),c=s[0],u=s[1],l=i.useCallback(function(e){r(e)},[]),d=i.useContext(Q),f=i.useCallback(function(){o&&!c&&(d.io.emit({type:"Answer",gid:e.gid,answer:o,qid:e.q._id}),u(!0))},[o]),m=330*(window.innerWidth/460);return i.createElement(i.Fragment,null,i.createElement(C,{style:{position:"absolute",height:"100%",width:"100%",overflowY:"scroll"},divider:0},i.createElement(C,{style:{height:m},divider:0}),i.createElement(C,{style:{flexGrow:1,backgroundColor:"rgba(100,100,100, 0.5)",padding:20,paddingBottom:68},divider:0},i.createElement(C,{style:{pointerEvents:c?"none":"auto"}},e.q.open&&i.createElement(I,{onPick:l}),e.q.textAnswers&&i.createElement(A,{answers:e.q.textAnswers,onPick:l})),i.createElement(z,{onClick:f,style:{opacity:!o||c?.5:1,color:"white",fontSize:"22px",background:"black",position:"fixed",bottom:20,right:20,borderRadius:48,width:148,height:48}},c?"ANSWERED":"SUBMIT"),i.createElement(z,{style:{backgroundColor:"transparent",opacity:.5,color:"black",fontSize:"22px",position:"fixed",bottom:20,left:20,borderRadius:48,width:148,height:48,textAlign:"left"}},i.createElement(L,null)))))},_=function(e){return i.createElement(C,{style:{height:"100%",width:"100%",padding:20,overflowY:"scroll"}},Array.from(e.game.scores.values()).sort(function(e,t){return t.score-e.score}).map(function(e){return i.createElement(C,{style:{padding:20,backgroundColor:"rgba(100,100,100, 0.5)",borderRadius:20}},e.user.name+": "+e.score)}),i.createElement(z,{style:{backgroundColor:"transparent",opacity:.5,color:"black",fontSize:"22px",position:"fixed",bottom:20,left:20,borderRadius:48,width:148,height:48,textAlign:"left"}},i.createElement(L,null)))},F=function(){var e=i.useContext(Q),t=i.useState(e.game.state),n=Object(w.a)(t,2),o=n[0],r=n[1];return i.useEffect(function(){return e.game.listen(function(e){r(e)})},[e]),i.createElement(i.Fragment,null,e.isMobile&&"question"===o.state&&o.question&&i.createElement(U,{key:o.question._id,q:o.question,gid:o.id}),("subResults"===o.state||"results"===o.state)&&i.createElement(_,{game:o}),!e.isMobile&&i.createElement(z,{style:{backgroundColor:"transparent",opacity:.5,color:"black",fontSize:"22px",position:"fixed",bottom:20,left:20,borderRadius:48,width:148,height:48,textAlign:"left"}},i.createElement(L,null)))},W=n(8),N=function(e){var t=e.width,n=e.height,i=e.text,o=e.fontSize,r=e.padding,a=e.color,s=e.font,c=e.bold,u=e.x,l=e.y;r=r||0,a=a||"black",s=s||"Arial";var d=document.createElement("canvas");d.width=t*devicePixelRatio,d.height=n*devicePixelRatio;var f=d.getContext("2d");f.scale(devicePixelRatio,devicePixelRatio);var m=t,h=o;f.font="".concat(c?"bold":""," ").concat(o,"px ").concat(s),f.fillStyle="rgba(0,0,0,0)",f.fillRect(0,0,1e3,1e3),function(e,t,n,i,o,r,a,s,c){var u=t.split(" "),l="";e.fillStyle=o;for(var d=[],f=0,m=0;m<u.length;m++){var h=l+u[m]+" ";if(e.measureText(h).width>n-2*a&&m>0){d.push(l);var p=e.measureText(l);f=Math.max(f,p.width),l=u[m]+" "}else l=h}p=e.measureText(l);d.push(l),f=Math.max(f,p.width);for(var g=i+(r-i*d.length)/2+(c||0),b=(n-f)/2+(s||0),v=0;v<d.length;v++)e.fillText(d[v],b,g+i*v)}(f,i,m,h,a,n,r,u,l);var p=new y.m(d);p.needsUpdate=!0,p.minFilter=y.e;var g=new y.h({map:p,transparent:!0}),b=new y.g(new y.j(t,n,10,10),g);return d.remove(),b},B=n(24),G=n.n(B),J=function(e,t,n){return e+(t-e)*n},H=function(e){var t=0,n=e.length,i=0;if(n>0)for(;i<n;)t=(t<<5)-t+e.charCodeAt(i++)|0;return t},V=function(){return i.createElement("div",{style:{display:"flex",flexDirection:"column",width:"100%",height:"100%"}},i.createElement(P,null,i.createElement(X,null)))},X=function(){var e=i.useContext(Q),t=(i.useContext(q),i.useState("idle")),n=Object(w.a)(t,2),o=n[0],r=n[1];i.useEffect(function(){var t=e.sesssionState,n=e.users,i=function(){"await"===t.state||"connecting"===t.state?r(0===n.size?"idle":"joining"):"countdown"===t.state?r("joining"):"game"===t.state&&r("game"),console.warn(t,n)},o=e.subscribeSessionState(function(e){t=e,i()}),a=e.subscribeUsers(function(e){n=n,i()});return function(){o(),a()}},[]);i.useCallback(function(){r("idle")},[]),i.useCallback(function(){r("joining")},[]);return i.createElement(i.Fragment,null,e.isMobile&&"joining"===o&&i.createElement(M,null),"game"===o&&i.createElement(F,null),i.createElement(Z,null))},Y=i.memo(function(e){var t=i.useContext(Q),n=i.useContext(q),o=i.useState(function(){var e=new y.l;e.moveTo(0,220),e.lineTo(0,400),e.absarc(40,400,40,y.f.degToRad(180),y.f.degToRad(90),!0),e.lineTo(270,440),e.absarc(270,400,40,y.f.degToRad(90),y.f.degToRad(0),!0),e.lineTo(310,40),e.absarc(270,40,40,y.f.degToRad(0),y.f.degToRad(270),!0),e.lineTo(40,0),e.absarc(40,40,40,y.f.degToRad(270),y.f.degToRad(180),!0),e.lineTo(0,220);var t=new y.c(e,{steps:1,depth:3,bevelEnabled:!1}),n=new y.h({color:16777215}),i=new y.g(t,n);i.geometry.center();var o=N({width:440,height:310,text:"Q?",fontSize:440,font:"Courier",bold:!0,x:200,y:-85});return i.add(o),o.position.z=2,o.rotation.z=y.f.degToRad(90),i}()),r=Object(w.a)(o,1)[0],a=function(e){var t=i.useContext(q),n=i.useState({to:{},from:{},start:0,end:0}),o=Object(w.a)(n,2),r=o[0],a=o[1],s=i.useCallback(function(t,n){var i=(new Date).getTime();a({to:t,from:{position:e.position.clone(),rotation:e.rotation.toVector3()},start:i,end:i+n,rcb:t.rcb?G.a.apply(void 0,Object(W.a)(t.rcb)):void 0,pcb:t.pcb?G.a.apply(void 0,Object(W.a)(t.pcb)):void 0})},[]);return i.useEffect(function(){var n=t.subscribeTicks(function(){var t=(new Date).getTime(),n=t<r.end?(t-r.start)/(r.end-r.start):1;if(r.to.position){var i=r.pcb?r.pcb(n):n;e.position.x=J(r.from.position.x,r.to.position.x,i),e.position.y=J(r.from.position.y,r.to.position.y,i),e.position.z=J(r.from.position.z,r.to.position.z,i)}if(r.to.rotation){var o=r.rcb?r.rcb(n):n;e.rotation.x=J(r.from.rotation.x,r.to.rotation.x,o),e.rotation.y=J(r.from.rotation.y,r.to.rotation.y,o),e.rotation.z=J(r.from.rotation.z,r.to.rotation.z,o)}});return function(){var e=(new Date).getTime();setTimeout(n,(r.end||e)-e),n()}},[r]),{to:s}}(r).to;return i.useEffect(function(){r.position.z=6*e.index+700,r.rotation.z=y.f.degToRad(-45);var t=H(e.qid+"x")%10-5;r.position.x+=t;var i=H(e.qid+"y")%10-5;r.position.y+=i;var o=y.f.degToRad(5),s=H(e.qid+"z")%o-o/2;r.rotation.z+=s;var c=r.position.clone();return c.z-=700,a({position:c,pcb:[.74,.08,.89,.78]},500),n.scene.add(r),function(){n.scene.remove(r)}},[]),i.useEffect(function(){if(e.question)if(e.active){var i=y.f.degToRad(90-n.cam.fov/2),o=165*Math.tan(i),r=330*n.cam.aspect/2,s=Math.atan(o/r),c=230*Math.tan(s),u=new y.g;if(n.cam.add(u),u.translateZ(-Math.max(o,c)),t.isMobile){var l=2*Math.max(o,c)*Math.tan(y.f.degToRad(n.cam.fov/2));u.position.y+=(l-310)/2-10}var d=new y.n;u.getWorldPosition(d);var f=n.cam.rotation.clone();f.z+=y.f.degToRad(-90),f.x+=y.f.degToRad(-180);var m=f.toVector3();a({position:d,pcb:[.34,.24,.18,1.06],rotation:m,rcb:[.42,0,.3,1.01]},1e3)}else console.log(e.qid,"animate to old"),a({position:new y.n(100,0,700),rotation:new y.n(y.f.degToRad(-90),0,y.f.degToRad(0))},200)},[e.question,e.active]),i.useEffect(function(){if(e.question&&e.question.text){var t=N({width:440,height:310,text:e.question.text,fontSize:40,padding:40});r.add(t),t.rotation.x=y.f.degToRad(180),t.rotation.z=y.f.degToRad(-90),t.position.z=-2}return function(){void 0}},[e.question&&e.question.text]),i.createElement("div",{style:{display:"none"}})}),Z=function(){i.useContext(q).cam.rotation.x=y.f.degToRad(45);var e=i.useContext(Q),t=i.useState([]),n=Object(w.a)(t,2),o=n[0],r=n[1];return i.useEffect(function(){e.game.listen(function(e){r(e.stack)})},[]),i.createElement(i.Fragment,null,o.map(function(e,t){return i.createElement(Y,Object.assign({key:e.qid,index:t},e))}))},Q=o.a.createContext(void 0),$=function(){var e=window.location.pathname.split("/").filter(function(e){return e.length})[0],t=new v(e);return o.a.createElement(Q.Provider,{value:t},o.a.createElement(V,null))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));a.a.render(o.a.createElement($,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})},46:function(e,t,n){e.exports=n(109)},51:function(e,t,n){},52:function(e,t,n){},75:function(e,t){}},[[46,1,2]]]);
//# sourceMappingURL=main.8f12055f.chunk.js.map