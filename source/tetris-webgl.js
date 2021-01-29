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

  function drawScene(now) {
    if(quit) {
      // clear the canvas
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      //thenFall = 0;
      //thenMove = 0;
      now = 0;

      return;
    }

    if(restart) {
      // clear the canvas
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      thenFall = 0;
      thenMove = 0;
      now = 0;

      gameSpace = makeGameSpace();
      movingBlocks = spawnBlock(gameSpace);

      restart = false;
      //requestAnimationFrame(drawScene);
      //return;
    }

    // If no blocks were spawned, aka no more space, end game
    if(gameEnd) {
      now = 0;
      document.querySelector("#gameend").style.display='block';
      return;
    }
    
    // If 's' or 'ArrowDown' are being pressed, update falling more often
    interval = controls["s"] || controls["ArrowDown"] ? 0.05 : 1;

    // take current time, convert to seconds
    now *= 0.001;

    // Update left and right movement every 0.05 seconds
    if(now - thenMove >= 0.05) {
      if(controls["a"] || controls["ArrowLeft"]) {
        if(collisionCheck(movingBlocks, gameSpace, 'l')) {
          updateGameSpace(movingBlocks, gameSpace, 'l');
        }
      }
      if(controls["d"] || controls["ArrowRight"]) {
        if(collisionCheck(movingBlocks, gameSpace, 'r')) {
          updateGameSpace(movingBlocks, gameSpace, 'r');
        }
      }
      
      thenMove = now;
    }

    // Update falling every interval
    if(now - thenFall >= interval) {
      // Check for falling type collision
      if(collisionCheck(movingBlocks, gameSpace, 'd')) {
        // Moving the player block down 
        updateGameSpace(movingBlocks, gameSpace, 'd');
      }
      else {
        // Convert player block to non-moving block
        stopMoving(movingBlocks, gameSpace);
        // Check and delete any full rows
        rowsToDelete = checkForLines(gameSpace);
        /*for(i=0; i<rowsToDelete.length; ++i) {
          console.log(rowsToDelete[i]);
        }*/
        deleteLines(rowsToDelete, gameSpace);
        moveLines(rowsToDelete, gameSpace);
        //Spawn a new block
        movingBlocks = spawnBlock(gameSpace);
      }
      
      thenFall = now;
    }
    
    // clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // initialize shader program information
    var programInfo = drawInit(gl, shaderProgram);
    // Start drawing the scene
    drawGrid(gl, programInfo);
    drawBlocks(gl, programInfo, gameSpace);
    //drawGrid(gl, programInfo);

    requestAnimationFrame(drawScene);
  }

  // Add the event listener to start taking input
  keyEventListener();

  requestAnimationFrame(drawScene);

  //console.log("This... is the end.");
}


// Draw the grid
function drawGrid(gl, programInfo) {
  resize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  //gl.useProgram(program);

  var gridData = getGridData();

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridData.gridLines), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var psize = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(programInfo.attributes.position, psize, type, normalize, stride, offset);
  gl.enableVertexAttribArray(programInfo.attributes.position);
  
  // Insert data into our color buffer
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridData.gridColors), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var csize = 4;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(programInfo.attributes.color, csize, type, normalize, stride, offset);
  gl.enableVertexAttribArray(programInfo.attributes.color);
  
  // Draw the grid
  var primitiveType = gl.LINES
  var offset = 0;
  var count = gridData.gridLines.length/psize;
  gl.drawArrays(primitiveType, offset, count);
}


