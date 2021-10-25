// Similar to a few other match-3 games. (Pokemon Puzzle League / Tetris Attack) But simple.
// Uses Raphael.js for SVG graphics
// See also: https://github.com/panel-attack/panel-attack
console.log('reset..')
dec = {} //catcher object for this game (to prevent lots of global vars) .
dec.mode = 'game'

W = 600 // width
H = 800 // height
p = new Raphael("raphCon", W, H)

//bg = p.rect(0,0, W, H).attr({'fill':'#111111'})
bg = p.image('images/background_final.jpg',0,0,W/2+50,750)

b_size = 50; //block size

rip = 'images/' // rune image path base
rune_image_paths = {
  'red' : rip + 'red rune.jpg',
  'yellow' : rip + 'yellow rune.jpg',
  'green' : rip + 'green rune.jpg',
  'blue' : rip + 'blue rune.jpg',
  'purple' : rip + 'purple rune.jpg',
}

// test for image load:
// rune_images = {
//   "red": p.image(rune_image_paths['red'], 5, 5, b_size, b_size)
// }

// bucket = p.path("M0,0 L10, 10").attr({'stroke':'white'})

// Bucket is 12 blocks high by 6 wide usually
// Plus one row of upcoming blocks (maybe two with special effects?)
bucket_width = 6   //in blocks
bucket_height = 12
pre_height = 2

dec.DEBUG = true;

dec.COLORS = ['red', '#dddd00','#22ff22','#0099ff','#ff33ff']
dec.COLOR_NAMES = ['red', 'yellow', 'green', 'blue', 'purple']
dec.NUM_COLORS = 5 // How many colors to choose from
//                yellow     green    blue       purple

MARGIN = 25
// bucket = p.rect(MARGIN, MARGIN, bucket_width*b_size,
//                bucket_height*b_size).attr({'fill':'#222222'})

dec.G = .00001 // gravity factor

// grid holds the numbers of the colors of the blocks:
dec.grid = [[-1, -1, -1, -1, -1, -1], //bottom row (yes it's upside-down)
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1]];
// -1 for no block, 0 for red, 1 yellow, 2 green, 3 blue, 4 purple
// dec.grid[row][column] is syntax

function getColorFromNumber(number){
  var color = ''
  switch(number){
    case -1:
      color = 'n'
      break;
    case 0:
      color = 'red'
      break;
    case 1:
      color = 'yel'
      break;
    case 2:
      color = 'grn'
      break;
    case 3:
      color = 'blu'
      break;
    case 4:
      color = 'pur'
      break;
    default:
      console.log('unexpected case in getColorFromNumber function');
      break;
  }
  return color;
}

// More general syntax that allows bucket dimensions to be changed quickly above (not tested):
// dec.grid = []
// for(var rowNum = 0; rowNum < bucket_height; rowNum++){
//   for(var colNum =0; colNum < bucket_width; colNum++){
//     var newRow = []
//     newRow.push(-1)
//   }
//   dec.grid.push(newRow)
// }

// blockGrid holds the actual references to the blocks.
dec.blockGrid =[ [undefined, undefined, undefined, undefined, undefined, undefined], //bottom row (yes it's upside-down)
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined],
                [undefined, undefined, undefined, undefined, undefined, undefined]]

dec.preGrid = [ [-1, -1, -1, -1, -1, -1], //bottom row (yes it's visually upside-down here)
                [-1, -1, -1, -1, -1, -1]] //

dec.preBlockGrid =[ [undefined, undefined, undefined, undefined, undefined, undefined], //bottom row (yes it's upside-down)
                    [undefined, undefined, undefined, undefined, undefined, undefined]]

function randInt(ceil){ //returns random int from 0 to ceil-1
  return Math.floor(Math.random() * Math.floor(ceil))
}

