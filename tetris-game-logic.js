var controls = [];
var heldDown = false;

function keyEventListener() {
  document.addEventListener('keydown', function (e) {
    //console.log("keypress event: " + e.key);
    controls[e.key] = e.type == 'keydown';
    //console.log(e.key);
    //console.log(controls[e.key]);

    // Attempt to rotate the block if any of these keys are pressed
    if(controls["w"] || controls["z"] || controls["ArrowUp"]) {
      if(heldDown) { return; }
      heldDown = true;
      if(rotationCollisionCheck(movingBlocks, gameSpace)) {
        rotationUpdateGameSpace(movingBlocks, gameSpace);
      }
    }

    if(controls["q"]) {
      if(heldDown) { return; }
      heldDown = true;

      quit = !quit;
      if(!quit) {
        main();
      }
    }

    if(controls["r"]) {
      if(heldDown) { return; }
      heldDown = true;
      
      restart = true;
      if(gameEnd) {
        gameEnd = false;
        document.querySelector("#gameend").style.display='none';
        main();
      }
      //quit = !quit;
    }
  });

  document.addEventListener('keyup', function (e) {
    //console.log("keypress event: " + e.key);
    controls[e.key] = e.type == 'keydown';
    //console.log(e.key);
    //console.log(controls[e.key]);
    heldDown = false;
    
  });
}

function makeGameSpace() {
  var rowNum = 20;
  var colNum = 10;
  var gameSpace = new Array(rowNum);

  for(j=0; j<rowNum; ++j){
      var row = new Array(colNum);
      for(i=0; i<colNum; ++i) {
          //row[i] = Math.floor(Math.random() * 2);
          //row[i] = 0;
          var color = [1, 1, 1, 0];
          row[i] = new Tile(0,color,0,0,0);
      }
      gameSpace[j] = row;
  }
  
  //gameSpace[0][4].toggleActive();
  //gameSpace[0][4].color = [Math.random(), Math.random(), Math.random(), 1];

  /*for(i=0; i<gameSpace.length; ++i) {
      for(j=0; j<gameSpace[0].length; ++j) {
          console.log("x= " + i + ", y= " + j + ": " + gameSpace[i][j]);
      }
  }*/

  return gameSpace;
}

function spawnBlock(gameSpace) {
  var rand = Math.floor(Math.random() * 7);
  // Spawn coordinates
  var row = 0;
  var col = 5;

  if(gameSpace[row][col].state == 2) {
    console.log("GAME OVER");
    gameEnd = true;
    return;
  }

  
  // Default color
  var color = [1, 1, 1, 1];
  // Initial block coordinates, 8 values for 4 blocks
  var coords = new Array(8);
  // Block rotational offsets
  var rOffsets = new Array(8);
  // Block rotation type
  var rType;

  //rand = 1;
  // Pick the block type, color, and set initial coords and rotational offsets
  switch(rand){
    case 0: color = [0.98, 0.95, 0.04, 1]; makeOBlock(row,col,coords,rOffsets); rType = 0; break;
    case 1: color = [0.1,  1,    0.9,  1]; makeIBlock(row,col,coords,rOffsets); rType = 1; break;
    case 2: color = [0.3,  1,    0.2,  1]; makeSBlock(row,col,coords,rOffsets); rType = 1; break;
    case 3: color = [1,    0.15, 0.3,  1]; makeZBlock(row,col,coords,rOffsets); rType = 1; break;
    case 4: color = [0.98, 0.6,  0.09, 1]; makeLBlock(row,col,coords,rOffsets); rType = 2; break;
    case 5: color = [0,    0.0,  0.8,  1]; makeJBlock(row,col,coords,rOffsets); rType = 2; break;
    case 6: color = [0.62, 0.09, 0.85, 1]; makeTBlock(row,col,coords,rOffsets); rType = 2; break;
    default: alert("Error: undefined block type"); return;
  }
  
  // Apply the starting positions, colors, and rotational offsets
  for(i=0; i<coords.length; i+=2) {
    var row = coords[i];
    var col = coords[i+1];

    gameSpace[row][col].state = 1;
    gameSpace[row][col].color = color;
    gameSpace[row][col].rowRotateOffset = rOffsets[i];
    gameSpace[row][col].colRotateOffset = rOffsets[i+1];
    gameSpace[row][col].rotationType = rType;
  }

  //console.log(rType);

  return coords;
}

