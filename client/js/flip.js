
var TransitionUpdateCallback = function() {};
TransitionUpdateCallback.prototype = {

    update: function(node, nv) {
        var t = nv.getFrameStamp().getSimulationTime();
        var dt = t - node._lastUpdate;
        if (dt < 0) {
            return true;
        }
        node._lastUpdate = t;

        var m = node.getMatrix();
        var current = [];
        osg.Matrix.getTrans(m, current);
        //var target = this._target;
        var target = current;

        var dx = target[0] - current[0];
        var dy = target[1] - current[1];
        var dz = target[2] - current[2];

        var speedSqr = dx*dx + dy*dy + dz*dz;
        var maxSpeed = 10.0;
        var maxSpeedSqr = maxSpeed*maxSpeed;
        if (speedSqr > maxSpeedSqr) {
            var quot = maxSpeed/Math.sqrt(speedSqr);
            dx *= quot;
            dy *= quot;
            dz *= quot;
        }
        //osg.log("speed " + Math.sqrt(dx*dx + dy*dy + dz*dz) );
        
        var ratio = osgAnimation.EaseInQuad(Math.min((t-node._start)/2.0, 1.0));
        current[0] += dx * dt * ratio;
        current[1] += dy * dt * ratio;
        current[2] += dz * dt * ratio;

        osg.Matrix.makeRotate(ratio * Math.PI, node._axis[0], node._axis[1], node._axis[2] ,m);
        //osg.Matrix.makeRotate(ratio * Math.PI, 0, 0, 1.0 ,m);
        osg.Matrix.setTrans(m, current[0], current[1], current[2]);
        return true;
    }
};

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

    var uvs = model.getAttributes().TexCoord0;
    var array = uvs.getElements();

    array[0] = l; array[1] = t;
    array[2] = l; array[3] = b;
    array[4] = r; array[5] = b;
    array[6] = r; array[7] = t;

    array[8] = l; array[9] = t;
    array[10] = l; array[11] = b;
    array[12] = r; array[13] = b;
    array[14] = r; array[15] = t;

    array[8] = -1; array[9] = -1;
    array[10] = -1; array[11] = -1;
    array[12] = -1; array[13] = -1;
    array[14] = -1; array[15] = -1;


    array[16] = 0; array[17] = 0;
    array[18] = 0; array[19] = 0;
    array[20] = 0; array[21] = 0;
    array[22] = 0; array[23] = 0;

    array[24] = 0; array[25] = 0;
    array[26] = 0; array[27] = 0;
    array[28] = 0; array[29] = 0;
    array[30] = 0; array[31] = 0;


    array[32] = 0; array[33] = 0;
    array[34] = 0; array[35] = 0;
    array[36] = 0; array[37] = 0;
    array[38] = 0; array[39] = 0;

    array[40] = 0; array[41] = 0;
    array[42] = 0; array[43] = 0;
    array[44] = 0; array[45] = 0;
    array[46] = 0; array[47] = 0;



    var array1 = new Float32Array(array);
    array1[0] = -1; array1[1] = -1;
    array1[2] = -1; array1[3] = -1;
    array1[4] = -1; array1[5] = -1;
    array1[6] = -1; array1[7] = -1;

    array1[8] = r; array1[9] = t;
    array1[10] = l; array1[11] = t;
    array1[12] = l; array1[13] = b;
    array1[14] = r; array1[15] = b;


    array1[16] = 0; array1[17] = 0;
    array1[18] = 0; array1[19] = 0;
    array1[20] = 0; array1[21] = 0;
    array1[22] = 0; array1[23] = 0;

    array1[24] = 0; array1[25] = 0;
    array1[26] = 0; array1[27] = 0;
    array1[28] = 0; array1[29] = 0;
    array1[30] = 0; array1[31] = 0;


    array1[32] = 0; array1[33] = 0;
    array1[34] = 0; array1[35] = 0;
    array1[36] = 0; array1[37] = 0;
    array1[38] = 0; array1[39] = 0;

    array1[40] = 0; array1[41] = 0;
    array1[42] = 0; array1[43] = 0;
    array1[44] = 0; array1[45] = 0;
    array1[46] = 0; array1[47] = 0;
    model.getVertexAttributeList()['TexCoord1'] = new osg.BufferArray( 
        osg.BufferArray.ARRAY_BUFFER,
        array1,
        2);

    return model;
};


var createMosaicShader = function() {

    if (createMosaicShader.shader === undefined) {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "attribute vec3 Normal;",
            "attribute vec2 TexCoord0;",
            "attribute vec2 TexCoord1;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",

            "varying vec2 FragTexCoord0;",
            "varying vec2 FragTexCoord1;",

            "void main(void) {",
            "gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
            "FragTexCoord0 = TexCoord0;",
            "FragTexCoord1 = TexCoord1;",
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
            "uniform sampler2D Texture1;",
            "varying vec2 FragTexCoord0;",
            "varying vec2 FragTexCoord1;",

            "void main(void) {",

            "vec4 color = vec4(0.0);",
            "if (FragTexCoord0.x >= 0.0) {",
            "  color += texture2D( Texture0, FragTexCoord0.xy);",
            "}",

            "if (FragTexCoord1.x >= 0.0) {",
            "  color += texture2D( Texture1, FragTexCoord1.xy);",
            "}",

            "gl_FragColor = color;",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));
        createMosaicShader.shader = program;
    }
    return createMosaicShader.shader;
};

var createEffect = function(texture0, texture1, width) {
    var center = [0, 0, 0];

    var totalSizeX = width;
    var maxx = 20;

    var sizex = totalSizeX/maxx;
    var maxy = maxx/Ratio;

    var size = [sizex, sizex*0.1, sizex];

    var group = new osg.MatrixTransform();
    group.getOrCreateStateSet().setAttributeAndMode(createMosaicShader());
    group.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(0, 'Texture0'));
    group.getOrCreateStateSet().addUniform(osg.Uniform.createInt1(1, 'Texture1'));
    var cb = new TransitionUpdateCallback();

    for (var y = 0; y < maxy; y++) {
        for (var x = 0; x < maxx; x++) {
            var mtr = new osg.MatrixTransform();
            var rx = x*size[0] - maxx*size[0]*0.5 + center[0];
            var ry = 0 + center[1];
            var rz = y*size[2] - maxy*size[2]*0.5 + center[2];
            mtr.setMatrix(osg.Matrix.makeTranslate(rx,ry,rz,[]));

            var model = createTexturedBox(0,0,0,
                                          size[0], size[1], size[2],
                                          x/(maxx+1), (x+1)/(maxx+1),
                                          y/(maxy+1), (y+1)/(maxy+1));
            model.getOrCreateStateSet().setTextureAttributeAndMode(0, texture0);
            model.getOrCreateStateSet().setTextureAttributeAndMode(1, texture1);

            mtr.addChild(model);
            group.addChild(mtr);
            mtr.addUpdateCallback(cb);
            //var t = (x*maxy + y)*0.02;
            var t = osg.Vec3.length([-maxx*size[0]*0.5-rx ,0,rz - maxy*size[2]*0.5 ]);
            t = t*0.008+0.2;
            mtr._lastUpdate = t;
            mtr._start = t;
            mtr._axis = [ Math.random(), 0, Math.random()];
            mtr._axis = [ 1.0, 0, 1.0];
            osg.Vec3.normalize(mtr._axis, mtr._axis);
        }
    }
    return group;
};