function makeBlocks(){
  var color, colorNum, newBlock;
  var column_pops = [] //populations (# of blocks in each column)
  var columns = [] // An array of Raphael sets. NOT REALLY IMPLEMENTED.
               // To implement would need to add logic to swapBlocks, clearBlocks, and raiseGrid.
  const DEBUG = false;

  for (var i=0; i<bucket_width; i++){columns[i] = p.set()}

  // Fill each column of the main grid with a random number of blocks (less than 9),
  // and fill the pre.
  for (var i=0; i<bucket_width; i++){ //column  loop
    column_pops[i] = randInt(9); //find how many blocks to create in each column.
    DEBUG? console.log('Making column '+i) : null;

    for (var j=0; j<column_pops[i]; j++){ //row loop  (Main grid)
      DEBUG? console.log("Making row " + j +" in column " + i) : null;
      //newBlock = p.rect(MARGIN + i*b_size, MARGIN + (11-j)*b_size, b_size, b_size)

      // Pick a new color if this would make a cluster.
      // TODO: FIND A WAY TO CHECK BOTH ROWS AND COLUMNS. nested while?
      var colCheck = false;
      var rowCheck = false;
      var whileCount = 0;
      while(!(colCheck && rowCheck)){
        colorNum = randInt(dec.NUM_COLORS); //Pick a color for the new block
        //if (whileCount > 10) {break;} // For debugging
        //whileCount++; // For debugging
        DEBUG ? console.log('while') : null ;
        cc: { //check blocks below it
          var colCheck = false;
          if (j<2) {colCheck =true; break cc;} //skip first two rows
          for(var k=1; k<3; k++){ //Check near the new block for two matching blocks
            if (dec.grid[j-k][i]!==colorNum) { //check below:
              colCheck=true;
              break cc; //break out of column check
            } //end if
          } //end row while
        } //end column check
        DEBUG? console.log('cc: ' + colCheck) : null;

        rc: {
          var rowCheck = false;
          if(i<2){ rowCheck=true; break rc; } // skip first two columns
          for(var k=1; k<3; k++){ //Check near the new block for two matching blocks
            if (dec.grid[j][i-k]!==colorNum) { //check to the left:
              rowCheck=true;
              break rc; //break out of row check
            } //end if
          } //end for
        } //end row wcheck
        DEBUG? console.log('rc: ' + colCheck) : null;
      }

      newBlock = p.image(rune_image_paths[dec.COLOR_NAMES[colorNum]], MARGIN + i*b_size, MARGIN + (11-j)*b_size, b_size, b_size)
      //newBlock.attr({'fill': dec.COLORS[colorNum]});
      dec.grid[j][i]=colorNum;
      dec.blockGrid[j][i]=newBlock;
      //if(i==0){console.log('adding type ' + colorNum + ' block to column 0......')}
      columns[i].push(newBlock); //add block to that column's set.
    } //end row loop

    DEBUG ? console.log('hm'): null;
    // Row loop (preGrid)
    for (var j=0; j<pre_height; j++){
      colorNum = randInt(dec.NUM_COLORS)
      // newBlock = p.rect(MARGIN + i*b_size, MARGIN + (bucket_height + pre_height - (j+1))*b_size,
      //                       b_size, b_size).attr({'fill': dec.COLORS[colorNum]})
      newBlock = p.image(rune_image_paths[dec.COLOR_NAMES[colorNum]], MARGIN + i*b_size, MARGIN + (bucket_height + pre_height - (j+1))*b_size,
                            b_size, b_size)

      dec.preGrid[j][i]=colorNum;
      dec.preBlockGrid[j][i]=newBlock;
      //if(i==0){console.log('adding type ' + colorNum + ' block to column ' + i + ' of pre...')}
    }
    DEBUG? console.log('yay'): null;

    // OLD CODE (replaced by last paragraph)
    // var newBlock = p.rect(MARGIN + i*b_size, MARGIN + (13)*b_size,
    //                         b_size, b_size).attr({'fill':dec.COLORS[randInt(5)]})
    // var newBlock = p.rect(MARGIN + i*b_size, MARGIN + (12)*b_size,
    //                       b_size, b_size).attr({'fill':dec.COLORS[randInt(5)]})

  }
  return columns;
}

makeBlocks(); //create initial blocks with RNG

pre = p.rect(MARGIN, MARGIN + bucket_height*b_size,
             bucket_width*b_size, 2*b_size)
pre.attr({'stroke':'white', 'fill':'black', 'opacity':.7})

cursor = p.rect(MARGIN+2*b_size, MARGIN+6*b_size,
                2*b_size, b_size)
cursor.attr({'stroke':'white', 'opacity':1,'stroke-width':3})
cursor.data('left', [2,5]) //grid coords of left half of cursor
cursor.data('right',[3,5]) //grid coords of right half of cursor
// [0,0] is bottom left. Max is [5, 11]

