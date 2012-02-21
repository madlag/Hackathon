/** -*- compile-command: "jslint-cli wind.js" -*- */

var EnableTweaking = false;
var TransitionParameter = {
    distanceFade: 50.0
};

var TransitionUpdateCallback = function(target) {
    this.setTarget(target);

    if (EnableTweaking) {
        if (TransitionUpdateCallback.slider === undefined) {
            var domTarget = document.getElementById('Parameters');
            osgUtil.ParameterVisitor.createSlider('distance', 
                                                  'fadeTweetDistance',
                                                  TransitionParameter,
                                                  'distanceFade',
                                                  TransitionParameter.distanceFade,
                                                  0.0,
                                                  400.0,
                                                  1.0, domTarget);

            TransitionUpdateCallback.slider = true;
        }
    }

};

var createWindEffect2 = function(texture, target, matrix, time, width, initialSpeed, origGroup)
{
    initialSpeed = [0,0,0] ; //
    var ReleaseObject = function() {
        this._elements = [];
        this.push = function(o) {
            this._elements.push(o);
        };
        this.doit = function() {
            var gl = Viewer.getState().getGraphicContext();
            var e = this._elements;
            osg.log("release box " + e.length);
            for (var i = 0, l = e.length; i < l; i++) {
                e[i].releaseGLObjects(gl);
            }
            e.splice(0, e.length);
            osg.log("current number vertex buffer " + osg.BufferArray.manager._numObject + " - create/release " + osg.BufferArray.nbCreate + "/" + osg.BufferArray.nbRelease);
        };

    };
    var arrayOfObjectToRelease = new ReleaseObject();

    var createTexturedBox = function(centerx, centery, centerz,
                                     sizex, sizey, sizez,
                                     l, r, b ,t, origModel)
    {
        var model;
        if (origModel) {
            model = origModel;
        } else {
            model = osg.createTexturedBoxGeometry(centerx,
                                                  centery,
                                                  centerz,
                                                  sizex,
                                                  sizey,
                                                  sizez);
        }

        var uvs = model.getAttributes().TexCoord0;
        var array = uvs.getElements();

        if (true) {
            array[0] = l; array[1] = t;
            array[2] = l; array[3] = b;
            array[4] = r; array[5] = b;
            array[6] = r; array[7] = t;

            array[8] = r; array[9] = t;
            array[10] = r; array[11] = b;
            array[12] = l; array[13] = b;
            array[14] = l; array[15] = t;
        } else {
            array[0] = 0; array[1] = t;
            array[2] = 0; array[3] = b;
            array[4] = 0; array[5] = b;
            array[6] = 0; array[7] = t;

            array[8] = 0; array[9] = 0;
            array[10] = 0; array[11] = 0;
            array[12] = 0; array[13] = 0;
            array[14] = 0; array[15] = 0;
        }

        if (true) {
            array[16] = 0; array[17] = 0;
            array[18] = 0; array[19] = 0;
            array[20] = 0; array[21] = 0;
            array[22] = 0; array[23] = 0;

            array[24] = 0; array[25] = 0;
            array[26] = 0; array[27] = 0;
            array[28] = 0; array[29] = 0;
            array[30] = 0; array[31] = 0;
        } else {
            array[16] = l; array[17] = t;
            array[18] = l; array[19] = b;
            array[20] = r; array[21] = b;
            array[22] = r; array[23] = t;

            array[24] = l; array[25] = t;
            array[26] = l; array[27] = b;
            array[28] = r; array[29] = b;
            array[30] = r; array[21] = t;
        }

        if (true) {
            array[32] = 0; array[33] = 0;
            array[34] = 0; array[35] = 0;
            array[36] = 0; array[37] = 0;
            array[38] = 0; array[39] = 0;

            array[40] = 0; array[41] = 0;
            array[42] = 0; array[43] = 0;
            array[44] = 0; array[45] = 0;
            array[46] = 0; array[47] = 0;
        } else {
            array[32] = l; array[33] = t;
            array[34] = l; array[35] = b;
            array[36] = r; array[37] = b;
            array[38] = r; array[39] = t;

            array[40] = r; array[41] = t;
            array[42] = r; array[43] = b;

            array[44] = l; array[45] = b;
            array[46] = l; array[47] = t;
        }
        uvs.dirty();
        return model;
    };

    var uvs = cropImage(texture.getImage().width,
                        texture.getImage().height,
                        Ratio,
                        Width);

    var ulenght = (uvs[1][0]-uvs[0][0]);
    var vlenght = (uvs[1][1]-uvs[0][1]);


    var totalSizeX = width;
    var maxx = 12;

    var sizex = totalSizeX/maxx;
    var maxy = maxx/Ratio;

    var size = [sizex, sizex*0.1, sizex];

    var group;
    if (origGroup === undefined) {
        group = new osg.MatrixTransform();
        group.isValid = function() {
            return this.valid;
        };
    } else {
        group = origGroup;
    }

    group.valid = false;

    group.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    var cb = group.boxUpdateCallback;
    if (!cb) {
        cb = new TransitionUpdateCallback(target);
        group.boxUpdateCallback = cb;
    } else {
        cb.setTarget(target);
    }
    
    var center = [];
    osg.Matrix.getTrans(matrix, center);

    var nbSubChilds = group.getChildren().length;
    var indexChild = 0;

    for (var y = 0; y < maxy; y++) {
        for (var x = 0; x < maxx; x++) {
            var mtr;
            if (nbSubChilds > 0) {
                mtr = group.getChildren()[indexChild++];
                nbSubChilds--;
            } else {
                mtr = new osg.MatrixTransform();
            }
            mtr.setNodeMask(~0x0);

            var rx = x*size[0] - maxx*size[0]*0.5 + size[0]*0.5;
            var ry = 0;
            var rz = y*size[2] - maxy*size[2]*0.5 + size[2]*0.5;

            var matrixTranslate = mtr.getMatrix();
            osg.Matrix.makeTranslate(rx,ry,rz, matrixTranslate);
            osg.Matrix.postMult(matrix, matrixTranslate);
            //mtr.setMatrix(matrixTranslate);
            var pos = [];
            osg.Matrix.getTrans(matrixTranslate, pos);

            var origModel;
            if (mtr.getChildren().length > 0) {
                origModel = mtr.getChildren()[0];
            }

            var model = createTexturedBox(0,0,0,
                                          size[0], size[1], size[2],
                                          uvs[0][0] + ulenght*x/(maxx), uvs[0][0] + ulenght*(x+1)/(maxx),
                                          uvs[0][1] + vlenght*y/(maxy), uvs[0][1] + vlenght*(y+1)/(maxy), origModel );
            arrayOfObjectToRelease.push(model);

            if (origModel === undefined) {
                mtr.addChild(model);
                group.addChild(mtr);
                mtr.setUpdateCallback(cb);
            }
            var t = time;
            var t2 = (x*maxy + y)*0.005;
            mtr._lastUpdate = -1;
            mtr._startDissolve = t2;
            mtr._start = t;
            mtr._axis = [ Math.random(), Math.random(), Math.random()];
            mtr._initialSpeed = initialSpeed;
            mtr._rotation = [];
            mtr.maxSpeed = 0.4 + Math.random() * 10.0;
            osg.Matrix.copy(matrix, mtr._rotation);
            osg.Matrix.setTrans(mtr._rotation, 0,0,0);

            mtr._lastPosition = [];
            mtr._currentPosition = [pos[0], pos[1], pos[2]];

            osg.Vec3.sub(pos, initialSpeed, mtr._lastPosition);
            osg.Vec3.normalize(mtr._axis, mtr._axis);
        }
    }

    var getFunction = function(arg) {
        var o = arg;
        var f = function() {
            console.log();
            o.doit();
        };
        return f;
    };
    setTimeout(getFunction(arrayOfObjectToRelease), 5000);

    osg.log("create box " + (maxy*maxx).toString() + " - create/release " + osg.BufferArray.nbCreate + "/" + osg.BufferArray.nbRelease);

    return group;
};

