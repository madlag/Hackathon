import Image
import exif

def widthHeightGet(resolution, width, height, crop = False):
    if width == None and height == None:
        return resolution[0], resolution[1], None

    if width == None:
        width = resolution[0]
    if height == None:
        height = resolution[1]        

    width0 = width
    height0 = height

    videoAspectRatio = float(resolution[0]) / float(resolution[1])        
    aspectRatio = float(width0) / float(height0)

    if width != resolution[0] or height != resolution[1]:
        # Shrink the bounding box according to actual dimensions

        test = videoAspectRatio > aspectRatio
        if crop:
            test = not test

        if test:
            newHeight = int(float(width) / videoAspectRatio)
            if newHeight <= resolution[1]:
                height = newHeight
            else:
                height = resolution[1]
                width = int(float(height) * videoAspectRatio)
        else:
            newWidth = int(float(height) * videoAspectRatio)
            if newWidth <= resolution[0]:
                width = newWidth
            else:
                width = resolution[0]
                height = int(float(width) / videoAspectRatio)

    centerZone = None
    if crop:
        if width < width0 or height < height0:            
            if aspectRatio < videoAspectRatio:
                centerZone = [int(float(height) * aspectRatio), height]
            else:
                centerZone = [width, int(float(width) / aspectRatio)]
        else:
            centerZone = [width0, height0]

    return width, height, centerZone



class ThumbCreator:    
    @staticmethod
    def run(filename, width = None, height = None, rot = 0, crop = False):
        # Rotation is a multiple of 90, and is counted counterclockwise
        rotation = rot
        
        # Check if there is some additional rotation
        torotate = ((rotation / 90) % 2) != 0

        # Flip dimensions if a rotation  of 90 or 270 is to be done
        if torotate:
            width, height = height, width

        image = Image.open(filename)

        # Initializing exif
        exInfo = None

        cropSize = None
        # Try to perform the thumbnailing using exif
        try:
            # Get the actual dimensions eventually using exif rotation
            ed = exif.ExifDecoder(image = image)
            exInfo = ed
            imWidth, imHeight = ed.getActualWidthHeight()

            rotated  = ed.isRotated()

            width, height, cropSize = widthHeightGet([imWidth, imHeight], width, height, crop = crop)
                                
            # If the image is rotated, flip dimensions as pil will not take care of exifs while resizing 
            if rotated:
                width, height = height, width
                
            # Resize the image
            ed.image = ed.image.resize((int(width), int(height)), Image.ANTIALIAS)
            # Rotate the smaller version
            image = ed.imageRotationNormalize()
            
        except Exception, e:
            # We could not get exif information => fallback on standard way
            size = image.size 

            width, height, cropSize = widthHeightGet(size, width, height, crop = crop)

            # Resize the image
            image = image.resize((int(width), int(height)), Image.ANTIALIAS)

        if cropSize != None:
            s = image.size
            image = image.crop(((s[0] - cropSize[0]) / 2, (s[1] - cropSize[1]) / 2, (s[0] + cropSize[0]) / 2, (s[1] + cropSize[1]) / 2))
        
        # Finally rotate the image if some rotation was asked
        if rotation != 0:
            r = int(rotation / 90) % 4
            if r == 1:
                image = image.transpose(Image.ROTATE_90)
            elif r == 2:
                image = image.transpose(Image.ROTATE_180)
            elif r == 3:
                image = image.transpose(Image.ROTATE_270)

        return image, exInfo

if __name__ == "__main__":    
    assert widthHeightGet([360, 640], 100, 100, crop = True) == (100, 177, [100, 100])
    assert widthHeightGet([640, 360], 100, 100, crop = True) == (177, 100, [100, 100])
    assert widthHeightGet([640, 360], 1000, 100, crop = True) == (640, 360, [640, 64])
    assert widthHeightGet([640, 360], 100, 1000, crop = True) == (640, 360, [36, 360])