upString = '...t0,' + (-1 * b_size)
downString = '...t0,' + (b_size)
leftString = '...t' + (-1 * b_size) + ',0'
rightString = '...t' + (b_size) + ',0'

function moveCursor(dir){ //move the cursor and update its data
  cursor.toFront();
  switch(dir){
    case 'up' :
      if (cursor.data('left')[1] < 11){ //only move it if it will stay within the play area
        cursor.transform(upString);
        cursor.data('left')[1]++
        cursor.data('right')[1]++
      }
      break;
    case 'down' :
      if (cursor.data('left')[1] > 0){
        cursor.transform(downString)
        cursor.data('left')[1]--
        cursor.data('right')[1]--
      }
      break;
    case 'left' :
      if (cursor.data('left')[0] > 0){
        cursor.transform(leftString)
        cursor.data('left')[0]--
        cursor.data('right')[0]--
      }
      break;
    case 'right' :
      if (cursor.data('left')[0] < 4){
        cursor.transform(rightString)
        cursor.data('left')[0]++
        cursor.data('right')[0]++
      }
      break;
  }
}

// DEBUGGING GRID SECTION
// "Grid" of Raphael elements:
dec.textGrid = [['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'], //bottom row (yes, it's upside-down)
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined'],
['undefined', 'undefined', 'undefined', 'undefined', 'undefined', 'undefined']]
function showVals(){ // Initially populate the debug grid with strings
  for(var col=0; col<bucket_width; col++){
    for(var row=0; row<bucket_height; row++){
      var color_number = dec.grid[row][bucket_width-1-col];
      var color_string = getColorFromNumber(color_number)

      var textEl = p.text(MARGIN + (bucket_width - col-.5)*b_size , MARGIN + (bucket_height-row-.5)*b_size, color_string);
      textEl.attr({'stroke':'white'})
      dec.textGrid[row][col] = textEl;
    }
  }
  return null;
};
showVals();
function updateDebugGrid(){ // Update the strings in the debug grid.
  for(var col=0; col<bucket_width; col++){
    for(var row=0; row<bucket_height; row++){
      textEl = dec.textGrid[row][col]
      var color_number = dec.grid[row][bucket_width-1-col];
      var color_string = getColorFromNumber(color_number)
      textEl.attr({'text': color_string});
      textEl.toFront();
    }
  }
  return null;
}

// Swap blocks. Results in calls to gravity() and findClusters
function swapBlocks(){
  const DEBUG = false; //set to true to debug this function (get more console output)
  DEBUG ? console.log('- swapping blocks -') : null;

  //Get the colors of the blocks
  left_color_num = dec.grid[cursor.data('left')[1]][cursor.data('left')[0]]
  right_color_num = dec.grid[cursor.data('right')[1]][cursor.data('right')[0]]
  DEBUG ? console.log('left_color_num: ' +left_color_num) : null;

  //Get references to the blocks
  left_block = dec.blockGrid[cursor.data('left')[1]][cursor.data('left')[0]]
  right_block = dec.blockGrid[cursor.data('right')[1]][cursor.data('right')[0]]
  if(DEBUG) {
    console.log('left_block:')
    console.log(left_block)
  }

  // translate the blocks
  if (left_block) { left_block.transform('...t'+b_size+",0")}
  if (right_block) { right_block.transform('...t'+(-1*b_size)+",0")}
  DEBUG ? console.log('something') : null;

  //   If at least one block is being moved,
  // update the grids, maybe apply gravity, and call findClusters:
  if (left_block || right_block){
    //update the color grid
    dec.grid[cursor.data('left')[1]][cursor.data('left')[0]] = right_color_num
    dec.grid[cursor.data('right')[1]][cursor.data('right')[0]] = left_color_num

    //update the block grid
    dec.blockGrid[cursor.data('left')[1]][cursor.data('left')[0]] = right_block
    dec.blockGrid[cursor.data('right')[1]][cursor.data('right')[0]] = left_block

    // If only one block is moved, apply gravity.
    if( left_block ? !right_block : right_block ) { // XOR operator.
      // Figure out which block was empty:
      if(!left_block){var empty = 'left'}
      else{var empty= 'right' }

      gravity('swap', empty)
    }

    findClusters();
  }
  updateDebugGrid()

  DEBUG? console.log('- finished swapBlocks function -') : null;
  return null
}

