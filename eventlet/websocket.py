import collections
import errno
import string
import struct
from socket import error as SocketError

import sys
from base64 import b64encode, b64decode

# Imports that vary by python version
if sys.hexversion > 0x3000000:
    # python >= 3.0
    from io import StringIO
    from http.server import SimpleHTTPRequestHandler
    from urllib.parse import urlsplit
    b2s = lambda buf: buf.decode('latin_1')
    s2b = lambda s: s.encode('latin_1')
else:
    # python 2.X
    from cStringIO import StringIO
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from urlparse import urlsplit
    # No-ops
    b2s = lambda buf: buf
    s2b = lambda s: s

if sys.hexversion >= 0x2060000:
    # python >= 2.6
    from multiprocessing import Process
    from hashlib import md5, sha1
else:
    # python < 2.6
    Process = None
    from md5 import md5
    from sha import sha as sha1

# Degraded functionality if these imports are missing
for mod, sup in [('numpy', 'HyBi protocol'),
        ('ssl', 'TLS/SSL/wss'), ('resource', 'daemonizing')]:
    try:
        globals()[mod] = __import__(mod)
    except ImportError:
        globals()[mod] = None
        print("WARNING: no '%s' module, %s support disabled" % (mod, sup))

try:
    from hashlib import md5
except ImportError: #pragma NO COVER
    from md5 import md5

import eventlet
from eventlet import semaphore
from eventlet import wsgi
from eventlet.green import socket
from eventlet.support import get_errno

#from nova import log as logging
#LOG = logging.getLogger('nova.vnc-proxy')

ACCEPTABLE_CLIENT_ERRORS = set((errno.ECONNRESET, errno.EPIPE))

__all__ = ["WebSocketWSGI", "WebSocket"]