var getOrCreateWindEffect = function(texture, target, matrix, time, width, initialSpeed) {

    if (getOrCreateWindEffect.buffers === undefined) {
        getOrCreateWindEffect.buffers = [];
    }

    if (false) {
        for (var i = 0, l = getOrCreateWindEffect.buffers.length; i < l; i++) {
            if (getOrCreateWindEffect.buffers[i].isValid()) {
                createWindEffect2(texture, target, matrix, time, width, initialSpeed, getOrCreateWindEffect.buffers[i]);
                osg.log("reuse wind effects ( " + getOrCreateWindEffect.buffers.length + ")");
                return getOrCreateWindEffect.buffers[i];
            }
        }
    } else {
        return createWindEffect2(texture, target, matrix, time, width, initialSpeed);
    }

    var effect = createWindEffect2(texture, target, matrix, time, width, initialSpeed);
    getOrCreateWindEffect.buffers.push(effect);
    return effect;
};



function CheckNaN(a) {
    for (var i = 0, l = a.length; i < l; i++ ) {
        if ( isNaN(a[i]) || Math.abs(a[i]) > 100000000) {
            return true;
        }
    }
}

TransitionUpdateCallback.prototype = {
    setTarget: function(target) {
        this._target = target;
    },
    getVelocityField: function (posOri, time ) {
        var t = time/1000.0 % 0.5;
        var pos = posOri.slice(0);
        var scale = 1.0/100.0;
        pos[0]*= scale; 
        pos[1]*= scale; 
        pos[2]*= scale; 
        var vx = 0.0+Math.cos(0.5+2.0*(pos[0]*pos[0]*t));
        var vy = Math.cos(4.0*(pos[1]*t) + Math.sin(4.0*pos[0]*t*t));
        var vz = Math.cos(pos[0]*pos[2]*2.0*t);
        var factor = 0.1;
        var vec = [ vx, vy, vz];
        osg.Vec3.normalize(vec, vec);
        vec[0] *= factor;
        vec[1] *= factor;
        vec[2] *= factor;
        return vec;
    },
    updateMaterial: function(distanceSqr, stateset, dt) {
        var startFade = TransitionParameter.distanceFade;
        startFade *= startFade;
        var fadeRatio = osgAnimation.EaseInCubic(Math.min(distanceSqr/startFade, 1.0));
        var stop = 4.0;
        var timeFade = stop-dt;
        timeFade = Math.max(timeFade, 0.0)/stop;
        fadeRatio *= timeFade;

        var alphaUniform = stateset.getUniform('fade');
        if (alphaUniform === undefined) {
            alphaUniform = osg.Uniform.createFloat1(1.0, 'fade');
            stateset.addUniform(alphaUniform);
        }
        //osg.log("fade ratio " + fadeRatio + " dt " + dt);
        if (fadeRatio < 0.01) {
            return false;
        }
        alphaUniform.get()[0] = fadeRatio;
        alphaUniform.dirty();
        return true;
    },

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        if (node._lastUpdate < 0) {
            node._start += t;
            node._lastUpdate = node._start;
            node._startDissolve += t;
        }

        var dt = t - node._lastUpdate;

        if (dt < 0) {
            return true;
        }
        node._lastUpdate = t;

        var m = node.getMatrix();
        var current = [];
        osg.Vec3.copy(node._currentPosition, current);

        var target = this._target;

        var dx = target[0] - current[0];
        var dy = target[1] - current[1];
        var dz = target[2] - current[2];

        var speedSqr = dx*dx + dy*dy + dz*dz;

        if (!this.updateMaterial(speedSqr, node.getOrCreateStateSet(), t - node._start)) {
            node.setNodeMask(0x0);
            return false;
        }
        var maxSpeed = node.maxSpeed;
        var maxSpeedSqr = maxSpeed*maxSpeed;
        if (speedSqr > maxSpeedSqr) {
            var quot = maxSpeed/Math.sqrt(speedSqr);
            dx *= quot;
            dy *= quot;
            dz *= quot;
        }
        
        var ddt = Math.max((t-node._startDissolve),0.0);
        var ratio = osgAnimation.EaseInQuad(Math.min(ddt, 1.0));
        ratio = Math.max(ratio, 0.0);

        var attractVector = [];
        attractVector[0] = (dx * dt) * ratio;
        attractVector[1] = (dy * dt) * ratio;
        attractVector[2] = (dz * dt) * ratio;

        var delta = [];
        osg.Vec3.sub(node._currentPosition, node._lastPosition, delta);
        
        speedSqr = delta[0] * delta[0] + delta[1] * delta[1] + delta[2]*delta[2];
        //var windFactor = - Math.min(2.0 * speedSqr * dt, 1000.0);
        var windFactor = - 0.01 * speedSqr;
        var windVector = [ windFactor*delta[0],
                           windFactor*delta[1],
                           windFactor*delta[2] ];

        var vecSpeed = [];
        var windNoise = this.getVelocityField(current, t);
        osg.Vec3.add(delta, windVector , vecSpeed);
        osg.Vec3.add(vecSpeed, current, current);
        osg.Vec3.add(attractVector, current, current);
        osg.Vec3.add(windNoise, current, current);

    
        osg.Vec3.copy(node._currentPosition, node._lastPosition);
        osg.Vec3.copy(current, node._currentPosition);

        var localRotation = [];
        var rotatedissolve = Math.max(t-node._startDissolve, 0);
        osg.Matrix.makeRotate(rotatedissolve*2.0 * ratio, node._axis[0], node._axis[1], node._axis[2] , localRotation);
        osg.Matrix.mult(node._rotation, localRotation, m);

        osg.Matrix.setTrans(m, current[0], current[1], current[2]);
        return true;
    }
};