// Check for falling and left-right collisions
function collisionCheck(movingBlocks, gameSpace, direction) {
  var rowOffset = 0;
  var colOffset = 0;

  // Determine relevant direction
  //    'd' for down
  //    'l' for left
  //    'r' for right
  switch(direction) {
    case 'd': //console.log("Downward collision check"); 
      rowOffset =  1; break;
    case 'l': //console.log("Leftward collision check");
      colOffset = -1; break;
    case 'r': //console.log("Rightward collision check"); 
      colOffset =  1; break;
  }

  // Check for collisions
  for(i=0; i<movingBlocks.length; i += 2) {
    // get coordinates for current player block
    var row = movingBlocks[i];
    var col = movingBlocks[i+1];
    // New row and col position from offsets
    var nextRow = row + rowOffset;
    var nextCol = col + colOffset;

    // First 3 are out-of-bounds checks: 
    //    floor -> right side -> left side
    // last is block collision
    //    state != 2 means either no block or player block, movement is okay
    //    else, space is occupied by non-moving block
    if( (nextRow > gameSpace.length-1)    || 
        (nextCol > gameSpace[0].length-1) || 
        (nextCol < 0)                     ||
        (gameSpace[nextRow][nextCol].state == 2) ) 
    {
      //console.log("row: " + row + ", col: " + col + " cannot move, obstructed");
      return false;
    }
    //console.log("row: " + row + ", col: " + col + " can move");
  }

  // No collisions, return true
  return true;
}

function updateGameSpace(movingBlocks, gameSpace, direction) {
  var rowOffset = 0;
  var colOffset = 0;
  var rOffsets = new Array(8);

  // Determine relevant direction
  //    'd' for down
  //    'l' for left
  //    'r' for right
  switch(direction) {
    case 'd': //console.log("Downward update"); 
      rowOffset =  1; break;
    case 'l': //console.log("Leftward update");
      colOffset = -1; break;
    case 'r': //console.log("Rightward update"); 
      colOffset =  1; break;
  }

  // Deactivate old blocks
  for(i=0; i<movingBlocks.length; i += 2) {
    var row = movingBlocks[i];
    var col = movingBlocks[i+1];

    gameSpace[row][col].state = 0;
    rOffsets[i] = gameSpace[row][col].rowRotateOffset;
    rOffsets[i+1] = gameSpace[row][col].colRotateOffset
    gameSpace[row][col].rowRotateOffset = 0;
    gameSpace[row][col].colRotateOffset = 0;

  }
  // Activate new blocks
  for(i=0; i<movingBlocks.length; i += 2) {
    row = movingBlocks[i];
    col = movingBlocks[i+1];
    var nextRow = row + rowOffset;
    var nextCol = col + colOffset;

    // update new block's values
    gameSpace[nextRow][nextCol].state = 1;
    gameSpace[nextRow][nextCol].color = gameSpace[row][col].color;
    gameSpace[nextRow][nextCol].rowRotateOffset = rOffsets[i];
    gameSpace[nextRow][nextCol].colRotateOffset = rOffsets[i+1];
    gameSpace[nextRow][nextCol].rotationType = gameSpace[row][col].rotationType;
    
    movingBlocks[i]   = nextRow;
    movingBlocks[i+1] = nextCol;
  }
}

function stopMoving(movingBlocks, gameSpace) {
  for(i=0; i<movingBlocks.length; i += 2) {
    var row = movingBlocks[i];
    var col = movingBlocks[i+1];

    gameSpace[row][col].state = 2;
  }
}

function rotationCollisionCheck(movingBlocks, gameSpace) {
  for(i=0; i<movingBlocks.length; i+=2) {
    // get coordinates for current player block
    var row = movingBlocks[i];
    var col = movingBlocks[i+1];
    // Amount of rows and cols to move
    var rowRotateOffset = gameSpace[row][col].rowRotateOffset;
    var colRotateOffset = gameSpace[row][col].colRotateOffset;
    // New row and col position from offsets
    var nextRow = row + rowRotateOffset;
    var nextCol = col + colRotateOffset;

    // First 4 are out-of-bounds checks
    //    floor -> ceiling -> right side -> left side
    // last is block collision
    if( (nextRow > gameSpace.length-1)    ||
        (nextRow < 0)                     ||
        (nextCol > gameSpace[0].length-1) ||
        (nextCol < 0)                     ||
        (gameSpace[nextRow][nextCol].state == 2) ) 
      {
        //console.log("row:" + row + " col:" + col + " cannot rotate, obstructed");
        return false;
      }
      //console.log("row:" + row + " col:" + col + " can rotate");
      //console.log("row:" + nextRow + " col:" + nextCol+ " is new position");
  }

  // No collisions, return true
  return true;

}

