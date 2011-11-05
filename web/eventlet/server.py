import os

import eventlet
from eventlet import wsgi
from eventlet import websocket
import urlparse

PORT = 7000

channel_id

participants = set()

@websocket.WebSocketWSGI
def handle(ws):
#    print dir(ws)
    print ws.environ.keys()
    print urlparse.parse_qs(ws.environ.get("QUERY_STRING", ""))
    print dir(ws.environ["eventlet.input"])
    participants.add(ws)
#    for p in participants:
#        p.send("coucou")
    
    try:
        while True:
            m = ws.wait()
            if m is None:
                break
            for p in participants:
                p.send(m)
    finally:
        participants.remove(ws)
                  
def dispatch(environ, start_response):
    """Resolves to the web page or the websocket depending on the path."""
#    print environ
    print environ["PATH_INFO"], start_response
    if environ['PATH_INFO'] == '/chat':
        ret = handle(environ, start_response)
        print ret
        return ret
    else:
        start_response('200 OK', [('content-type', 'text/html')])
        html_path = os.path.join(os.path.dirname(__file__), 'websocket_chat.html')
        return [open(html_path).read() % {'port': PORT}]
        
if __name__ == "__main__":
    # run an example app from the command line            
    listener = eventlet.listen(('127.0.0.1', PORT))
    print "\nVisit http://localhost:7000/ in your websocket-capable browser.\n"
    wsgi.server(listener, dispatch)