var createWindEffect = function(texture, target, matrix, time, width, initialSpeed) {

    initialSpeed = [0,0,0] ; //

    var createTexturedBox = function(centerx, centery, centerz,
                                     sizex, sizey, sizez,
                                     l, r, b ,t)
    {
        var model = osg.createTexturedBoxGeometry(centerx,
                                                  centery,
                                                  centerz,
                                                  sizex,
                                                  sizey,
                                                  sizez);

        if (false) {
            model.drawImplementation = function(state) {
                //osg.log("Here");
                osg.Geometry.prototype.drawImplementation.call(this, state);
            };
        }
        var uvs = model.getAttributes().TexCoord0;
        var array = uvs.getElements();

        if (true) {
            array[0] = l; array[1] = t;
            array[2] = l; array[3] = b;
            array[4] = r; array[5] = b;
            array[6] = r; array[7] = t;

            array[8] = r; array[9] = t;
            array[10] = r; array[11] = b;
            array[12] = l; array[13] = b;
            array[14] = l; array[15] = t;
        } else {
            array[0] = 0; array[1] = t;
            array[2] = 0; array[3] = b;
            array[4] = 0; array[5] = b;
            array[6] = 0; array[7] = t;

            array[8] = 0; array[9] = 0;
            array[10] = 0; array[11] = 0;
            array[12] = 0; array[13] = 0;
            array[14] = 0; array[15] = 0;
        }

        if (true) {
            array[16] = 0; array[17] = 0;
            array[18] = 0; array[19] = 0;
            array[20] = 0; array[21] = 0;
            array[22] = 0; array[23] = 0;

            array[24] = 0; array[25] = 0;
            array[26] = 0; array[27] = 0;
            array[28] = 0; array[29] = 0;
            array[30] = 0; array[31] = 0;
        } else {
            array[16] = l; array[17] = t;
            array[18] = l; array[19] = b;
            array[20] = r; array[21] = b;
            array[22] = r; array[23] = t;

            array[24] = l; array[25] = t;
            array[26] = l; array[27] = b;
            array[28] = r; array[29] = b;
            array[30] = r; array[21] = t;
        }

        if (true) {
            array[32] = 0; array[33] = 0;
            array[34] = 0; array[35] = 0;
            array[36] = 0; array[37] = 0;
            array[38] = 0; array[39] = 0;

            array[40] = 0; array[41] = 0;
            array[42] = 0; array[43] = 0;
            array[44] = 0; array[45] = 0;
            array[46] = 0; array[47] = 0;
        } else {
            array[32] = l; array[33] = t;
            array[34] = l; array[35] = b;
            array[36] = r; array[37] = b;
            array[38] = r; array[39] = t;

            array[40] = r; array[41] = t;
            array[42] = r; array[43] = b;

            array[44] = l; array[45] = b;
            array[46] = l; array[47] = t;
        }
        return model;
    };


    var image = texture.getImage();
    var wi = 0;
    var hi = 0;
    if (image) {
        wi = image.width;
        hi = image.height;
    }
    var uvs = cropImage(wi,
                        hi,
                        Ratio,
                        Width);

    var ulenght = (uvs[1][0]-uvs[0][0]);
    var vlenght = (uvs[1][1]-uvs[0][1]);


    var totalSizeX = width;
    var maxx = 16;

    var sizex = totalSizeX/maxx;
    var maxy = maxx/Ratio;

    var size = [sizex, sizex*0.1, sizex];

    var group = new osg.MatrixTransform();
    group.getOrCreateStateSet().setTextureAttributeAndMode(0, texture);
    var cb = new TransitionUpdateCallback(target);
    
    var vOffset = 1.0-texture.vOffset;
    var vSize = texture.vOffset;

    var center = [];
    osg.Matrix.getTrans(matrix, center);

    for (var y = 0; y < maxy; y++) {
        for (var x = 0; x < maxx; x++) {
            var mtr = new osg.MatrixTransform();
            var rx = x*size[0] - maxx*size[0]*0.5 + size[0]*0.5;
            var ry = 0;
            var rz = y*size[2] - maxy*size[2]*0.5 + size[2]*0.5;

            var matrixTranslate = [];
            osg.Matrix.makeTranslate(rx,ry,rz, matrixTranslate);
            osg.Matrix.postMult(matrix, matrixTranslate);
            mtr.setMatrix(matrixTranslate);
            var pos = [];
            osg.Matrix.getTrans(matrixTranslate, pos);

            var model = createTexturedBox(0,0,0,
                                          size[0], size[1], size[2],
                                          uvs[0][0] + ulenght*x/(maxx), uvs[0][0] + ulenght*(x+1)/(maxx),
                                          uvs[0][1] + vlenght*y/(maxy), uvs[0][1] + vlenght*(y+1)/(maxy));

            mtr.addChild(model);
            group.addChild(mtr);
            mtr.addUpdateCallback(cb);
            var t = time;
            var t2 = (x*maxy + y)*0.005;
            mtr._lastUpdate = -1;
            mtr._startDissolve = t2;
            mtr._start = t;
            mtr._axis = [ Math.random(), Math.random(), Math.random()];
            mtr._initialSpeed = initialSpeed;
            mtr._rotation = [];
            mtr.maxSpeed = 0.4 + Math.random() * 10.0;
            osg.Matrix.copy(matrix, mtr._rotation);
            osg.Matrix.setTrans(mtr._rotation, 0,0,0);

            mtr._lastPosition = [];
            mtr._currentPosition = [pos[0], pos[1], pos[2]];

            osg.Vec3.sub(pos, initialSpeed, mtr._lastPosition);
            osg.Vec3.normalize(mtr._axis, mtr._axis);
        }
    }
    return group;
};