// Draw our blocks
function drawBlocks(gl, programInfo, gameSpace) {
  resize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  //gl.useProgram(program);

  // Obtain the position and color data for all blocks
  var blockData = getBlockData(gameSpace);
  //console.log(blockData.points.length);
  //console.log(blockData.count);

  // insert data into our position buffer
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blockData.points), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var psize = 2;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(programInfo.attributes.position, psize, type, normalize, stride, offset);
  gl.enableVertexAttribArray(programInfo.attributes.position);

  // Insert data into our color buffer
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blockData.colors), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  var csize = 4;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(programInfo.attributes.color, csize, type, normalize, stride, offset);
  gl.enableVertexAttribArray(programInfo.attributes.color);

  // Draw the non-moving blocks
  var primitiveType = gl.TRIANGLES
  var offset = 0;
  var count = (blockData.points.length - blockData.count)/psize;
  gl.drawArrays(primitiveType, offset, count);

  // Draw the moving blocks
  // offset -> how many triangles already drawn
  offset = count;
  count = blockData.count/psize;
  gl.drawArrays(primitiveType, offset, count);

  
  // insert data into our position buffer
  var gridPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gridPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blockData.gridPoints), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var psize = 2;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(programInfo.attributes.position, psize, type, normalize, stride, offset);
  gl.enableVertexAttribArray(programInfo.attributes.position);

  // Insert data into our color buffer
  var gridColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gridColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blockData.gridColors), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  var csize = 4;
  var type = gl.FLOAT;
  var normalize = false;
  var stride = 0;
  var offset = 0;
  gl.vertexAttribPointer(programInfo.attributes.color, csize, type, normalize, stride, offset);
  gl.enableVertexAttribArray(programInfo.attributes.color);

  //console.log(blockData.gridPoints.length);
  var primitiveType = gl.LINE_LOOP;
  var offset = 0;
  var count = 4;
  gl.drawArrays(primitiveType, offset, count);
  var size = (blockData.gridPoints.length - count*psize) / psize;
  for(i=0; i<size; i+=4) {
    offset += count;
    gl.drawArrays(primitiveType, offset, count);
  }
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


// Generate data for our Blocks in the gameSpace
function getBlockData(gameSpace) {
  // position and colors for non-moving blocks
  // grid lines to draw over blocks
  var points = [];
  var colors = [];
  var gridPoints = [];
  var gridColors = [];

  // position and colors for moving blocks
  var mPoints = [];
  var mColors = [];
  var mGridPoints = [];
  var mGridColors = [];
  var count = 0;

  var xMin = xBorder;
  var yMin = xMin * 2;

  //console.log(gameSpace.length);
  //console.log(gameSpace[0].length);
  //var i = 0;
  //var j = 0; 

  var topL = [];
  var topR = [];
  var botL = [];
  var botR = [];
  var color = [];
  var gridColor = [0.12, 0.12, 0.12, 1];

  for(i=0; i<gameSpace.length; ++i) {
    for(j=0; j<gameSpace[0].length; ++j) {
      // Check if a Block exists in this square

      topL = [xMin+length*j, yMin+length*i];
      topR = [xMin+length*j, yMin+length*(i+1)];
      botL = [xMin+length*(j+1), yMin+length*i];
      botR = [xMin+length*(j+1), yMin+length*(i+1)];
      color = gameSpace[i][j].color;

      switch(gameSpace[i][j].state){
        case 0: break;
        case 2:
          // Insert position data
          points = points.concat(topL);
          points = points.concat(topR);
          points = points.concat(botL);
          points = points.concat(topR);
          points = points.concat(botL);
          points = points.concat(botR);

          // Insert color data: 6 total, 1 for each vertex
          //var color = [Math.random(), Math.random(), Math.random(), 1];
          colors = colors.concat(color).concat(color).concat(color);
          colors = colors.concat(color).concat(color).concat(color);

          // Insert data for the gridlines of this square
          gridPoints = gridPoints.concat(topL);
          gridPoints = gridPoints.concat(topR);
          gridPoints = gridPoints.concat(botR);
          gridPoints = gridPoints.concat(botL);
          //gridPoints = gridPoints.concat(topL);

          gridColors = gridColors.concat(gridColor).concat(gridColor);
          gridColors = gridColors.concat(gridColor).concat(gridColor);

          break;

        case 1:
          count += 12;
          mPoints = mPoints.concat(topL);
          mPoints = mPoints.concat(topR);
          mPoints = mPoints.concat(botL);
          mPoints = mPoints.concat(topR);
          mPoints = mPoints.concat(botL);
          mPoints = mPoints.concat(botR);

          mColors = mColors.concat(color).concat(color).concat(color);
          mColors = mColors.concat(color).concat(color).concat(color);

          mGridPoints = mGridPoints.concat(topL);
          mGridPoints = mGridPoints.concat(topR);
          mGridPoints = mGridPoints.concat(botR);
          mGridPoints = mGridPoints.concat(botL);
          //mGridPoints = mGridPoints.concat(topL);

          mGridColors = mGridColors.concat(gridColor).concat(gridColor);
          mGridColors = mGridColors.concat(gridColor).concat(gridColor);

          break;
        default: alert("Error: Undefined state occurred");
      }
    }
  }

  points = points.concat(mPoints);
  colors = colors.concat(mColors);
  gridPoints = gridPoints.concat(mGridPoints);
  gridColors = gridColors.concat(mGridColors);

  return {
    points,
    colors,
    gridPoints,
    gridColors,
    count,
  }
}


