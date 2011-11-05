var express = require('express')
  , utils = require('./utils')
  , app = express.createServer()
  , io = require('socket.io').listen(app);

app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

/* ---------------------------------------------------------------------------------------------------------------------------------- */

var channels = {};

function get_channel_or_404(channelId, res){
  var channel = channels[channelId];
  if (!channel){
    res.json({'error': 'Invalid channel'});
    return false;
  }else{
    return channel;
  }
}

/* ---------------------------------------------------------------------------------------------------------------------------------- */

app.get('/channel/:channelId', function (req, res) {	
  var channelId = req.params.channelId;

  var channel; if (channel = get_channel_or_404(channelId, res)) {
    res.json(channel.scenario);
  } 
});


app.get('/channel/:channelId/:remoteId/:pictureId', function (req, res) {	
  var channelId = req.params.channelId;  
  
  var channel; if (channel = get_channel_or_404(channelId, res)) {
    
    var update = {
      remoteId: req.params.remoteId,
      pictureId: req.params.pictureId,
      pictureData: {
        url: req.query.url
      }
    };
    
    channel.data.push(update);
    
    // Broadcast to clients
    for(var client, i=0; client = channel.clients[i]; i++){
      client.emit('update', update);
    }
    
    res.json({done: 1});
  }
});

/* ---------------------------------------------------------------------------------------------------------------------------------- */

io.sockets.on('connection', function (socket) {
  
  socket.on('init', function (data, fn) {
    var channelId = data.channelId || utils.genShortUid();
    socket.set('channelId', channelId);

    var channel = utils.getOrCreate(channels, channelId, {
      clients: [],
      scenario: data.scenario,
      data: []
    });
    
    channel.clients.push(socket);
    
    fn({
      id: channelId,
      data: channel.data
    });
    
  });

});

io.sockets.on('disconnect', function (socket) {

  socket.get('channelId', function (err, channelId) {
    var channel = channels[channelId];
    if (channel) {
      // TODO: remove socket from channel.clients
      console.log('Deleted channel', channelId);
    }
  });

});

/* ---------------------------------------------------------------------------------------------------------------------------------- */

app.listen(8080);