// Given block and distance, return Raph anim obj
function blockDropAnim(block, distance){
  const DEBUG = true;
  var self = this;
  DEBUG ? console.log('making a dropping animation:') : null;
  DEBUG ? console.log('... block to animate: ') : null;
  DEBUG ? console.log(block) : null;
  DEBUG ? console.log('... distance to drop: ' + distance) : null;
  // DEBUG? console.log('value of "this" in blockDropAnim: ') :null;
  // DEBUG? console.log(this) :null;
  // DEBUG? console.log('value of "DEBUG" in blockDropAnim: ') :null;
  // DEBUG? console.log(DEBUG) :null;
  // Returns a Raphael animation for the passed block to drop the passed distance (in blocks):
  const anim =  p.raphael.animation({ 'y': block.attr('y') + distance*b_size },
                                      Math.sqrt(2*distance/dec.G), '<', updateAndFind.bind(block));
  DEBUG? console.log('anim made.') : null;
  return anim;
};

// Apply "gravity" to the playing area.
function gravity(reason, arg){
  console.log('applying gravity because ' + reason)
  const DEBUG = true;
  // Possible reasons are 'swap', 'match', and 'command'.
  // "arg" usage depends on reason:
    // For swap, pass 'left' if the left space was empty,
    //   and 'right' if the right space was empty.
    // For match, pass the locations of the cleared blocks. (see clear_locs in findClusters)

  // If due to swapping, check beneath the side
  //   of the cursor that was empty for space,
  //   and above the side of the cursor that was full for blocks.
  //   If empty space is found, do stuff
  var row_num = cursor.data('left')[1]; //row number of cursor
  if (reason == 'swap') {
    // DEBUG? console.log('row_num: ' + row_num ) :null;
    // Left side of cursor was at cursor.data('left')
    var empty = arg; //'left' or 'right'
    // DEBUG? console.log('empty: ' + empty) :null;
    var was_empty = cursor.data(empty);
    if (row_num > 0){ //If not on the bottom row, check for empty space beneath:
      if (dec.grid[was_empty[1] - 1][was_empty[0]] == -1) { //empty space below the freshly swapped block. Drop it.
        // Find how far to drop it:
        var how_far = 0;
        var go = true;
        while(go){ // find how far to drop it
          how_far++;
          next_spot = dec.grid[was_empty[1] - how_far][was_empty[0]]
          if (next_spot !== -1) {
            go = false;
            how_far--; //fix the off-by-one error
          } //stop if you find a block
          if(was_empty[1]-how_far == 0) {go = false;} //or if you reach the bottom
        }
        // console.log('drop it ' +how_far+ ' spaces')

        var block_to_drop = dec.blockGrid[was_empty[1]][was_empty[0]];
        block_to_drop.animate(blockDropAnim(block_to_drop, how_far))

        //update the grids:
        dec.grid[was_empty[1] - how_far][was_empty[0]] = dec.grid[was_empty[1]][was_empty[0]];
        dec.grid[was_empty[1]][was_empty[0]] = -1;
        dec.blockGrid[was_empty[1] - how_far][was_empty[0]] = block_to_drop;
        dec.blockGrid[was_empty[1]][was_empty[0]] = undefined;
      }
    }

    var full = (arg=='left' ? 'right' : 'left')
    var was_full = cursor.data(full)
    if(dec.grid[was_full[1] + 1][was_full[0]] !== -1) { // block(s) tableclothed. Drop it/them.
      // This time we know how far to drop (1 space), but we need to find how many blocks are dropping:
      // Find how many:
      var how_many = 0;
      var go = true;
      var blocks_to_drop = p.set()
      while(go){
        how_many++;
        next_spot = dec.grid[was_full[1] + how_many][was_full[0]]
        if (next_spot == -1) {
          go = false;
          //how_many--; //fix the off-by-one error
        } //stop if you find a space
        if(was_full[1] + how_many == bucket_height) {go = false;} //or if you reach the top!
        blocks_to_drop.push(dec.blockGrid[was_full[1] + how_many][was_full[0]])
      } // find how many to drop and collect them in a set!
      for (var i=0; i<blocks_to_drop.length; i++){
        block_to_drop = blocks_to_drop[i]
        block_to_drop.animate(blockDropAnim(block_to_drop, 1))

        // Update the grids:
        dec.grid[was_full[1]+i][was_full[0]] = dec.grid[was_full[1]+i+1][was_full[0]];
        // new spot's number = old spot's number

        dec.grid[was_full[1]+i+1][was_full[0]] = -1;
        // migrate the space up the stack one notch

        dec.blockGrid[was_full[1]+i][was_full[0]] = block_to_drop;
        dec.blockGrid[was_full[1]+i+1][was_full[0]] = undefined;
      } // end for
    } // block(s) tableclothed. Drop it/them. (codepen)
  }

  /*
  //new dropping algorithm:
  if(reason=='match'){
    // Drop each stack above a space that's been cleared:
  }
  */

  // old dropping algorithm:
  if(reason == 'match'){
    for(var col=0; col<bucket_width; col++){
      for(var row=1; row<bucket_height; row++){
        if(dec.blockGrid[row][col]){ // Skip this if no block is here.
          if (dec.grid[row - 1][col] == -1) { //empty space below the block in question. Drop it...
            // Find how far to drop it:
            var how_far = 0;
            var go = true;
            var another_var = 0
            while(go){ // find how far to drop it:
              how_far++;

              if(row-how_far == 0) {go = false; } // Stop if you reach the bottom
              next_spot = dec.grid[row - how_far][col] // Color value of next spot downward
              if (next_spot !== -1) { // stop if you find a block
                go = false;
                how_far--; // fix the off-by-one error
              }
            }
            // console.log('drop it ' +how_far+ ' spaces')

            // Then, drop it, unless it's already dropping.
            var block_to_drop = dec.blockGrid[row][col];
            var dropping = block_to_drop.data('dropping')
            if(!dropping){
              block_to_drop.animate(blockDropAnim(block_to_drop, how_far))
              // update the grids:
              dec.grid[row - how_far][col] = dec.grid[row][col];
              dec.grid[row][col] = -1;
              dec.blockGrid[row - how_far][col] = block_to_drop;
              dec.blockGrid[row][col] = undefined;

              // Then drop the blocks above it the same amount:

              // First build the sequence and stack:
              var stack_height = 0 // how many additional blocks are above the one being dropped
              var sequence = [] // The sequence of numbers representing the blocks' colors
              var stack = [] // The visual stack of blocks (raph elements)

              while(dec.grid[row + 1 + stack_height][col]){
                if (row + 1 + stack_height == bucket_height || dec.grid[row + 1 + stack_height][col] == -1) {break;}
                // if you reach the top                     or find an empty space,            stop
                sequence.push(  dec.grid[row+1+stack_height][col]);
                stack.push(dec.blockGrid[row+1+stack_height][col]);
                stack_height++;
                DEBUG ? console.log('stack_height: ' +stack_height):null;
              } //end while
              DEBUG ? console.log('SEQUENCE: '): null;
              DEBUG ? console.log(sequence): null;
              DEBUG ? console.log('STACK: '): null;
              DEBUG ? console.log(stack): null;

              // Then drop the sequence and stack:
              DEBUG ? console.log('dropping '+(stack_height+1)+' blocks'): null;
              for(var q=0; q<stack_height; q++){ // Act on each block in the stack.
                num_to_drop = sequence[q]
                block_to_drop = stack[q];
                block_to_drop.animate(blockDropAnim(block_to_drop, how_far));
                block_to_drop.data('dropping', true);

                //update the grids:
                dec.grid[     row - how_far + (q+1)][col] = num_to_drop; //"move the number down"
                dec.grid[     row + (q+1)][col] = -1;
                dec.blockGrid[row - how_far + (q+1)][col] = block_to_drop;
                dec.blockGrid[row + (q+1)][col] = undefined;

                // dec.grid[     row - how_far][col] = dec.grid[row][col];
                // dec.grid[     row][col] = -1;
                // dec.blockGrid[row - how_far][col] = block_to_drop;
                // dec.blockGrid[row][col] = undefined;
              } // Finished acting on each extra block in stack
            } //end dropping if
          } //end empty space below if
        } //end block check if
      } //end row loop
    } //end col loop
    //Not implemented: Check each grid spot that was cleared:
    // console.log('blocks were cleared at these locations: ')
    // console.log(arg)
  } // end if
  // implementation could be more efficient using the arg, but eh

  if (reason=='command'){
    // Check beneath each grid spot which is above the first row and contains a block.
    for(var col=0; col<bucket_width; col++){
      for(var row=1; row<bucket_height; row++){
        if(dec.blockGrid[row][col]){ // If the block exists,
          if (dec.grid[row - 1][col] == -1) {
            // Find how far to drop it:
            var how_far = 0;
            var go = true;
            while(go){ // find how far to drop it
              how_far++;
              next_spot = dec.grid[row - how_far][col]
              if (next_spot !== -1) {
                go = false;
                how_far--; //fix the off-by-one error
              } //stop if you find a block
              if(row-how_far == 0) {go = false;} //or if you reach the bottom
            }
            // console.log('drop it ' +how_far+ ' spaces')

            var block_to_drop = dec.blockGrid[row][col];
            block_to_drop.animate(blockDropAnim(block_to_drop, how_far))

            //update the grids:
            dec.grid[row - how_far][col] = dec.grid[row][col];
            dec.grid[row][col] = -1;
            dec.blockGrid[row - how_far][col] = block_to_drop;
            dec.blockGrid[row][col] = undefined;
          } //no block below the freshly swapped block. Drop it.
        } //if the block exists, (codepen)
      } //end row loop
    } //end col loop
  }

  console.log('Done applying gravity')
  // updateDebugGrid(); // called in updateAndFind at end of animation anyways
  //return findClusters();
  return null;
}

