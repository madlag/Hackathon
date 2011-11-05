
var createPlane = function() {

    function getGroundShader()
    {
        var vertexshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "attribute vec3 Vertex;",
            "uniform mat4 ModelViewMatrix;",
            "uniform mat4 ProjectionMatrix;",
            "varying vec4 position;",
            "vec4 ftransform() {",
            "return ProjectionMatrix * ModelViewMatrix * vec4(Vertex, 1.0);",
            "}",
            "void main(void) {",
            "  gl_Position = ftransform();",
            "  position = vec4(Vertex,1.0);",
            "}"
        ].join('\n');

        var fragmentshader = [
            "",
            "#ifdef GL_ES",
            "precision highp float;",
            "#endif",
            "varying vec4 position;",
            "uniform float density;",
            "uniform vec4 MaterialAmbient;",

            "vec4 getGround(){",
            "  float d = density; //0.001;",
            "  float f = clamp((length(position)-400.0),0.0,10000.0)/400.0;",
            "  f = exp(-d*d/0.1 * (10000.0*f*f) * 1.44);",
            "  f = clamp(f, 0.0, 1.0);",
            "  vec4 color = mix(vec4(1.0), MaterialAmbient, f);",
            "  vec4 result = mix(vec4(f,f,f,f), color, f);",
            "  return result;",
            "}",
            "void main(void) {",
            "vec4 color = getGround();",
            "  gl_FragColor = color;",
            "}",
            ""
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader(gl.VERTEX_SHADER, vertexshader),
            new osg.Shader(gl.FRAGMENT_SHADER, fragmentshader));

        return program;
    }


    var size = 10000;

    var ground = osg.createTexturedQuadGeometry(-size*0.5,-size*0.5,-1800,
                                                size,0,0,
                                                0,size,0);
    
    ground.getOrCreateStateSet().setAttributeAndMode(getGroundShader());
    ground.getOrCreateStateSet().setAttributeAndMode(new osg.Depth('DISABLE'));
    var density = osg.Uniform.createFloat1(0.0020, 'density');
    ground.getOrCreateStateSet().addUniform(density);
    var materialAmbient = osg.Uniform.createFloat4([0.8, 0.8, 0.8 , 1.0], 'MaterialAmbient');
    ground.getOrCreateStateSet().addUniform(materialAmbient);


    var parameterElement = document.getElementById("Parameters");
    var params = new osgUtil.ShaderParameterVisitor();
    params.setTargetHTML(parameterElement);
    params.types.float.params['density'] = {
        min: 0,
        max: 1/1000.0,
        step: 0.00001,
        value: function() { return [0]; }
    };

    ground.accept(params);
    if (false) {
        ground.computeBoundingBox = function(bb) {
            bb.expandByVec3([0,0,0]);
            return bb;
        };
    }

    return ground;
};