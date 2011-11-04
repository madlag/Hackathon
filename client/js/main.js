/** -*- compile-command: "jslint-cli main.js" -*-
 *
 *  Copyright (C) 2010-2011 Cedric Pinson
 *
 *                  GNU LESSER GENERAL PUBLIC LICENSE
 *                      Version 3, 29 June 2007
 *
 * Copyright (C) 2007 Free Software Foundation, Inc. <http://fsf.org/>
 * Everyone is permitted to copy and distribute verbatim copies
 * of this license document, but changing it is not allowed.
 *
 * This version of the GNU Lesser General Public License incorporates
 * the terms and conditions of version 3 of the GNU General Public
 * License
 *
 * Authors:
 *  Cedric Pinson <cedric.pinson@plopbyte.com>
 *
 */

var Viewer;
var main = function() {
    //osg.ReportWebGLError = true;

    var canvas = document.getElementById("3DView");
    var w = window.innerWidth;
    var h = window.innerHeight;
    osg.log("size " + w + " x " + h );
    canvas.style.width = w;
    canvas.style.height = h;
    canvas.width = w;
    canvas.height = h;

    var viewer;
    try {
        viewer = new osgViewer.Viewer(canvas, {antialias : true });
        viewer.init();
        var rotate = new osg.MatrixTransform();
        rotate.addChild(createScene());
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(rotate);
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();

        viewer.run();
        Viewer = viewer;

    } catch (er) {
        osg.log("exception in osgViewer " + er);
    }
};

var nbLoading = 0;
var loaded = [];
var removeLoading = function(node, child) {
    nbLoading -=1;
    loaded.push(child);
    if (nbLoading === 0) {
        document.getElementById("loading").style.display = 'None';
        Viewer.getManipulator().computeHomePosition();
    }
};
var addLoading = function() {
    nbLoading+=1;
    document.getElementById("loading").style.display = 'Block';
};


var Organizer = function(width, height) {
    this._width = width;
    this._height = height;
    this._images = [];
    this._currentSide = 0;
    this._currentPos = 0;
    this._full = 0;
};

Organizer.prototype = {

    

    push: function(q) {

        if (this._full) {
            return false;
        }

        var w = q.width;
        var h = q.height;
        this._images.push(q);

        if (this._currentSide === 0) {
            q.position = [this._currentPos + w/2, 0];
            this._currentPos += w;
            
            if (this._currentPos > this._width) {
                this._currentSide++;
                this._currentPos = 0;
            }
        } else if (this._currentSide === 1) {
            q.position = [this._width, this._currentPos + h/2];
            this._images.push(q);
            this._currentPos += h;

            if (this._currentPos > this._height) {
                this._currentSide++;
                this._currentPos = 0;
            }
        } else if (this._currentSide === 2) {
            q.position = [this._width - (this._currentPos + w/2), this._currentPos];
            this._images.push(q);
            this._currentPos += w;

            if (this._currentPos > this._width) {
                this._currentSide++;
                this._currentPos = 0;
            }
        } else if (this._currentSide === 3) {
            q.position = [0, this._height - (this._currentPos + h/2)];
            this._images.push(q);
            this._currentPos += h;

            if (this._currentPos > this._height) {
                this._currentSide = 0;
                this._currentPos = 0;
                this._full = true;
            }
        }

        return true;
    },
};




var createQuad = function(img) {
    var w = img.width;
    var h = img.height;

    var q = osg.createTexturedQuadGeometry(-w/2, 0, -h/2,
                                           w, 0, 0,
                                           0, 0, h );
    var t = new osg.Texture();
    t.setImage(img);
    q.getOrCreateStateSet().setTextureAttributeAndMode(0, t);
    q.width = w;
    q.height = h;
    return q;
};

var currentImageIndex = 0;
var getImage = function() {
    var node = new osg.MatrixTransform();
    var Images = [ ];
    var max = 6
    for (var i = 0, l = max; i < l; i++) {
        Images.push("img/Screenshot-"+i.toString()+".png");
    }
    var image = new Image;
    var idx = currentImageIndex % max;

    var q = createQuad(image);
    image.onload = function() {
        node.addChild(createQuad(image));
    };
    image.src = Images[idx];
    currentImageIndex++;
    return node;
};


function createScene()
{
    var node = getImage();
    return node;

    //return osg.createTexturedBoxGeometry(0,0,0, 20, 20, 20);
    //return getModel();
}



window.addEventListener("load", main ,true);