function rotationUpdateGameSpace(movingBlocks, gameSpace) {
  // Array for rotational offsets for each block
  var rOffsets = new Array(8);
  // Rotation Type
  var rType = 0;

  // Deactivate old blocks
  for(i=0; i<movingBlocks.length; i += 2) {
    var row = movingBlocks[i];
    var col = movingBlocks[i+1];
    rType = gameSpace[row][col].rotationType;
    // If this block doesn't rotate, return and do nothing
    if(rType == 0) { return; }

    gameSpace[row][col].state = 0;

    // Store the offsets
    rOffsets[i]   = gameSpace[row][col].rowRotateOffset;
    rOffsets[i+1] = gameSpace[row][col].colRotateOffset;

    //rOffsetsNext[i] = rOffsets[i+1];
    //rOffsetsNext[i+1] = rOffsets[i];
    //console.log(rOffsets[i] + rOffsets[i+1]);
  }

  // Activate new blocks
  for(i=0; i<movingBlocks.length; i += 2) {
    row = movingBlocks[i];
    col = movingBlocks[i+1];

    var rowRotateOffset = rOffsets[i];
    var colRotateOffset = rOffsets[i+1];

    var nextRow = row + rowRotateOffset;
    var nextCol = col + colRotateOffset;

    // update new block's values
    gameSpace[nextRow][nextCol].state = 1;
    gameSpace[nextRow][nextCol].color = gameSpace[row][col].color;

    if(rType == 2) {
      gameSpace[nextRow][nextCol].rowRotateOffset = -rOffsets[i+1];
      gameSpace[nextRow][nextCol].colRotateOffset = rOffsets[i];
    }
    else {
      gameSpace[nextRow][nextCol].rowRotateOffset = -rOffsets[i];
      gameSpace[nextRow][nextCol].colRotateOffset = -rOffsets[i+1];
    }

    gameSpace[nextRow][nextCol].rotationType = gameSpace[row][col].rotationType;
    
    movingBlocks[i]   = nextRow;
    movingBlocks[i+1] = nextCol;
  }
}

function checkForLines(gameSpace) {
  // At most, 4 rows can be deleted using a Line Block
  var size = 4;
  var rowsToDelete = [];
  //console.log("checking for lines");

  for(i=gameSpace.length-1; i >= 0; --i) {
    var count = 0;
    for(j=gameSpace[0].length-1; j >= 0; --j) {
      //console.log(gameSpace[i][j].state);
      if(gameSpace[i][j].state == 2) {
        ++count;
      }
    }

    // console.log(count);

    // If we have 0 blocks in a row, no line and no possible lines above, break
    if(count == 0) {
      break;
    }
    // If we have 10 blocks in a row, delete that row
    else if(count == gameSpace[0].length) {
      rowsToDelete.push(i);
    }
    // if we have 4 lines, no more possible deletes, break
    if(rowsToDelete.length == size) {
      break;
    }
  }

  /*for(i=0; i < rowsToDelete.length; ++i) {
    console.log("rows to delete:" + rowsToDelete[i]);
  }*/

  return rowsToDelete;
}

function deleteLines(rowsToDelete, gameSpace) {
  if(rowsToDelete == undefined) {
    return;
  }
  //console.log("deleting lines");
  for(i=0; i<rowsToDelete.length; ++i) {
    var row = rowsToDelete[i];
    //console.log("Deleting row:" + row);
    // Set state to 0, no-block state
    for(col=0; col<gameSpace[0].length; ++col) {
      //console.log("row:" + row + " col:" + col + " will be deleted");
      gameSpace[row][col].state = 0;
    }
  }
}

function moveLines(rowsToDelete, gameSpace) {
  if(rowsToDelete == undefined) {
    return;
  }
  //console.log("moving lines");

  // Move blocks down between recently deleted and next-to-be deleted rows
  var botRow = rowsToDelete[0];
  for(k=0; k<rowsToDelete.length; ++k) {
    //console.log(botRow);
    for(i=rowsToDelete[0]; i>=0; --i) {
      var count = 0;
      for(j=0; j<gameSpace[0].length; ++j) {
        //console.log("row:" + i + " col:" + j + " will be moved");
        if(gameSpace[i][j].state == 2) {
          gameSpace[i+1][j].state = gameSpace[i][j].state;
          gameSpace[i+1][j].color = gameSpace[i][j].color;
          gameSpace[i][j].state = 0;
        }
      }
      //gameSpace[i+1] = gameSpace[i];
    }
  }
}