// Update debug grid and find matching clusters:
function updateAndFind(){
  DEBUG = false; // Warning: might need to add "var" here
  DEBUG? console.log('value of "this" in updateAndFind: ') :null;
  DEBUG? console.log(this) :null;
  this.data('dropping', false); //When called, the block that was just dropped is passed as "this"
  updateDebugGrid();
  findClusters();
}

// Find matching clusters. If any are found, call clearBlocks.
function findClusters(){
  console.log('finding matches/clusters')
  // Check the grid for lines ('clusters') of 3 or more matching blocks.
  // If found, return their locations as an array.

  const DEBUG = false; //set to true to log more stuff
  var clear_locs = []; //grid locations of blocks to be cleared in [col, row] format
  var color_num;
  var clusters_found = 0
  for(var col=0; col<bucket_width; col++){
    for(var row=0; row<bucket_height; row++){
      try {
        var marked = false;
        color_num = dec.grid[row][col]
        if (color_num !== -1){ // If there's a block here, check for matches.
          if (DEBUG){console.log('Checking block: row ' +row+ ', col ' +col+', color_num '+color_num+ ')')}
          var how_many_r = 0; // How many matching blocks found to the right
          var how_many_u = 0; // How many matching blocks found upwards
          // We're starting from the bottom left,
          //   and will read rightward through the row, then shift up a row, etc.
          if(col+1 !== bucket_width){
            while(col + 1 < bucket_width &&
                  color_num == dec.grid[row][col+ how_many_r +1] ){ how_many_r++ }
          } // Find matches right, but only if we're not at the last column.
          //console.log('hurr')
          if(row+1 !== bucket_height){
            while(row+1 < bucket_height &&
                  color_num == dec.grid[row + how_many_u + 1][col] ){ how_many_u++ }
          } // Find matches up, but only if we're not at the last row
          if(dec.blockGrid[row][col].data('cluster') !== undefined){marked=true} //For code readability, check if block is already marked.
          if (how_many_r>1){ // We have a cluster. Mark it and the matching blocks to the right.
            if (!marked){clusters_found++;} //This hasn't been marked yet, so it belongs to a new cluster.
            for(var a=0; a<=how_many_r; a++){
              if(DEBUG){console.log('here r')}
              dec.blockGrid[row][col+a].data('cluster', clusters_found)
              if(DEBUG){console.log('here? r')}
              clear_locs.push([row,col+a])
            }
            marked = true;
          }
          if (how_many_u>1){ // We have a cluster. Mark it and the matching blocks above it.
            if (!marked){clusters_found++;} // This hasn't been marked yet, so it belongs to a new cluster.
            for(var a=0; a<=how_many_u; a++){
              if(DEBUG){console.log('here u')}
              dec.blockGrid[row+a][col].data('cluster', clusters_found) // Give it its cluster
              if(DEBUG){console.log('here? u')}
              clear_locs.push([row+a,col])
            }
            marked = true;
          }
        }
      } // end try
      catch(e){ console.log(e) }

    } //end row loop
  } //end col loop
  console.log(''+clusters_found+' clusters found')

  var unique_locs = clear_locs.map(ar=>JSON.stringify(ar))
    .filter((itm, idx, arr) => arr.indexOf(itm) === idx)
    .map(str=>JSON.parse(str));

  if (clusters_found>0){clearBlocks(unique_locs)}
  //return gravity('match', clear_locs)
  return null;
}

