import os

import eventlet
from eventlet import wsgi
from eventlet import websocket
import urlparse
import collections
import json
import redis
import eventlet.pools

ADRESS="192.168.0.75"
#ADRESS="169.254.205.154"
PORT = 7000
SEP=":"
DB=3

class ChannelState:
    pass

class Client:
    def __init__(self, ws):
        self.ws = ws

    def message(self, message):
        self.ws.send(message)

class RedisPool(eventlet.pools.Pool):

    def create(self):
        return redis.Redis("localhost", 6379, DB)

REDIS_POOL = RedisPool()

class Channel:
    def __init__(self):
        self.channelId = None
        self.clients = []        
        self.state = ChannelState()
        self.scenario_ = None
        self.data_ = []

    def clientAdd(self, client):
        self.clients += [client]

    def clientRemove(self, client):
        self.clients.remove(client)

#        if len(self.clients[channelId]) == 0:
#            del self.clients[channelId]             

    def message(self, message, exceptions = []):
        for c in self.clients:
            if c not in exceptions:
                c.message(message)

    def get(self, key):
        with REDIS_POOL.item() as client:
            ret = client.get(key)
            ret = json.loads(ret)
        return ret
    
    def set(self, key, value):
        with REDIS_POOL.item() as client:
            client.set(key, json.dumps(value))
        
    def scenarioSet(self, scenario):
        return self.set("scenario" + SEP +self.channelId, scenario)

    def scenarioGet(self):
        return self.get("scenario" + SEP +self.channelId)

    def dataGet(self):
        with REDIS_POOL.item() as client:
            a = client.lrange("data" + SEP + self.channelId, 0, -1)
        a = map(lambda x: json.loads(x), a)
        return a

    def dataAdd(self, d):
        with REDIS_POOL.item() as client:
            client.rpush("data" + SEP + self.channelId, json.dumps(d))


@websocket.WebSocketWSGI
def handleweb(ws):        
    app = ws.environ["APP"]
    app.handleweb(ws)


class App:
    def __init__(self):
        self.channels = collections.defaultdict(Channel)
        self.channelId = 0
        self.redis = redis.Redis("localhost")        
        self.redis = eventlet.pools.Pool(create=lambda: httplib2.Http(timeout=90))

        
    def channelIdAllocate(self):
        self.channelId += 1
        return self.channelId

    def channelGet(self, channelId):
        channel = self.channels[channelId]
        channel.channelId = channelId
        return channel
    
    def clientAdd(self, channelId, ws):
        client = Client(ws)
        channel = self.channelGet(channelId)
        channel.clientAdd(client)
        return client

    def clientRemove(self, channelId, client):
        self.channels[channelId].clientRemove(client)
        
    def handleweb(self, ws):
        client = None
        channelId = None
        try:
            m = ws.wait()
            if m is None:
                return
            m = json.loads(m)
            channelId = str(m.get("channelId"))
            scenario = m.get("scenario")

            if not channelId:
                channelId = self.channelIdAllocate()

            if SEP in channelId:
                return

            channel = self.channelGet(channelId)
            if scenario != None:
                channel.scenarioSet(scenario)
                
            client = self.clientAdd(channelId, ws)        

            client.message(json.dumps({"type":"imageset", "value":{"channelId":channelId, "data":channel.dataGet()}}))

            while True:
                m = ws.wait()
                if m is None:
                    break
                self.channelGet(channelId).message(m, [client])
        finally:
            if channelId != None and client != None:
                self.clientRemove(channelId, client)

    def handleios(self, environ, start_response):
        d = environ.get('wsgi.input').read()
        print d
        message = json.loads(d)
        type = message["type"]
        print message
        channelId = str(message["value"]["channelId"])
        channel = self.channelGet(channelId)
        
        if type == "producer_push":
            value = message.get("value")
            channel.dataAdd(value)

        channel.message(d)
            
        try:
            scenario = channel.scenarioGet()
            res = json.dumps(scenario)
            code = "202 OK"
            content_type = 'application/json;charset=utf8'
        except Exception, e:
            res = "The channel '%s' does not have yet a scenario" % channelId
            code = "404 NOT_FOUND"
            content_type = "text/plain"
    
        start_response(code, [('content-type', content_type)])            
        return [res]

    def dispatch(self, environ, start_response):
        """Resolves to the web page or the websocket depending on the path."""
    #    print environ
        path = environ['PATH_INFO'][1:]
        environ["APP"] = self
        if path.startswith('webclient/'):
            return handleweb(environ, start_response)
        elif path.startswith("iosclient/"):
            return self.handleios(environ, start_response)
        else:
            if path == "":
                path = "webclient.html"
            html_path = os.path.join(os.path.dirname(__file__), path)
            try:
                ret = open(html_path).read()
            except Exception, e:
                ret = ""

            if path == "webclient.html":                    
                ret = ret % {'server': "%s:%s" % (ADRESS,PORT)}

            start_response('200 OK', [('content-type', 'text/html')])
            
            return [ret]
        
if __name__ == "__main__":
    # run an example app from the command line            
    listener = eventlet.listen((ADRESS, PORT))
    print "\nVisit http://localhost:7000/ in your websocket-capable browser.\n"
    app = App()
    wsgi.server(listener, app.dispatch)