// Make#Block functions
function makeOBlock(row, col, coords, rOffsets) {
  //console.log("spawn Square Block");

  // Setting initial positions for each block
  //  coords[0] and coords[1] are always for the pivot, except for O Block
  //  the pivot always spawns at the spawn coordinates
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col-1;
  coords[4] = row+1;
  coords[5] = col-1;
  coords[6] = row+1;
  coords[7] = col;

  // Setting rotational offsets, num of rows and cols to move
  //   on a rotation action
  // even indices are rows, odds are cols

  /*rOffsets[0] =  1;
  rOffsets[1] =  0;
  rOffsets[2] =  0;
  rOffsets[3] =  0;
  rOffsets[4] =  0;
  rOffsets[5] =  0;
  rOffsets[6] =  0;
  rOffsets[7] =  0;*/

  rOffsets[0] =  0;
  rOffsets[1] = -1;
  rOffsets[2] =  1;
  rOffsets[3] =  0;
  rOffsets[4] =  0;
  rOffsets[5] =  1;
  rOffsets[6] = -1;
  rOffsets[7] =  0;

  return coords;
}


function makeIBlock(row, col, coords, rOffsets) {
  //console.log("spawn Line Block"); 
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col+1;
  coords[4] = row;
  coords[5] = col-1;
  coords[6] = row;
  coords[7] = col-2;

  rOffsets[0] =  0;
  rOffsets[1] =  0;
  rOffsets[2] = -1;
  rOffsets[3] = -1;
  rOffsets[4] =  1;
  rOffsets[5] =  1;
  rOffsets[6] =  2;
  rOffsets[7] =  2;
  
  return coords;
}

function makeSBlock(row, col, coords, rOffsets) {
  //console.log("spawn S Block");  
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col+1;
  coords[4] = row+1;
  coords[5] = col-1;
  coords[6] = row+1;
  coords[7] = col;

  rOffsets[0] =  0;
  rOffsets[1] =  0;
  rOffsets[2] = -1;
  rOffsets[3] = -1;
  rOffsets[4] =  0;
  rOffsets[5] =  2;
  rOffsets[6] = -1;
  rOffsets[7] =  1;
  
  return coords;
}

function makeZBlock(row, col, coords, rOffsets) {
  //console.log("spawn Z Block");  
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col-1;
  coords[4] = row+1;
  coords[5] = col;
  coords[6] = row+1;
  coords[7] = col+1;

  rOffsets[0] =  0;
  rOffsets[1] =  0;
  rOffsets[2] =  1;
  rOffsets[3] =  1;
  rOffsets[4] = -1;
  rOffsets[5] =  1;
  rOffsets[6] = -2;
  rOffsets[7] =  0;
  
  return coords;
}

function makeLBlock(row, col, coords, rOffsets) {
  //console.log("spawn L Block");  
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col-1;
  coords[4] = row+1;
  coords[5] = col-1;
  coords[6] = row;
  coords[7] = col+1;

  rOffsets[0] =  0;
  rOffsets[1] =  0;
  rOffsets[2] =  1;
  rOffsets[3] =  1;
  rOffsets[4] =  0;
  rOffsets[5] =  2;
  rOffsets[6] = -1;
  rOffsets[7] = -1;
  
  return coords;
}

function makeJBlock(row, col, coords, rOffsets) {
  //console.log("spawn J Block");  
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col-1;
  coords[4] = row;
  coords[5] = col+1;
  coords[6] = row+1;
  coords[7] = col+1;

  rOffsets[0] =  0;
  rOffsets[1] =  0;
  rOffsets[2] =  1;
  rOffsets[3] =  1;
  rOffsets[4] = -1;
  rOffsets[5] = -1;
  rOffsets[6] = -2;
  rOffsets[7] =  0;

  return coords;
}

function makeTBlock(row, col, coords, rOffsets) {
  //console.log("spawn T Block");  
  coords[0] = row;
  coords[1] = col;
  coords[2] = row;
  coords[3] = col-1;
  coords[4] = row;
  coords[5] = col+1;
  coords[6] = row+1;
  coords[7] = col;

  rOffsets[0] =  0;
  rOffsets[1] =  0;
  rOffsets[2] =  1;
  rOffsets[3] =  1;
  rOffsets[4] = -1;
  rOffsets[5] = -1;
  rOffsets[6] = -1;
  rOffsets[7] =  1;
  
  return coords;
}