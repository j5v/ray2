/*
Based on:
	
	WebGL Fragment Framework
	(c) Lewpen Kinross-Skeels 2011
	www.lewpen.com

This version:
	© John Valentine, 2015
	http://johnvalemtine.co.uk
	
	This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.
	http://creativecommons.org/licenses/by-sa/4.0/
	
*/
function wrapGL_anim() {
	// global function required, has scope from window object, callable via requestAnimationFrame().
	wrapGL.webgl_timer(); // this call (to an assumed instantiated object!) has the correct 'this' context. 
}

WrapGL = function () {
	
	/*	JV's wrapper for webGL, based on above-attributed source,
			Refactored in namespace object
			Allows for tidy recompilation
			Parameterized shader script
		
		usage:
			wrapGL = new WrapGL; // provided here
			wrapGL.webGL_init('canvas', 'shader', 'status'); // insert into your page
	*/
	
	this.gl                      = undefined;
	this.canvas                  = undefined;
	this.webgl_shaderElementName = undefined;
	this.shaderProgram           = undefined;
	this.fs                      = undefined; // fragment Shader
	this.vs                      = undefined; // vertex Shader
	this.aVertexPosition         = undefined;
	this.vertexPositionBuffer    = undefined;
	this.debugMode               = false;
	                             
	this.webgl_statusElementName = false;
	this.lastTime                = 0;
	this.normalisedTime          = 0;
	this.timer_count             = 0;
	this.animation               = undefined;
	this.raf                     =
			(requestAnimationFrame && window.requestAnimationFrame.bind(window))
		||	(window.msRequestAnimationFrame && window.msRequestAnimationFrame.bind(window))
		||	(window.mozRequestAnimationFrame && window.mozRequestAnimationFrame.bind(window))
		||	(window.webkitRequestAnimationFrame && window.webkitRequestAnimationFrame.bind(window));

	// debug
	
	this.log = function(msg, mode) {
		if (this.debugMode) {
			console.log(msg);
		}		
	}
	
	this.logFunction = function(fn_name, fn_args) {
		if (this.debugMode) {
			var msg = fn_name + '( ';

			for (var i = 0; i < fn_args.length; i++) {
				if (i > 0) {
					msg = msg + ', ';
				}
				msg = msg + fn_args[i];
			}

			this.log(msg);
		}
	}
	
	
	// WebGL
	
	this.initGL = function(canvas) {
		this.logFunction('initGL', [canvas])

		try {
			this.gl = canvas.getContext("experimental-webgl");
			this.gl.viewportWidth = canvas.width;
			this.gl.viewportHeight = canvas.height;
		} catch (e) {
			throw [e, "Could not initialise WebGL, sorry :-("]
		}
		if (!this.gl) {
			throw "Could not initialise WebGL, sorry :-("
		}
	}

	this.webgl_init = function(canvasElementName, shaderElementName, statusElementName) {
		
		this.logFunction('webgl_init', [canvasElementName, shaderElementName, statusElementName]);

		this.webgl_shaderElementName = shaderElementName;

		if (statusElementName)
			this.webgl_statusElementName = statusElementName;

		this.canvas = document.getElementById(canvasElementName);
		this.initGL(this.canvas);
		this.initShaders();
		this.initBuffers();

		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

		this.gl.clearDepth(1.0);

		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);

		this.log('STARTING TIMER');

		this.webgl_timer(); // draw once; it requests its own subsequent frames.
	}

	this.createShaderProgram = function(par_gl, vs_source, fs_source) {
		// todo: remove par_gl, replace with this.gl (in caller too)
		
		this.logFunction('createShaderProgram', [par_gl, vs_source, fs_source])
		this.shaderProgram = par_gl.createProgram();

		//  Create vertex shader

		this.log('* CREATING VSHADER');
		this.vs = par_gl.createShader(par_gl.VERTEX_SHADER);
		par_gl.shaderSource(this.vs, vs_source);
		par_gl.compileShader(this.vs);

		if (!par_gl.getShaderParameter(this.vs, par_gl.COMPILE_STATUS)) {
			alert("Vertex shader compilation error\n" + par_gl.getShaderInfoLog(this.vs) + "\n\n--\n" + vs_source);
			return null;
		}

		//  Create fragment shader

		this.log('* CREATING FSHADER')
		this.fs = par_gl.createShader(par_gl.FRAGMENT_SHADER);
		par_gl.shaderSource(this.fs, fs_source);
		par_gl.compileShader(this.fs);

		if (!par_gl.getShaderParameter(this.fs, par_gl.COMPILE_STATUS)) {
			alert("Fragment shader compilation error\n" + par_gl.getShaderInfoLog(this.fs) + "\n\n--\n" + fs_source);
			return null
		}

		//  Create and link program

		this.log('* ATTACHING VSHADER');
		par_gl.attachShader(this.shaderProgram, this.vs);

		this.log('* ATTACHING FSHADER');
		par_gl.attachShader(this.shaderProgram, this.fs);

		this.log('* LINKING PROGRAM');
		par_gl.linkProgram(this.shaderProgram);

		if (!par_gl.getProgramParameter(this.shaderProgram, par_gl.LINK_STATUS)) {
			this.log('! LINKING FAILED: ' + par_gl.getProgramInfoLog(this.shaderProgram));
			return null;
		}

		this.log('* WORKED: ' + this.shaderProgram);
		
		return this.shaderProgram;
	}	
	
	this.getShaderFromElement = function (gl, id) {
		// todo: remove gl, replace with this.gl (in caller too)
		// todo: check whether this is used
		this.logFunction('getShaderFromElement', [gl, id]);

		var shaderScript = document.getElementById(id);

		if (!shaderScript)
			return null;

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3)
				str += k.textContent;
			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		} else {
			return null;
		}

		this.gl.shaderSource(shader, str);
		this.gl.compileShader(shader);

		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			alert(this.gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}
	
	this.initShaders = function() {
		this.logFunction('initShaders', [])

		this.vs =
			'#ifdef GL_ES\nprecision mediump float;\n#endif\n' +
			'attribute vec3 aVertexPosition; uniform float uTime; varying vec3 vPosition;' +
			'void main(void) { gl_Position = vec4(aVertexPosition, 1.0); vPosition = aVertexPosition; }'

		this.fs = document.getElementById(this.webgl_shaderElementName).textContent

		this.shaderProgram = this.createShaderProgram(this.gl, this.vs, this.fs)
		if (!this.shaderProgram) {
			this.log('Could not create shader program');
			alert('Could not create shader program');
		}

		//  Create the vertex array buffers

		this.gl.useProgram(this.shaderProgram);

		this.aVertexPosition = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
		this.gl.enableVertexAttribArray(this.aVertexPosition);
	}
	
	this.initBuffers = function() {
		this.logFunction('initBuffers', [])

		this.vertexPositionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		var vertices = [
			1.0, -1.0, 1.0,
			-1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0,
		];
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.vertexPositionBuffer.itemSize = 3;
		this.vertexPositionBuffer.numItems = 4;
	}
	
	this.webgl_timer = function() {
		// todo: change to use the browser's 'game loop' timers (requestAnimationFrame).
		this.timer_count++;
		var fps = 0;
		var elapsed = 1.0;
		var timeBeforeDraw = new Date().getTime();

		if (this.lastTime != 0) {
			elapsed = timeBeforeDraw - this.lastTime;
		}
		
		if (this.lastTime != 0) {
			this.normalisedTime += elapsed;
			fps = Math.floor(1000.0 / Math.max(elapsed, 0.0001));
		}
		
		var timeUniform = this.gl.getUniformLocation(this.shaderProgram, "uTime");
		this.gl.uniform1f(timeUniform, this.normalisedTime / 1000.0);

		this.lastTime = timeBeforeDraw;

		//  Draw

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
		this.gl.vertexAttribPointer(this.aVertexPosition, this.vertexPositionBuffer.itemSize,this. gl.FLOAT, false, 0, 0);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexPositionBuffer.numItems);
		
		// display timing info
		if (this.webgl_statusElementName) {
			var status = document.getElementById(this.webgl_statusElementName);
			status.innerHTML = 'FPS: ' + fps;
		}

		requestAnimationFrame(wrapGL_anim);
		
	}
	
	this.deleteShaderProgram = function() {
		// todo, for re-compiling shaders.
		this.log('* DELETING SHADERS')
		if (this.shaderProgram != undefined) {
			this.gl.detachShader(this.vs); // JV +
			this.gl.deleteShader(this.vs); // JV +

			this.gl.detachShader(this.fs); // JV +
			this.gl.deleteShader(this.fs); // JV +
			
			this.gl.deleteShaderProgam(this.shaderProgram);
		}

	}	
	
}

wrapGL = new WrapGL;