class WebSocketWSGI(object):
    """Wraps a websocket handler function in a WSGI application.

    Use it like this::

      @websocket.WebSocketWSGI
      def my_handler(ws):
          from_browser = ws.wait()
          ws.send("from server")

    The single argument to the function will be an instance of
    :class:`WebSocket`.  To close the socket, simply return from the
    function.  Note that the server will log the websocket request at
    the time of closure.
    """

    GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

    def __init__(self, handler):
        self.handler = handler
        self.protocol_version = None

    def __call__(self, environ, start_response):
        if not ((environ.get('HTTP_CONNECTION') == 'Upgrade' or 
                environ.get('HTTP_CONNECTION').find('Upgrade')!=-1) and
                (environ.get('HTTP_UPGRADE') == 'WebSocket' or
                environ.get('HTTP_UPGRADE') == 'websocket')):
            print 
            # need to check a few more things here for true compliance
            start_response('400 Bad Request', [('Connection','close')])
            return []
    
        # See if they sent the new-format headers
        if 'HTTP_SEC_WEBSOCKET_VERSION' in environ:
            self.protocol_version = environ.get('HTTP_SEC_WEBSOCKET_VERSION')
        elif 'HTTP_SEC_WEBSOCKET_KEY1' in environ:
            self.protocol_version = 76
            if 'HTTP_SEC_WEBSOCKET_KEY2' not in environ:
                # That's bad.
                start_response('400 Bad Request', [('Connection','close')])
                return []
        else:
            self.protocol_version = 75

        # Get the underlying socket and wrap a WebSocket class around it
        sock = environ['eventlet.input'].get_socket()
        ws = WebSocket(sock, environ, self.protocol_version)
        
        # If it's new-version, we need to work out our challenge response
        if self.protocol_version == 76:
            key1 = self._extract_number(environ['HTTP_SEC_WEBSOCKET_KEY1'])
            key2 = self._extract_number(environ['HTTP_SEC_WEBSOCKET_KEY2'])
            # There's no content-length header in the request, but it has 8
            # bytes of data.
            environ['wsgi.input'].content_length = 8
            key3 = environ['wsgi.input'].read(8)
            key = struct.pack(">II", key1, key2) + key3
            response = md5(key).digest()
        
        # Start building the response
        scheme = 'ws'
        if environ.get('wsgi.url_scheme') == 'https':
            scheme = 'wss'
        location = '%s://%s%s%s' % (
            scheme,
            environ.get('HTTP_HOST'), 
            environ.get('SCRIPT_NAME'), 
            environ.get('PATH_INFO')
        )
        qs = environ.get('QUERY_STRING')
        if qs is not None:
            location += '?' + qs
        if self.protocol_version == 75:
            handshake_reply = ("HTTP/1.1 101 Web Socket Protocol Handshake\r\n"
                               "Upgrade: WebSocket\r\n"
                               "Connection: Upgrade\r\n"
                               "WebSocket-Origin: %s\r\n"
                               "WebSocket-Location: %s\r\n\r\n" % (
                    environ.get('HTTP_ORIGIN'),
                    location))
        elif self.protocol_version == 76:
            handshake_reply = ("HTTP/1.1 101 WebSocket Protocol Handshake\r\n"
                               "Upgrade: WebSocket\r\n"
                               "Connection: Upgrade\r\n"
                               "Sec-WebSocket-Origin: %s\r\n"
                               "Sec-WebSocket-Protocol: %s\r\n"
                               "Sec-WebSocket-Location: %s\r\n"
                               "\r\n%s"% (
                    environ.get('HTTP_ORIGIN'),
                    environ.get('HTTP_SEC_WEBSOCKET_PROTOCOL', 'default'),
                    location,
                    response))
        elif self.protocol_version in ['7', '8', '13']:
            handshake_reply = ("HTTP/1.1 101 Switching Protocols\r\n"
                               "Upgrade: websocket\r\n"
                               "Connection: Upgrade\r\n"
                               "Sec-WebSocket-Accept: %s\r\n"
                               "Sec-WebSocket-Protocol: base64\r\n"
                               "\r\n"% (
                    b64encode(sha1(s2b(environ.get('HTTP_SEC_WEBSOCKET_KEY') + self.GUID)).digest()) ))
        else: #pragma NO COVER
            raise ValueError("Unknown WebSocket protocol version.") 
        
        sock.sendall(handshake_reply)
        try:
            self.handler(ws)
        except socket.error, e:
            if get_errno(e) not in ACCEPTABLE_CLIENT_ERRORS:
                raise
        # Make sure we send the closing frame
        ws._send_closing_frame(True)
        # use this undocumented feature of eventlet.wsgi to ensure that it
        # doesn't barf on the fact that we didn't call start_response
        return wsgi.ALREADY_HANDLED

    def _extract_number(self, value):
        """
        Utility function which, given a string like 'g98sd  5[]221@1', will
        return 9852211. Used to parse the Sec-WebSocket-Key headers.
        """
        out = ""
        spaces = 0
        for char in value:
            if char in string.digits:
                out += char
            elif char == " ":
                spaces += 1
        return int(out) / spaces

