from PIL import Image
from PIL.ExifTags import TAGS
import datetime

class ExifDecoder:
    # First apply left right symetry (Boolean), then rotation (trigonometric)
    orientations = {1:(0, False), 
                    2:(0, True), 
                    3:(180, False), 
                    4:(180, True), 
                    5:(90, True), 
                    6:(270, False), 
                    7:(270, True), 
                    8:(90, False)}


    def __init__(self, exif = None, image = None):
        if exif != None:            
            self.exif = exif
        else:
            assert(image != None)
            self.exif = self.exifGet(image)
        self.image = image
        exif = self.exif
        self.exifOrientation = exif.get("Orientation", 1)
        self.orientation, self.symetry = self.orientations[self.exifOrientation]
        self.dateTime = datetime.datetime.strptime(exif["DateTime"], "%Y:%m:%d %H:%M:%S")
        self.flash = exif.get("Flash")
        if self.flash != None:
            self.flash = self.flash & 0x1 == 1
        self.width = exif.get("ExifImageWidth")
        self.height = exif.get("ExifImageHeight")
        flen = exif.get("FocalLength")
        if flen != None:
            flen = flen[0]
        self.focalLength =  flen
        self.isoSpeed = exif.get("ISOSpeedRatings")
        exp = exif.get("ExposureTime")
        if exp != None:            
            self.exposureTime = float(exp[0]) / float(exp[1])
        else:
            self.exposureTime = None

    def exifGet(self, image):
        ret = {}
        info = image._getexif()
        for tag, value in info.items():
            decoded = TAGS.get(tag, tag)
            ret[decoded] = value
        return ret

    def getActualWidthHeight(self):
        width, height = self.image.size
        orientation = self.exifOrientation
        if orientation in [5, 6, 7, 8]:
            return height, width
        else:
            return width, height

    def isRotated(self):
        orientation = self.exifOrientation
        if orientation in [5, 6, 7, 8]:
            return True
        else:
            return False 

    def imageRotationNormalize(self):
        assert(self.image != None)
        orientation = self.exifOrientation
        im = self.image
        if orientation == 1:
            # Vertical Mirror
            mirror = im.copy()
        elif orientation == 2:
            # Vertical Mirror
            mirror = im.transpose(Image.FLIP_LEFT_RIGHT)
        elif orientation == 3:
            # Rotation 180
            mirror = im.transpose(Image.ROTATE_180)
        elif orientation == 4:
            # Horizontal Mirror
            mirror = im.transpose(Image.FLIP_TOP_BOTTOM)
        elif orientation == 5:
            # Horizontal Mirror + Rotation 270
            mirror = im.transpose(Image.FLIP_TOP_BOTTOM).transpose(Image.ROTATE_270)
        elif orientation == 6:
            # Rotation 270
            mirror = im.transpose(Image.ROTATE_270)
        elif orientation == 7:
            # Vertical Mirror + Rotation 270
            mirror = im.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_270)
        elif orientation == 8:
            # Rotation 90
            mirror = im.transpose(Image.ROTATE_90)

        return mirror
            

#image = Image.open("/Users/lagunas/Data/devel/stupeflix/services/worker/test2/images/photosets/kyteRasSudr/2007-06-30/IMG_9926.JPG")

#ed = ExifDecoder(image = image)

#print ed
