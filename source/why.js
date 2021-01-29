// Define the game space bounds
var maxWidth = 0;
var maxHeight = 0;

// Define a border of 5 pixels on edges of game space
var xBorder = 10.0;
var yBorder = xBorder*2;

// side length of a single square in the game space
var length = 0;
// number of squares in 1 row
var numSquares = 10;
// Time interval in seconds for redrawing the scene
var interval = 1;

// Define the gameSpace array and player controlled block array
var gameSpace;
var movingBlocks = [];
// Define rows to be deleted
var rowsToDelete = [];

// Variables to toggle quitting, restarting and game over
var quit = false;
var restart = false;
var gameEnd = false;

// Run main() as soon as our window loads
window.onload = main;
function main() {
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");
  if(!gl){
    // no webgl for you!
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  maxWidth = gl.canvas.clientWidth - xBorder;
  maxHeight = gl.canvas.clientHeight - yBorder;
  //console.log("maxWidth: " + maxWidth + ", maxHeight: " + maxHeight);

  // Define the side length of a single square in the game space
  // Subtract xBorder*2 to account for border
  // Divide by the number of squares in 1 row
  length = (gl.canvas.clientWidth - xBorder*2)/numSquares;
  
  var vertexShaderSource = document.querySelector("#vertex-shader-2d-matrix").text;
  var fragmentShaderSource = document.querySelector("#fragment-shader").text;

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  var shaderProgram = createProgram(gl, vertexShader, fragmentShader);

  gameSpace = makeGameSpace();
  movingBlocks = spawnBlock(gameSpace);

  // values to keep track of time passed
  var thenFall = 0;
  var thenMove = 0;
    
    // clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // initialize shader program information
    var programInfo = drawInit(gl, shaderProgram);
    // Start drawing the scene
    drawGrid(gl, programInfo);

  //console.log("This... is the end.");
}


// Draw the grid
function drawGrid(gl, programInfo) {
  resize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

// Initialize variables in the shader
function drawInit(gl, shaderProgram) {
  gl.useProgram(shaderProgram);

  // All m3 functions from m3.js, from webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
  var translationMatrix = m3.translation(0, 0);
  var rotationMatrix = m3.rotation(0);
  var moveOriginMatrix = m3.translation(0,0);

  var matrix = m3.multiply(translationMatrix, rotationMatrix);
  matrix = m3.multiply(matrix, moveOriginMatrix);

  programInfo = {
    program: shaderProgram,
    attributes: {
      position: gl.getAttribLocation(shaderProgram, 'a_position'),
      color: gl.getAttribLocation(shaderProgram, 'a_color'),
    } ,
    uniforms: {
      resolution: gl.getUniformLocation(shaderProgram, "u_resolution"),
      matrix: gl.getUniformLocation(shaderProgram, 'u_matrix')
    },
  };

  // Set the uniforms in the shaders with our variables
  gl.uniform2f(programInfo.uniforms.resolution, gl.canvas.width, gl.canvas.height);
  gl.uniformMatrix3fv(programInfo.uniforms.matrix, false, matrix);

  return programInfo;
}

// Based off https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
function resize(canvas) {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth  = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;
  
  // Check if the canvas is not the same size.
  if (canvas.width  != displayWidth ||
      canvas.height != displayHeight) {
  
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
  }
}

// Create shaders, essentially provided by webglfundamentals.org
function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }
 
  return shader;
}

// Create the program, essentially provided by webglfundamentals.org
function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Check if it linked.
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
      // something went wrong with the link
      throw ("program failed to link:" + gl.getProgramInfoLog (program));
  }
 
  return program;
}