dec.FADE_OUT_TIME = 500; // duration of the fade out animation in ms
function clearBlockAnim(block){
  return p.raphael.animation({ 'opacity' : 0 }, dec.FADE_OUT_TIME, function(){block.remove()}.bind(block))
}
function clearBlocks(clear_locs){
  console.log('clearing blocks at these locations: ')
  console.log(clear_locs)
  var block = undefined
  // Clear marked blocks:
  for(var col=0; col<bucket_width; col++){
    for(var row=0; row<bucket_height; row++){
      block = dec.blockGrid[row][col];
      if(block){ //if the block exists,
        if(block.data('cluster') > 0 ) { // and it belongs to a non-zero cluster, clear it.
          block.animate(clearBlockAnim(block));
          //block.remove(); //remove it from the GUI
          dec.blockGrid[row][col]=undefined; //remove the reference to it
          dec.grid[row][col] =-1
        }
      }
    } //end row loop
  } //end col loop
  console.log('done clearing blocks')
  return gravity('match', clear_locs)
  // return null;
}

dec.raiseTime = Math.sqrt(2/dec.G)
function raiseBlockAnim(block){
  return p.raphael.animation({ 'y': block.attr('y') - b_size }, dec.raiseTime, '>');
};
function raiseGrid(){
  // 1. Raise all existing rows in the main grid by one.
  // 2. Move the top line of the "pre" grid into the main grid's bottom row
  // 3. Raise the bottom line of the "pre grid" to the top
  // 4. Make a new line on the bottom of the pre grid

  const DEBUG = false;
  var block_to_raise;

  console.log('Raising the grid...?');

  // If grid is full, do nothing (return):
  for(var col=0;col<bucket_width; col++){ // Check for blocks in the top row.
    if(dec.grid[bucket_height-1][col] != -1){
      DEBUG? console.log('max height reached, not raising grid.') : null ;
      return;
    }
  }

  // If grid is already rising, do nothing (return):
  if(dec.gridRising || dec.blockDropping){
    console.log('grid already rising.')
    return;
  }

  // Otherwise, update property state and prep to clear it when finished:
  dec.gridRising = true
  setInterval(function(){dec.gridRising=false;}, dec.raiseTime+100)

  for(var col=0; col<bucket_width; col++){ // Raise existing rows in main grid
    for(var row=bucket_height-1; row>0; row--){
      //Starting from the top, set the row's grid and blockGrid values equal to the row below it:
      dec.grid[row][col] = dec.grid[row-1][col]
      dec.blockGrid[row][col] = dec.blockGrid[row-1][col]

      //DEBUG? console.log('animating block at row ' +row + ', column ' +col ): null;
      //And animate each block:
      block_to_raise = dec.blockGrid[row-1][col]
      //DEBUG? console.log(block_to_raise) : null;
      block_to_raise ?  block_to_raise.animate(raiseBlockAnim(block_to_raise)) : null;
    }
  }
  DEBUG ? console.log(1) : null ;

  // Raise top line of pregrid into main grid
  for(var col=0; col<bucket_width; col++){ // Animate each block:
    dec.grid[0][col] = dec.preGrid[pre_height-1][col];
    dec.blockGrid[0][col] = dec.preBlockGrid[pre_height-1][col];
    block_to_raise = dec.preBlockGrid[pre_height-1][col];
    block_to_raise.animate(raiseBlockAnim(block_to_raise));
  }
  DEBUG ? console.log(2) : null ;

  // Raise the bottom line of the pre grid to the top
  for(var col=0; col<bucket_width; col++){ // Animate each block:
    dec.preGrid[pre_height-1][col] = dec.preGrid[0][col]
    dec.preBlockGrid[pre_height-1][col] = dec.preBlockGrid[0][col]
    block_to_raise = dec.preBlockGrid[0][col];
    block_to_raise.animate(raiseBlockAnim(block_to_raise));
  }
  DEBUG ? console.log(3) : null ;

  // Make a new line on the bottom of the pre grid:
  for (var col=0; col<bucket_width; col++){ //column loop
    colorNum = randInt(dec.NUM_COLORS)
    newBlock = p.rect(MARGIN + col*b_size, MARGIN + (bucket_height + pre_height - 1)*b_size,
                          b_size, b_size).attr({'fill': dec.COLORS[colorNum]})
    dec.preGrid[0][col]=colorNum;
    dec.preBlockGrid[0][col]=newBlock;
    //if(i==0){console.log('adding type ' + colorNum + ' block to column ' + i + ' of pre...')}
  }
  pre.toFront();
  DEBUG ? console.log(4) : null ;

  updateDebugGrid();

  return findClusters();
}