class WebSocket(object):
    """A websocket object that handles the details of
    serialization/deserialization to the socket.
    
    The primary way to interact with a :class:`WebSocket` object is to
    call :meth:`send` and :meth:`wait` in order to pass messages back
    and forth with the browser.  Also available are the following
    properties:
    
    path
        The path value of the request.  This is the same as the WSGI PATH_INFO variable, but more convenient.
    protocol
        The value of the Websocket-Protocol header.
    origin
        The value of the 'Origin' header.
    environ
        The full WSGI environment for this request.

    """
    def __init__(self, sock, environ, version=76):
        """
        :param socket: The eventlet socket
        :type socket: :class:`eventlet.greenio.GreenSocket`
        :param environ: The wsgi environment
        :param version: The WebSocket spec version to follow (default is 76)
        """
        self.socket = sock
        self.origin = environ.get('HTTP_ORIGIN')
        self.protocol = environ.get('HTTP_WEBSOCKET_PROTOCOL')
        self.path = environ.get('PATH_INFO')
        self.environ = environ
        self.version = version
        self.websocket_closed = False
        self._buf = ""
        self._msgs = collections.deque()
        self._sendlock = semaphore.Semaphore()

    @staticmethod
    def encode_hybi(buf, opcode, base64=False):
        """ Encode a HyBi style WebSocket frame.
        Optional opcode:
            0x0 - continuation
            0x1 - text frame (base64 encode buf)
            0x2 - binary frame (use raw buf)
            0x8 - connection close
            0x9 - ping
            0xA - pong
        """
        if base64:
            buf = b64encode(buf)

        b1 = 0x80 | (opcode & 0x0f) # FIN + opcode
        payload_len = len(buf)
        if payload_len <= 125:
            header = struct.pack('>BB', b1, payload_len)
        elif payload_len > 125 and payload_len < 65536:
            header = struct.pack('>BBH', b1, 126, payload_len)
        elif payload_len >= 65536:
            header = struct.pack('>BBQ', b1, 127, payload_len)

        #print("Encoded: %s" % repr(header + buf))

        return header + buf, len(header), 0

    @staticmethod
    def decode_hybi(buf, base64=False):
        """ Decode HyBi style WebSocket packets.
        Returns:
            {'fin'          : 0_or_1,
             'opcode'       : number,
             'mask'         : 32_bit_number,
             'hlen'         : header_bytes_number,
             'length'       : payload_bytes_number,
             'payload'      : decoded_buffer,
             'left'         : bytes_left_number,
             'close_code'   : number,
             'close_reason' : string}
        """

        f = {'fin'          : 0,
             'opcode'       : 0,   
             'mask'         : 0,
             'hlen'         : 2,
             'length'       : 0,
             'payload'      : None,
             'left'         : 0,
             'close_code'   : None,
             'close_reason' : None}

        blen = len(buf)
        f['left'] = blen

        if blen < f['hlen']:
            return f # Incomplete frame header

        b1, b2 = struct.unpack_from(">BB", buf)
        f['opcode'] = b1 & 0x0f
        f['fin'] = (b1 & 0x80) >> 7
        has_mask = (b2 & 0x80) >> 7

        f['length'] = b2 & 0x7f

        if f['length'] == 126:
            f['hlen'] = 4
            if blen < f['hlen']:
                return f # Incomplete frame header
            (f['length'],) = struct.unpack_from('>xxH', buf)
        elif f['length'] == 127:
            f['hlen'] = 10
            if blen < f['hlen']:
                return f # Incomplete frame header
            (f['length'],) = struct.unpack_from('>xxQ', buf)

        full_len = f['hlen'] + has_mask * 4 + f['length']

        if blen < full_len: # Incomplete frame
            return f # Incomplete frame header

        # Number of bytes that are part of the next frame(s)
        f['left'] = blen - full_len

        # Process 1 frame
        if has_mask:
            # unmask payload
            f['mask'] = buf[f['hlen']:f['hlen']+4]
            b = c = s2b('')
            if f['length'] >= 4:
                mask = numpy.frombuffer(buf, dtype=numpy.dtype('<u4'),
                        offset=f['hlen'], count=1)
                data = numpy.frombuffer(buf, dtype=numpy.dtype('<u4'),
                        offset=f['hlen'] + 4, count=int(f['length'] / 4))
                #b = numpy.bitwise_xor(data, mask).data
                b = numpy.bitwise_xor(data, mask).tostring()

            if f['length'] % 4:
                #print("Partial unmask")
                mask = numpy.frombuffer(buf, dtype=numpy.dtype('B'),
                        offset=f['hlen'], count=(f['length'] % 4))
                data = numpy.frombuffer(buf, dtype=numpy.dtype('B'),
                        offset=full_len - (f['length'] % 4),
                        count=(f['length'] % 4))
                c = numpy.bitwise_xor(data, mask).tostring()
            f['payload'] = b + c
        else:
            print("Unmasked frame: %s" % repr(buf))
            f['payload'] = buf[(f['hlen'] + has_mask * 4):full_len]

        if base64 and f['opcode'] in [1, 2]:
            try:
                f['payload'] = b64decode(f['payload'])
            except:
                print("Exception while b64decoding buffer: %s" %
                        repr(buf))
                raise

        if f['opcode'] == 0x08:
            if f['length'] >= 2:
                f['close_code'] = struct.unpack_from(">H", f['payload'])
            if f['length'] > 3:
                f['close_reason'] = f['payload'][2:]

        return f


    @staticmethod
    def _pack_message(message):
        """Pack the message inside ``00`` and ``FF``

        As per the dataframing section (5.3) for the websocket spec
        """
        if isinstance(message, unicode):
            message = message.encode('utf-8')
        elif not isinstance(message, str):
            message = str(message)
        packed = "\x00%s\xFF" % message
        return packed

    def _parse_messages(self):
        """ Parses for messages in the buffer *buf*.  It is assumed that
        the buffer contains the start character for a message, but that it
        may contain only part of the rest of the message.

        Returns an array of messages, and the buffer remainder that
        didn't contain any full messages."""
        msgs = []
        end_idx = 0
        buf = self._buf
        while buf:
            if self.version in ['7', '8', '13']:
                frame = self.decode_hybi(buf, base64=False)
                #print("Received buf: %s, frame: %s" % (repr(buf), frame))

                if frame['payload'] == None:
                    break
                else:
                    if frame['opcode'] == 0x8: # connection close
                        self.websocket_closed = True
                        break
                    #elif frame['opcode'] == 0x1:
                    else:
                        msgs.append(frame['payload']);
                        #msgs.append(frame['payload'].decode('utf-8', 'replace'));
                        #buf = buf[-frame['left']:]
                        if frame['left']:
                            buf = buf[-frame['left']:]
                        else:
                            buf = ''


            else:
                frame_type = ord(buf[0])
                if frame_type == 0:
                    # Normal message.
                    end_idx = buf.find("\xFF")
                    if end_idx == -1: #pragma NO COVER
                        break
                    msgs.append(buf[1:end_idx].decode('utf-8', 'replace'))
                    buf = buf[end_idx+1:]
                elif frame_type == 255:
                    # Closing handshake.
                    assert ord(buf[1]) == 0, "Unexpected closing handshake: %r" % buf
                    self.websocket_closed = True
                    break
                else:
                    raise ValueError("Don't understand how to parse this type of message: %r" % buf)
        self._buf = buf
        return msgs
    
    def send(self, message):
        """Send a message to the browser.  
        
        *message* should be convertable to a string; unicode objects should be
        encodable as utf-8.  Raises socket.error with errno of 32
        (broken pipe) if the socket has already been closed by the client."""
        if self.version in ['7', '8', '13']:
            packed, lenhead, lentail = self.encode_hybi(message, opcode=0x01, base64=False)
        else:
            packed = self._pack_message(message)
        # if two greenthreads are trying to send at the same time
        # on the same socket, sendlock prevents interleaving and corruption
        self._sendlock.acquire()
        try:
            self.socket.sendall(packed)
        finally:
            self._sendlock.release()

    def wait(self):
        """Waits for and deserializes messages. 
        
        Returns a single message; the oldest not yet processed. If the client
        has already closed the connection, returns None.  This is different
        from normal socket behavior because the empty string is a valid
        websocket message."""
        while not self._msgs:
            # Websocket might be closed already.
            if self.websocket_closed:
                return None
            # no parsed messages, must mean buf needs more data
            delta = self.socket.recv(8096)
            if delta == '':
                return None
            self._buf += delta
            msgs = self._parse_messages()
            self._msgs.extend(msgs)
        return self._msgs.popleft()

    def _send_closing_frame(self, ignore_send_errors=False):
        """Sends the closing frame to the client, if required."""
        if self.version in ['7', '8', '13'] and not self.websocket_closed:
            msg = s2b('')
            #if code != None:
            #    msg = struct.pack(">H%ds" % (len(reason)), code)

            buf, h, t = self.encode_hybi(msg, opcode=0x08, base64=False)
            self.socket.sendall(buf)
            self.websocket_closed = True

        elif self.version == 76 and not self.websocket_closed:
            try:
                self.socket.sendall("\xff\x00")
            except SocketError:
                # Sometimes, like when the remote side cuts off the connection,
                # we don't care about this.
                if not ignore_send_errors: #pragma NO COVER
                    raise
            self.websocket_closed = True

    def close(self):
        """Forcibly close the websocket; generally it is preferable to
        return from the handler method."""
        self._send_closing_frame()
        self.socket.shutdown(True)
        self.socket.close()

