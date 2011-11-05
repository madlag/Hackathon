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
var Scene;
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
        Scene = new osg.Node();
        //Scene.addChild(createScene());
        createScene();
        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(Scene);
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


var Organizer = function(x, y) {
    this._x = x;
    this._y = y;
    this._images = [];
    this._currentSide = 0;
    this._currentPos = 0;
    this._full = 0;
    this._currentSelected = undefined;
};

Organizer.prototype = {
    
    select: function(index) {
        if (this._currentSelected) {
            this._currentSelected.unselect();
        }

        var newone = this._images[index%this._images.length];
        newone.select();
    },

    push: function(q) {

        if (this._full) {
            return false;
        }

        var w = q.width;
        var h = q.height;

        this._images.push(q);

        if (this._currentSide === 0) {
            q.position = [this._currentPos, this._y-1];
            this._currentPos++;
            
            if (this._currentPos >= this._x) {
                this._currentSide++;
                this._currentPos = 2;
            }
        } else if (this._currentSide === 1) {
            q.position = [this._x-1, this._y - this._currentPos];
            this._images.push(q);
            this._currentPos ++;

            if (this._currentPos > this._y) {
                this._currentSide++;
                this._currentPos = 2;
            }
        } else if (this._currentSide === 2) {
            q.position = [this._x - this._currentPos, 0];
            this._images.push(q);
            this._currentPos++;

            if (this._currentPos > this._x) {
                this._currentSide++;
                this._currentPos = 1;
            }
        } else if (this._currentSide === 3) {
            q.position = [0, this._currentPos];
            this._images.push(q);
            this._currentPos++;

            if (this._currentPos >= this._y-1) {
                this._currentSide = 0;
                this._currentPos = 0;
                this._full = true;
            }
        }

        Scene.addChild(this._images[this._images.length-1]);

        return true;
    },
    setMainNode: function(main) { this._main = main; },
    getMainNode: function() { return this._main; }

};

var Ratio = 4/3;
var Width = 400;
var W2 = Width*12;
var X = 12;
var Y = Math.floor(X/Ratio);
var organize = new Organizer(X+2,Y+2);


var createQuad = function(img) {
    var factor = 0.2;
    var w = img.width * factor;
    var h = img.height * factor;

    var imgRatio = w/h;
    if (imgRatio < Ratio) {
        w = h*Ratio;
        h = Width/Ratio;
    } else if (imgRatio > Ratio) {
        h = Width/Ratio;
        w = Width;
    }
    w = Width;
    h = Width/Ratio;

    var q = osg.createTexturedQuadGeometry(-w/2, 0, -h/2,
                                           w, 0, 0,
                                           0, 0, h );
    var t = new osg.Texture();
    t.setImage(img);
    q.getOrCreateStateSet().setTextureAttributeAndMode(0, t);
    //q.getOrCreateStateSet().setAttributeAndMode(new osg.CullFace('DISABLE'));
    q.width = w;
    q.height = h;
    
    return q;
};


var SelectUpdateCallback = function() {};
SelectUpdateCallback.prototype = {
    select: function() {
    },
    unselect: function() {
    },
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (node.selected) {
            node.startSelected = t;
            node.selected = false;
        }
        var m = node.getMatrix();
        return true;
    }
};

var currentImageIndex = 0;
var depth = 0;

var getDummyImage = function() {
    var Images = [ ];
    var max = 6
    for (var i = 0, l = max; i < l; i++) {
        Images.push("img/Screenshot-"+i.toString()+".png");
    }
    var image = new Image;
    var idx = currentImageIndex % max;
    image.src = Images[idx];
    currentImageIndex++;
    return image;
};

var getImage = function() {
    var node = new osg.MatrixTransform();

    var q = createQuad(getDummyImage());

    node.addChild(q);
    node.width = q.width;
    node.height = q.height;
    if (organize.push(node)) {
        depth++;
        osg.Matrix.makeTranslate((node.position[0] - X/2 - 0.5)*Width,
                                 depth,
                                 (node.position[1] - Y/2 - 0.5)*Width/Ratio,
                                 node.getMatrix());
        var rand = (-0.5 + Math.random()) * 0.0;
        osg.Matrix.preMult(node.getMatrix(), osg.Matrix.makeRotate(rand*0.1*Math.PI,0,1,0, []));
        return true;
    } else {

        var scale = 9;
        osg.Matrix.makeTranslate(0.0*Width,
                                 depth,
                                 0.0*Width/Ratio,
                                 node.getMatrix());

        osg.Matrix.preMult(node.getMatrix(), osg.Matrix.makeScale(scale,
                                                                  1.0,
                                                                  scale,
                                                                  []));
        
        var t0 = new osg.Texture();
        t0.setImage(getDummyImage());

        var t1 = new osg.Texture();
        t1.setImage(getDummyImage());

        node.addChild(createEffect(t0, t1, Width));
        organize.setMainNode(node);
        Scene.addChild(node);
        return false;
    }
};



function createScene()
{
    for (var i = 0, l = 50; i < l; i++) {
        if (!getImage())
            break;
    }
    //return osg.createTexturedBoxGeometry(0,0,0, 20, 20, 20);
    //return getModel();
}



window.addEventListener("load", main ,true);
