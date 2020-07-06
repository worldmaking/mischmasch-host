const WebSocket = require('ws');
// const app = require('express')()
// const http = require('http').createServer(app);;
const coven = require('coven/server')
const fs = require('fs')
let listenPort = (process.env.PORT || 8081)
const deltaWebsocketServer = new WebSocket.Server({ 'port': listenPort, clientTracking: true });

const got = require("./got/got")
const { argv } = require('yargs');

// custom keepAlive function to detect and handle broken connections

// function noop() {}

// function heartbeat() {
//   this.isAlive = true;
// }

// const interval = setInterval(function ping() {
//   deltaWebsocketServer.clients.forEach(function each(ws) {
//     if (ws.isAlive === false) {
//       // console.log(ws)
//       return ws.terminate();
//     }
 
//     ws.isAlive = false;
//     ws.ping(noop);
//   });
// }, 3000);

setInterval(() => {
  deltaWebsocketServer.clients.forEach((client) => {
    client.send(JSON.stringify({
      cmd: 'ping',
      //data: guestlist,
      date: Date.now() 
    }))
  });
}, 3000);


// a local copy of the current graph state, for synchronization purposes
let localGraph = {
	nodes: {},
	arcs: []
}

let recordStatus = 0
// http.listen(listenPort, function(){
//   // console.log('listening on ' + listenPort);
// })

  scenefile = JSON.parse(fs.readFileSync(__dirname + "/scene_rich.json"))
  // fs.writeFileSync('simpleGraph.json', JSON.stringify(sceneFile))
  localGraph = got.graphFromDeltas(scenefile)
  //console.log(localGraph)
	// turn this into deltas:
	

  //! host also has to run the p2p-mesh signalling server, because heroku only allows one port on the server instance
  // const p2pSignalBroker = require('coven/server');
  // const DEFAULT_PORT = 8082;
  // const PORT = +(process.env.PORT || DEFAULT_PORT);
 
  // p2pSignalBroker({
  //   port: PORT,
  //   onMessage({ room, type, origin, target }) {
  //     console.log(`[${room}::${type}] ${origin} -> ${target || '<BROADCAST>'}`);
  //   },
  // });



  let sessionId = 0;
  console.log('running deltaWebsocket as HOST')
  
  // let configp2p = JSON.stringify({
  //   cmd: 'p2pSignalServer',
  //   date: Date.now(), 
  //   data: localConfig.p2pSignalServer
  // })
  // sendAllLocalClients(configp2p)
  // whenever a pal connects to this websocket:
  deltaWebsocketServer.on('connection', function(deltaWebsocket, req) {
    let source;

    
    let deltas = got.deltasFromGraph(localGraph, []);
    let msg = JSON.stringify({
      cmd:'deltas',
      date: Date.now(),
      data: deltas
    })
    deltaWebsocket.send(msg)
      
    console.log(localGraph)
    // do any
    console.log("server received a connection");
    console.log("server has "+deltaWebsocketServer.clients.size+" connected clients");
    //	ws.id = uuid.v4();
    const id = ++sessionId;
    // const location = url.parse(req.url, true);
    // ip = req.connection.remoteAddress.split(':')[3] 
    ip = req.headers.host.split(':')[0]
    if(!ip){
      // console.log('vr', req.connection)
      ip = req.ip
    }
    //console.log(ip)
    // const location = urlw.parse(req.url, true);
    // console.log(location)

    deltaWebsocket.on('error', function (e) {
      if (e.message === "read ECONNRESET") {
        // ignore this, client will still emit close event
      } else {
        console.error("websocket error: ", e.message);
      }
    });

    // what to do if client disconnects?
    deltaWebsocket.on('close', function(connection) {
      //clearInterval(handShakeInterval);
      if(deltaWebsocketServer.clients.size === 0){
        // clearInterval(interval);
      }
      console.log("deltaWebsocket: connection closed");
          console.log("server has "+deltaWebsocketServer.clients.size+" connected clients");
    });
    
    // respond to any messages from the client:
    deltaWebsocket.on('message', function(e) {
      if (e instanceof Buffer) {
        // get an arraybuffer from the message:
        const ab = e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);
        //console.log("received arraybuffer", ab);
        // as float32s:
        //console.log(new Float32Array(ab));

      } else {
        try {
          handlemessage(JSON.parse(e), id);
          
        } catch (e) {
          console.log('bad JSON: ', e);
        }
      }
    });

  });


  function handlemessage(msg, id) {

    switch (msg.cmd) {

      case 'rsvp':{
        source = msg.data
      }
      break;

      case 'keepAlive':
        // ignore 
        console.log('line 167', msg)
      break


      case "deltas": {
        
        // runGOT(id, msg.data)

        // synchronize our local copy:
			try {
				//console.log('\n\npreApply', localGraph.nodes.resofilter_120)
				got.applyDeltasToGraph(localGraph, msg.data);
				//console.log('\n\npostApply', JSON.stringify(localGraph.nodes.resofilter_120.resonance))
			} catch (e) {
				console.warn(e);
			}

			//console.log(msg.data)
			// TODO: merge OTs
			
			let response = {
				cmd: "deltas",
				date: Date.now(),
				data: msg.data
			};
			console.log(msg.data)
			
			// check if the recording status is active, if so push received delta(s) to the recordJSON
			if (recordStatus === 1){
				
				for(i = 0; i < msg.data.length; i++){
					
					msg.data[i]["timestamp"] = Date.now()
					recordJSON.deltas.push(msg.data[i])
				}
				
			}

			//fs.appendFileSync(OTHistoryFile, ',' + JSON.stringify(response), "utf-8")

			//OTHistory.push(JSON.stringify(response))
			console.log('localgraph',localGraph, '\n')
			send_all_clients(JSON.stringify(response));

      } break;

      case "fromTeaparty":


      break
  
      // case "playback":{
      // 	//console.log(msg)/
      // 	console.log(msg.data)
      // 	/*
      // 	let response = {
      // 		cmd: "deltas",
      // 		date: Date.now(),
      // 		data: msg.data
      // 	};
      // 	// NOTE: this is copied from the deltas case, but i've commented out recording the playback since for now it'd just be redundant. 
      // 	// we might, though, at some point want to record when a playback occurred, and note when playback was stopped/looped/overdubbed/etc
      // 	//recordJSON.push(response)
      // 	//fs.writeFileSync(sessionRecording, JSON.stringify(recordJSON, null, "  "), "utf-8")
      // 	send_all_clients(JSON.stringify(response));
      // 	*/
      // } break;
  
      // case "initController":{
  
      //   // the max patch "control.maxpat" will request the current available sessions & scene files from the server:
  
      //   // get recorded sessions
      //   function fromDir(startPath,filter,callback){		
      //     if (!fs.existsSync(startPath)){
      //         console.log("no dir ",startPath);
      //         return;
      //     }
      //     var files=fs.readdirSync(startPath);
      //     for (var i=0;i<files.length;i++){
      //       var filename=path.join(startPath,files[i]);
      //       var stat = fs.lstatSync(filename);
      //       if (stat.isDirectory()){
      //           fromDir(filename,filter,callback); //recurse
      //       } else if (filter.test(filename)) callback(filename);
      //     };
      //   };
      
      //   fromDir(__dirname + '/session_recordings',/\.json$/,function(filename){
      //     filename = filename.split('\\').pop().split('/').pop();
      //     filesFound = {
      //       cmd: "sessionRecordings",
      //       date: Date.now(),
      //       data: filename
      //     };
      //     send_all_clients(JSON.stringify(filesFound));
      //   });
  
      //   // get scene files
      //   function fromDir(startPath,filter,callback){		
      //     if (!fs.existsSync(startPath)){
      //         console.log("no dir ",startPath);
      //         return;
      //     }
      //     var files=fs.readdirSync(startPath);
      //     for (var i=0;i<files.length;i++){
      //       var filename=path.join(startPath,files[i]);
      //       var stat = fs.lstatSync(filename);
      //       if (stat.isDirectory()){
      //           fromDir(filename,filter,callback); //recurse
      //       } else if (filter.test(filename)) callback(filename);
      //     };
      //   };
      
      //   fromDir(__dirname + '/scene_files',/\.json$/,function(filename){
      //     filename = filename.split('\\').pop().split('/').pop();
      //     filesFound = {
      //       cmd: "scene_files",
      //       date: Date.now(),
      //       data: filename
      //     };
      //     send_all_clients(JSON.stringify(filesFound));
      //   });
      // } break;
  
      // case "record":{
      // 	// reset session
  
      // 	// take OTHistory, turn it into a graph. 
      // 	// take that graph turn it back into an OT history (will this remove all redundant deltas? (we want this...))
      // 	// set these deltas as the header for the recorded session file
      // 	// then append the recordJSON in the stopRecord section.
      // 	//let header = {}
  
      // 	// header['header'] = localGraph
      // 	// console.log(header)
        
      // 	recordJSON = {
      // 		header:{
      // 			scene: localGraph,
      // 			timestamp: Date.now()
      // 		},
      // 		deltas:[]
          
      // 	}
      // 	// recordJSON.push(header)
      // 	let recording = msg.data.replace(/\s/g, "_")
      // 	// save session name as filename provided in this message
      // 	sessionRecording = __dirname + "/session_recordings/" + recording + ".json"
      // 	// push all received deltas to the recordJSON:
      // 	recordStatus = 1
      // 	console.log('session will be stored at', sessionRecording)
        
      // } break;
  
      // case "stopRecord":{
      // 	recordStatus = 0
  
        
      // 	fs.writeFileSync(sessionRecording, JSON.stringify(recordJSON, null, 2), "utf-8")
        
      // 	console.log('session saved at', sessionRecording)
  
      // } break;
  
      // case "clear_scene": {
      // 	// JSON not streamable format so close out the history file 
      // 	//fs.appendFileSync(OTHistoryFile, ']', "utf-8")
  
      // 	let deltas = load_scene("scene_speaker.json")
      // 	// create new history file & add scene as header
      // 	//OTHistoryFile = '../histories/OT_' + Date.now() + '.json'
      // 	// let header = {}
      // 	// header['header'] = deltas
      // 	//fs.writeFileSync(OTHistoryFile, '[' + JSON.stringify(header), "utf-8")
      // } break;
      // case "get_scene": {
        
      //   //demo_scene = JSON.parse(fs.readFileSync(scenefile, "utf-8")); 
      //   // turn this into deltas:
      //   let deltas = got.deltasFromGraph(localGraph, []);
      //   //console.log(deltas)
  
      //   // reply only to the requester:
      //   sock.send(JSON.stringify({
      //     cmd: "deltas",
      //     date: Date.now(),
      //     data: deltas //OTHistory
      //   }));
  
      // } break;
      // case "updated_scene": {
      //   // // Example sending some greetings:
  
      //   // ensure the blank scene isn't overwritten
      //   ensureBlank = __dirname + '/scene_files/blank_scene.json'
      //   if (scenefile === ensureBlank){
      //     console.log('writing to blank scene prevented')
      //   } else {
      //     let scenestr = JSON.stringify(msg.scene, null, "\t");
      //     fs.writeFileSync(scenefile, scenestr, "utf-8");
      //     //console.log(scenestr)
      //   }
  
      // } break;
  
      // case "loadScene": {
      //   load_scene(msg.data);
      // } break;
  
      // case "user_pose": {
      //   //console.log(JSON.stringify(msg.pose))
      //   // broadcast this data... 
  
      //   recordPose = {
      //     cmd: "user_pose",
      //     date: Date.now(),
      //     pose: msg.pose
      //   }
      //   let poseDelta = JSON.stringify(recordPose)
      //   send_all_clients(poseDelta);
  
      //   const limiter = new bottleneck({
      //     maxConcurrent: 1,
      //     minTime: 30
      //   });
  
  
      //   // Limit storing of pose data to rate of 30fps
      //   limiter.schedule(() => {
      //     //OTHistory.push(poseDelta)
      //     //fs.appendFileSync(OTHistoryFile, ',' + JSON.stringify(recordPose), "utf-8")
  
      //   });
      // } break;
      default: console.log("received JSON", msg, typeof msg);
    }
  }


  // send a (string) message to all connected clients:
function send_all_clients(msg, ignore) {
	deltaWebsocketServer.clients.forEach(function each(client) {
		if (client == ignore) return;
		try {
			client.send(msg);
		} catch (e) {
			console.error(e);
		};
	});
}
