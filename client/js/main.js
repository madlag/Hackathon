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
var WorldGallery;
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

        var world = new World;
        WorldGallery = world;
        var scene = world.getScene();

        viewer.getCamera().setClearColor([0.0, 0.0, 0.0, 0.0]);
        viewer.setSceneData(scene);
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


var cropImage = function(w,h, aspect, wrequire) {
    var vstart = 0.0;
    var vend = 1.0;
    var ustart = 0.0;
    var uend = 1.0;

    var imgRatio = w/h;
    if (imgRatio > aspect) {
        var uo = (1.0-(1.0/aspect))/2;
        ustart = uo;
        uend = 1.0-uo;
    }
    var hrequire = wrequire/aspect;
    if (imgRatio < aspect) {
        var vo = (1.0-(aspect))/2;
        //var vo = (h-hrequire)*0.5 / h;
        vstart = vo;
        vend = 1.0-vo;
    }
    osg.log(w+"x"+h + " found uvs " + ustart + ":"+vstart + " " + uend + ":" + vend);
    return [ [ustart, vstart], [uend, vend] ];
};

var testDissolve = false;
var Organizer = function(x, y) {
    this._x = x;
    this._y = y;
    this._images = [];
    this._textures = [];
    this._currentSide = 0;
    this._currentPos = 0;
    this._full = 0;
    this._currentSelected = undefined;
    this._root = new osg.MatrixTransform();
};

Organizer.prototype = {
    getRoot: function () { return this._root; },
    isFull: function() { return this._full;},
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
        var texture = q.getChildren()[0].getStateSet().getTextureAttribute(0,'Texture');
        this._textures.push(texture);

        if (this._currentSide === 0) {
            q.position = [this._currentPos, this._y-1];
            this._currentPos++;
            if (!testDissolve) {
                this.createMain();
                testDissolve = true;
            }
            
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
                //this.createMain();
            }
        }

        this._root.addChild(this._images[this._images.length-1]);
        return true;
    },
    createMain: function() {
        var scale = 9;
        var node = new osg.MatrixTransform();
        osg.Matrix.makeTranslate(0.25*Width,
                                 depth,
                                 0.25*Width/Ratio,
                                 node.getMatrix());

        osg.Matrix.preMult(node.getMatrix(), osg.Matrix.makeScale(scale,
                                                                  scale,
                                                                  scale,
                                                                  []));
        
        var t0 = this._textures[0];
        var t1 = this._textures[1];

        //node.addChild(createEffect(t0, t1, Width));
        this._root.addChild(createWindEffect(t0, [-1000, 0,0], node.getMatrix(), 1.0, Width));


        this._root.addChild(node);
        this._main = node;
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

    var uvs = cropImage(img.width, img.height, Ratio, Width);

    w = Width;
    h = Width/Ratio;

    var q = osg.createTexturedQuadGeometry(-w/2, 0, -h/2,
                                           w, 0, 0,
                                           0, 0, h,
                                           uvs[0][0],uvs[0][1],
                                           uvs[1][0],uvs[1][1]
                                          );
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

var getFakeImageURL = function() {
    var index = Math.floor(Math.random()*6.0);
    return "img/Screenshot-"+index.toString()+".png"
};

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


var World = function() {
    this._groups = [];
    this._currentGroup;
    this._scene = new osg.Node();
    this.createGroup();
};

World.prototype = {
    getScene: function() { return this._scene; },
    createGroup: function() {
        var o = new Organizer(X+2,Y+2);
        this._groups.push(o);
        this._currentGroup = o;
        this._scene.addChild(o.getRoot());
        return o;
    },
    getOrCreateGroup: function() {
        if (this._currentGroup && this._currentGroup.isFull()) {
            this.createGroup();
        }
        return this._currentGroup;
    },

    createQuadFromImage: function(img) {
        var node = new osg.MatrixTransform();
        var q = createQuad(img);
        node.addChild(q);
        this.push(node);
        depth++;
        osg.Matrix.makeTranslate((node.position[0] - X/2 - 0.5)*Width,
                                 depth,
                                 (node.position[1] - Y/2 - 0.5)*Width/Ratio,
                                 node.getMatrix());
        var rand = (-0.5 + Math.random()) * 0.0;
        osg.Matrix.preMult(node.getMatrix(), osg.Matrix.makeRotate(rand*0.1*Math.PI,0,1,0, []));
    },

    addImage: function(url) {
        var grp = this.getOrCreateGroup();
        var img = new Image;
        img.onload = function() {
            World.prototype.createQuadFromImage.call(grp, img);
        };
        img.src = url;
    },
};



var getImage = function() {
    var node = new osg.MatrixTransform();

    if (organize.push(node)) {
        var q = createQuad(getDummyImage());
        node.addChild(q);

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
        osg.Matrix.makeTranslate(0.25*Width,
                                 depth,
                                 0.25*Width/Ratio,
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



function createScene(scene)
{
    scene.addChild(createPlane());
    for (var i = 0, l = 50; i < l; i++) {
        if (!getImage())
            break;
    }
}


var fakeEventImage = function(event) {
    WorldGallery.addImage(getFakeImageURL());
};

window.addEventListener("load", main ,true);
window.addEventListener("keyup", fakeEventImage, false);

