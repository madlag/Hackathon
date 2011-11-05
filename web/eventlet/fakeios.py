import urllib
import json
import server
url = "http://www.crunchbase.com/assets/images/resized/0002/7394/27394v4-max-250x250.png"
index = 0
producerid = "myiphone"
body = {"type":"producer_push", "value":{"url":url, "index":0, "channelId":124, "producerId":producerid}}

body = json.dumps(body)
u = urllib.urlopen("http://%s:%s/iosclient/" % (server.ADRESS, server.PORT), body)
print u.read()

data = "12-4914-210i4-01i42-04"
u = urllib.urlopen("http://%s:%s/upload/" % (server.ADRESS, server.PORT), data)
print u.read()




