import os

import eventlet
from eventlet import wsgi
from eventlet import websocket
import urlparse
import collections
PORT = 7000


participants = collections.defaultdict(list)

@websocket.WebSocketWSGI
def handle(ws):
    queryParams = urlparse.parse_qs(ws.environ.get("QUERY_STRING", ""))
    channelID = queryParams.get("channelID")
    if len(channelID) == 0:
        return
    channelID = channelID[0]
        
    participants[channelID] += [ws]

    for p in participants[channelID]:
        p.send("coucou")
    
    try:
        while True:
            m = ws.wait()
            if m is None:
                break
            for p in participants[channelID]:
                p.send(m)
    finally:
        participants[channelID].remove(ws)
        if len(participants[channelID]) == 0:
            del participants[channelID] 
                  
def dispatch(environ, start_response):
    """Resolves to the web page or the websocket depending on the path."""
#    print environ
    path = environ['PATH_INFO'][1:]
    if path.startswith('webclient/'):
        return handle(environ, start_response)
    elif path.startswith("iosclient/"):
        print path.startwith
    else:
        if path == "favicon.ico":
            ret = ""
        else:            
            if path == "":
                path = "websocket_chat.html"
            html_path = os.path.join(os.path.dirname(__file__), path)
            ret = open(html_path).read()

        start_response('200 OK', [('content-type', 'text/html')])

        return [ret % {'port': PORT}]
        
if __name__ == "__main__":
    # run an example app from the command line            
    listener = eventlet.listen(('127.0.0.1', PORT))
    print "\nVisit http://localhost:7000/ in your websocket-capable browser.\n"
    wsgi.server(listener, dispatch)
