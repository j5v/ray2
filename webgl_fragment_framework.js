/*
  WebGL Fragment Framework
  (c) Lewpen Kinross-Skeels 2011
  www.lewpen.com

  This provides a simple way to play with fragment shaders.
  You provide an HTML canvas element and a fragment shader, and this shader is executed for each pixel in
  the canvas.  This is implemented by rendering one quad which takes up the whole area of the canvas.

  Your fragment shader has 3 inputs:

    varying vec3 vPosition;  //  Position of this pixel in the canvas - ranging from -1.0 to 1.0 in X and Y
    uniform float uTime;     //  Time in seconds since the animaton started
    uniform vec2 uMousePos;  //  Position of the mouse cursor over the canvas, from -1.0 to 1.0 in X and Y

  Here is a template HTML file using this script:

    <html>
    <title>WebGL Fragment Shader Canvas</title>

    <script src="webgl_fragment_framework.001.js"></script>

    <script id="shader" type="x-shader/x-fragment">

      #ifdef GL_ES
      precision mediump float;
      #endif

      varying vec3 vPosition;  //  Position of this pixel in the canvas - ranging from -1.0 to 1.0 in X and Y
      uniform float uTime;     //  Time in seconds since the animaton started
      uniform vec2 uMousePos;  //  Position of the mouse cursor over the canvas, from -1.0 to 1.0 in X and Y

      void main(void)
      {
        float r = 0.5 + 0.5 * vPosition.x;
        float g = 0.5 + 0.5 * vPosition.y;
        float b = 0.5 + 0.5 * sin( uTime );

        gl_FragColor = vec4( r, g, b, 1.0 );
      }

    </script>

    <body onload="webgl_init( 'canvas', 'shader', 'status' )" bgcolor="#000000">

    <table cellspacing="0" cellpadding="0" border="0" width="100%" height="100%"><tr><td align="center" valign="middle">
    <table cellspacing="0" cellpadding="0" border="0" width="200">
      <tr>
        <td style="padding:8px;background:#555555;color:#FFFFFF;font-family:arial;font-size:11px;font-weight:bold">
          <div>WebGL Fragment Shader Test</div>
        </td>
      </tr>
      <tr>
        <td><canvas id="canvas" width="200" height="200" style="border:5px solid #FFFFFF"></canvas></td>
      </tr><tr>
        <td style="padding:8px;background:#555555;color:#FFFFFF;font-family:arial;font-size:11px;font-weight:bold">
          <div id="status">&nbsp;</div>
        </td>
      </tr>
    </table>
    </td></tr></table>

    </body>
    </html>

*/


  var gl;
  var webgl_shaderElementName;
  var shaderProgram;
  var aVertexPosition;


  function initGL(canvas)
  {
    console.logFunction( 'initGL', [ canvas ] )

    try {
      gl = canvas.getContext("experimental-webgl");
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch(e) {
      throw [ e, "Could not initialise WebGL, sorry :-(" ]
    }
    if (!gl) {
      throw "Could not initialise WebGL, sorry :-("
    }
  }


  function createShaderProgram( gl, vs, fs )
  {
    console.logFunction( 'createShaderProgram', [ gl, vs, fs ] )

    var shaderProgram = gl.createProgram()

    //  Create vertex shader

    console.log( '* CREATING VSHADER' )

    var vshader = gl.createShader( gl.VERTEX_SHADER )
    gl.shaderSource( vshader, vs )
    gl.compileShader( vshader )

    if( !gl.getShaderParameter( vshader, gl.COMPILE_STATUS ) )
    {
      alert("Vertex shader compilation error\n"+gl.getShaderInfoLog(vshader)+"\n\n--\n"+vs);
      return null
    }

    //  Create fragment shader

    console.log( '* CREATING FSHADER' )

    var fshader = gl.createShader( gl.FRAGMENT_SHADER )
    gl.shaderSource( fshader, fs )
    gl.compileShader( fshader )

    if( !gl.getShaderParameter( fshader, gl.COMPILE_STATUS ) )
    {
      alert("Fragment shader compilation error\n"+gl.getShaderInfoLog(fshader)+"\n\n--\n"+fs);
      return null
    }

    //  Create and link program

    console.log( '* ATTACHING VSHADER' )

    gl.attachShader( shaderProgram, vshader )

    console.log( '* ATTACHING FSHADER' )

    gl.attachShader( shaderProgram, fshader )

    console.log( '* LINKING PROGRAM' )

    gl.linkProgram( shaderProgram )

    if( !gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) )
    {
      console.log( '! LINKING FAILED: '+gl.getProgramInfoLog( shaderProgram ) )

      return null
    }

    console.log( '* WORKED: ' + shaderProgram )

    return shaderProgram
  }


  function getShaderFromElement( gl, id )
  {
    console.logFunction( 'getShaderFromElement', [ gl, id ] )

    var shaderScript = document.getElementById( id )

    if( !shaderScript ) return null

    var str = "";
    var k = shaderScript.firstChild;
    while (k)
    {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment")
    {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if (shaderScript.type == "x-shader/x-vertex")
    {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else
    {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
  }




  function initShaders()
  {
    console.logFunction( 'initShaders', [] )

    vs =
      '#ifdef GL_ES\nprecision mediump float;\n#endif\n' +
      'attribute vec3 aVertexPosition; uniform float uTime; varying vec3 vPosition;' +
      'void main(void) { gl_Position = vec4(aVertexPosition, 1.0); vPosition = aVertexPosition; }'

    fs =
//      '#ifdef GL_ES\nprecision highp float;\n#endif\n' +
      document.getElementById( webgl_shaderElementName ).textContent

    shaderProgram = createShaderProgram( gl, vs, fs )
    if( ! shaderProgram )
    {
        console.log( 'Could not create shader program' );
        alert( 'Could not create shader program' );
    }

    //  Create the vertex array buffers

    gl.useProgram(shaderProgram);

    aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(aVertexPosition);
  }




  var vertexPositionBuffer

  function initBuffers()
  {
    console.logFunction( 'initBuffers', [] )

    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var vertices = [
         1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,
         1.0,  1.0, 1.0,
        -1.0,  1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numItems = 4;
  }



  //---- webgl_timer

  var webgl_statusElementName = false
  var lastTime = 0;
  var normalisedTime = 0;
  var timer_count = 0;

  function webgl_timer()
  {
    timer_count ++

    if( timer_count == 1 )
    {
      console.log( 'START OF FIRST TIMER' )
    }

    var timeNow = new Date().getTime();

    if (lastTime != 0)
    {
      var elapsed = timeNow - lastTime;

      normalisedTime += elapsed;

      if( webgl_statusElementName )
      {
        var status = document.getElementById( webgl_statusElementName )
        var fps = (1000.0 / Math.max( elapsed, 0.0001 ));
        fps = Math.floor( fps*1000 ) / 1000;
        status.innerHTML = 'FPS: ' + fps;
      }
    }

    var timeUniform = gl.getUniformLocation( shaderProgram, "uTime" )
    gl.uniform1f( timeUniform, normalisedTime / 1000.0 )

    lastTime = timeNow;

    //  Draw

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT )

    gl.bindBuffer( gl.ARRAY_BUFFER, vertexPositionBuffer )
    gl.vertexAttribPointer( aVertexPosition, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0 )

    gl.drawArrays( gl.TRIANGLE_STRIP, 0, vertexPositionBuffer.numItems )

    if( timer_count == 1 )
    {
      console.log( 'END OF FIRST TIMER' )
    }
  }



  //---- webgl_init

  function webgl_init( canvasElementName, shaderElementName, statusElementName )
  {
    console.logFunction( 'webgl_init', [ canvasElementName, shaderElementName, statusElementName ] )

    webgl_shaderElementName = shaderElementName

    if( statusElementName ) webgl_statusElementName = statusElementName

    var canvas = document.getElementById( canvasElementName );
    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clearDepth(1.0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    console.log( 'STARTING TIMER' )

    setInterval(webgl_timer, 66);
  }


  console.logFunction = function( fn_name, fn_args )
  {
    var msg = fn_name + '( '

    for( var i=0; i<fn_args.length; i++ )
    {
      if( i > 0 ) msg = msg + ', '
      msg = msg + fn_args[i]
    }

    console.log( msg )
  }