// generate data for our grid
function getGridData() {
  xMin = xBorder;
  yMin = yBorder;

  xMax = maxWidth;
  yMax = maxHeight;

  // Define grid lines
  const gridLines = [
    xMin, yMin,     // Left border
    xMin, yMax,
    xMax, yMin,     // Right border
    xMax, yMax,

    xMin, yMin,     // Top border
    xMax, yMin,
    xMin, yMax,     // Bottom border
    xMax, yMax,
    
    xMin+length*1, yMin,  // Vertical grid lines
    xMin+length*1, yMax,
    xMin+length*2, yMin,
    xMin+length*2, yMax,
    xMin+length*3, yMin,
    xMin+length*3, yMax,
    xMin+length*4, yMin,
    xMin+length*4, yMax,
    xMin+length*5, yMin,
    xMin+length*5, yMax,
    xMin+length*6, yMin,
    xMin+length*6, yMax,
    xMin+length*7, yMin,
    xMin+length*7, yMax,
    xMin+length*8, yMin,
    xMin+length*8, yMax,
    xMin+length*9, yMin,
    xMin+length*9, yMax,

    xMin, yMin+length*1,  // Top half Horizontal grid lines
    xMax, yMin+length*1,
    xMin, yMin+length*2,
    xMax, yMin+length*2,
    xMin, yMin+length*3,
    xMax, yMin+length*3,
    xMin, yMin+length*4,
    xMax, yMin+length*4,
    xMin, yMin+length*5,
    xMax, yMin+length*5,
    xMin, yMin+length*6,
    xMax, yMin+length*6,
    xMin, yMin+length*7,
    xMax, yMin+length*7,
    xMin, yMin+length*8,
    xMax, yMin+length*8,
    xMin, yMin+length*9,
    xMax, yMin+length*9,

    xMin, yMin+length*10, // Middle line
    xMax, yMin+length*10,

    xMin, yMax-length*1,  // Bottom half Horizontal grid lines
    xMax, yMax-length*1,
    xMin, yMax-length*2,
    xMax, yMax-length*2,
    xMin, yMax-length*3,
    xMax, yMax-length*3,
    xMin, yMax-length*4,
    xMax, yMax-length*4,
    xMin, yMax-length*5,
    xMax, yMax-length*5,
    xMin, yMax-length*6,
    xMax, yMax-length*6,
    xMin, yMax-length*7,
    xMax, yMax-length*7,
    xMin, yMax-length*8,
    xMax, yMax-length*8,
    xMin, yMax-length*9,
    xMax, yMax-length*9,
  ];

  // Insert grid color data, 1 for every 2 vertices
  var gridColors = [];
  var size = gridLines.length/2;
  for(i=0; i<size; ++i) {
    gridColors = gridColors.concat([0.15, 0.15, 0.1, 1]);
  }

  return {
    gridLines,
    gridColors,
  }
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