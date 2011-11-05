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
        viewer.setupManipulator();
        viewer.getManipulator().computeHomePosition();
        viewer.getManipulator().setTarget([0,0,0]);
        viewer.getManipulator().setDistance(300);
        viewer.getManipulator().getInverseMatrix = function() {
            return osg.Matrix.makeLookAt([0,-600,0], [0,0,0], [0,0,1], []);
        };
        viewer.setSceneData(scene);

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

var getQuadShader = function() {
    if (getQuadShader.shader === undefined) {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec3 Normal;",
            "attribute vec2 TexCoord0;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 NormalMatrix;",
            "uniform mat4 ProjectionMatrix;",

            "varying vec2 FragTexCoord0;",
            "varying float shade;",

            "vec3 computeEyeDirection() {",
            "return vec3(ModelViewMatrix * vec4(Vertex,1.0));",
            "}",

            "void main(void) {",
            "gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "vec3 normal = mat3(NormalMatrix) * normalize(Normal);",
            "vec3 eye = normalize(-computeEyeDirection());",
            "shade = max(dot(normal,eye), 0.0);",
            "//shade = 1.0;",
            "FragTexCoord0 = TexCoord0;",
            "}",
            ""
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "uniform float fade;",
            "uniform sampler2D Texture0;",
            "varying vec2 FragTexCoord0;",
            "varying float shade;",

            "void main(void) {",
            "vec4 color = texture2D( Texture0, FragTexCoord0.xy);",
            "color.xyz *= fade;",
            "color.w = fade;",
            "gl_FragColor = color*shade;",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader(osg.Shader.VERTEX_SHADER, vertexshader),
            new osg.Shader(osg.Shader.FRAGMENT_SHADER, fragmentshader));
        getQuadShader.shader = program;
    }

    return getQuadShader.shader;
};


var UpdatePhotoCallback = function() {};
UpdatePhotoCallback.prototype = {
    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();

        if (node.lastUpdate === false) {
            return true;
        } else if (node.lastUpdate < 0) {
            node.lastUpdate = t;
            node.startTime += t;
        }

        var dt = t - node.startTime;
        if (dt < 0) {
            return true;
        }
        
        var trans = [];
        var maxt = 2.0;
        var ratio = osgAnimation.EaseOutQuart(Math.min(dt*1.0/maxt, 1.0));
        if (t > maxt) {
            ratio += (t - maxt) * 0.01;
        }

        if (dt > 2.5) {

            var parent = node.getParents()[0];
            var m = node.getWorldMatrices()[0];
            var range = 400;
            var depth = -1000;
            var effect = createWindEffect(node.texture, [(-0.5+Math.random())*range, depth, (-0.5+Math.random())*range], m, 0.0, Width);
            parent.addChild(effect);
            node.setNodeMask(0x0);
            //node.effect.setNodeMask(~0x0);
            return true;
        }
        node.fade.get()[0] = ratio;
        node.fade.dirty();

        osg.Matrix.getTrans(node.getMatrix(), trans);
        var range = 3000;
        trans[1] = range + (-ratio) * range;
        osg.Matrix.setTrans(node.getMatrix(), trans[0], trans[1], trans[2]);
        return true;
    }
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
    this._root.getOrCreateStateSet().setAttributeAndMode(getQuadShader());

    var w = Width;
    var h = Width/Ratio;
    var space = 10;

    this._layouts = [
        [ [ -w/2 - space/2, h/2+space/2],
          [ w/2 + space/2, h/2+space/2],
          [ 0, -h/2 -space/2]
        ],

        [ [ -w/2 - space/2, 0],
          [ w/2 + space/2, 0]
        ],

        [ [ -w/2 - space/2, h/2+space/2],
          [ w/2 + space/2, h/2+space/2],
          [ -w/2 - space/2, -h/2 -space/2],
          [ w/2 + space/2, -h/2 -space/2]
        ]
    ];

    this._layout = this.getLayout();
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

    getLayout: function() {
        var idx = Math.floor(Math.random() * (this._layouts.length)) % this._layouts.length;
        return this._layouts[idx];
    },

    push: function(q) {

        if (this._full) {
            return false;
        }

        q.addUpdateCallback(new UpdatePhotoCallback());
        q.lastUpdate = false;
        var fade = osg.Uniform.createFloat1(0.0,'fade');
        q.getOrCreateStateSet().addUniform(fade);
        q.fade = fade;

        this._images.push(q);
        var texture = q.getChildren()[0].getStateSet().getTextureAttribute(0,'Texture');
        q.texture = texture;
        this._textures.push(texture);
        var w = Width;
        var h = Width/Ratio;

        var material = new osg.Material();
        q.material = material;
        q.getOrCreateStateSet().setAttributeAndMode(material);
        q.getOrCreateStateSet().setAttributeAndMode(new osg.BlendFunc('ONE', 'ONE_MINUS_SRC_ALPHA'));

        var layout = this._layout;

        q.position = layout[this._currentPos];
        this._currentPos++;
        if (this._currentPos >= layout.length) {
            this._full = true;
            this.start();
        }

        this._root.addChild(this._images[this._images.length-1]);
        return true;
    },

    start: function() {
        for (var i = 0, l = this._images.length; i < l; i++) {
            this._images[i].lastUpdate = -1;
            this._images[i].startTime = Math.random();
        }
    }

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

    var fakeEventImage = function(event) {
        if (event.keyCode === 32) {
            WorldGallery.addImage(getFakeImageURL());
            WorldGallery.addImage(getFakeImageURL());
            WorldGallery.addImage(getFakeImageURL());
            WorldGallery.addImage(getFakeImageURL());
        }
    };

    window.addEventListener("keyup", fakeEventImage, false);

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
        if (this.isFull()) {
            return;
        }
        var node = new osg.MatrixTransform();
        var q = createQuad(img);
        node.addChild(q);
        this.push(node);
        osg.Matrix.makeTranslate((node.position[0]),
                                 0,
                                 (node.position[1]),
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




window.addEventListener("load", main ,true);