dec.keycodes = {
  65: 'left', //a
  87: 'up',   //w
  68: 'right',//d
  83: 'down', //s
} // maps keys to cursor directions

//LISTEN FOR INPUT
$(window).keydown(function(event){
  // switch(event.keyCode){ //prevent defaults for backspace/delete, spacebar, and enter.
  //   case 8: //backspace/delete
  //   case 32: //spacebar
  //   case 13: //enter
  //     event.preventDefault();
  //     break;
  //   default:
  //     break;
  // }
  if(dec.ignoreInput){return;}
  switch(dec.mode){ //do the right thing based on what type of screen the user is in (menu, game, tutorial, etc)
    case "menu": //code from Q-Po. May be useful later
      switch(event.keyCode){
        case 8: // backspace/delete: return to the previous menu
          event.preventDefault();
          if (qpo.activeMenu != "title") {qpo.menus[qpo.activeMenu].up();}
          break;
        case 32: // spacebar (fall through to enter/return)
        case 13: // enter/return
          try {qpo.menus[qpo.activeMenu].cl.selectedItem.action();}
          catch(err){;} //do nothing if there is no activeButton
          if(qpo.activeMenu == "title"){qpo.titleScreen.close()}
          break;
        case 87: //w
          event.preventDefault();
          qpo.menus[qpo.activeMenu].previous();
          break;
        case 83: //s
          event.preventDefault();
          qpo.menus[qpo.activeMenu].next();
          break;
        case 65: {  //a
          if (qpo.activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.minus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 68: {  //d
          if (qpo.activeMenu=="customG"){
            try {
              qpo.menus["customG"].active.plus();
            }
            catch(err) {
              ;
            }
          }
          break;
        }
        case 37: {  //left arrow
          if (qpo.activeMenu=="customG"){
            try { qpo.menus["customG"].active.minus(); }
            catch(err) { ; }
          }
          break;
        }
        case 38: {  //up arrow
          event.preventDefault();
          qpo.menus[qpo.activeMenu].previous();
          break;
        }
        case 39: { //right arrow
          if (qpo.activeMenu=="customG"){
            try { qpo.menus["customG"].active.plus(); }
            catch(err) { ; }
          }
          break;
        }
        case 40: { //down arrow
          event.preventDefault();
          qpo.menus[qpo.activeMenu].next();
          break;
        }
        default:
          break;
      }
      break;
    case "game":
      //try { //try to respond to the keypress appropriately
        switch(event.keyCode){
          case 81: //q  (left + up)
          case 69: //e  (right + up)
          case 65: //a (left)
          case 87: //w (up)
          case 68: //d (right)
          case 83: //s (down)
            // EVENTUALLY? add z, c for diagonal down
            // Cursor move order detected (wasd)
            var moveStr = dec.keycodes[event.keyCode]
            //console.log(moveStr)
            moveCursor(moveStr);
            break;
          case 70: //f (gravity)
            gravity('command')
            break;
          case 32: //spacebar
            event.preventDefault();
            swapBlocks();
            break;
          case 16: //shift (raise the grid)
            raiseGrid();
            break;
          // case 37: //left
          // case 38: //up
          // case 39: //right
          // case 40: //down
          //   //up/left/right/down arrows (move highlight)
          //   if(!qpo.gameEnding){ qpo.user.activeUnit.search(qpo.dirMap[event.keyCode]);
          //   break;
          default: //some other key detected (invalid)
            //left = 37
            // up = 38
            // right = 39
            // down = 40
            console.log("some other key");
            // tab = 9
            break;
        }
      //} //end try
      //catch(err){ console.log('error was thrown: ' + err); }
      break;
    default:
      break;
  }
});

//var raise_interval = setInterval(raiseGrid, 15000);
