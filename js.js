// Similar to a few other match-3 games. (Pokemon Puzzle League / Tetris Attack) But simple.
console.log('reset..')
dec = {} //catcher object for this game (to prevent global vars) .
dec.mode = 'game'


W = 600 // width
H = 800 // height
p = new Raphael("raphCon", W, H)

bg = p.rect(0,0, W, H).attr({'fill':'#111111'})

//test = p.rect(10,10, 50,50).attr({'fill':'red'})

b_size = 50*.8; //block size

// bucket = p.path("M0,0 L10, 10").attr({'stroke':'white'})

// Bucket is 12 blocks high by 6 wide usually
// Plus one row of upcoming blocks (maybe two with special effects?)
bucket_width = 6   //in blocks
bucket_height = 12

colors = ['red', '#dddd00','#22ff22','#0099ff','#ff33ff']
//                yellow     green    blue       purple

MARGIN = 25
bucket = p.rect(MARGIN, MARGIN, bucket_width*b_size,
               bucket_height*b_size).attr({'fill':'#222222'})

dec.G = .0001 // gravity factor

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
// dec.grid[row][column]

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

dec.preGrid = [ [-1, -1, -1, -1, -1, -1], //bottom row (yes it's upside-down)
                [-1, -1, -1, -1, -1, -1]] //

dec.preBlockGrid =[ [undefined, undefined, undefined, undefined, undefined, undefined], //bottom row (yes it's upside-down)
                    [undefined, undefined, undefined, undefined, undefined, undefined]]

function randInt(ceil){ //returns random int from 0 to ceil-1
  return Math.floor(Math.random() * Math.floor(ceil))
}

function makeBlocks(){
  var color;
  column_pops = [] //populations (# of blocks in each column)
  columns = []
  for (var i=0; i<bucket_width; i++){columns[i] = p.set()}
  // Fill each column with a random number of blocks (less than 9).
  for (var i=0; i<bucket_width; i++){
    column_pops[i] = randInt(9);
    for (var j=0; j<column_pops[i]; j++){
      colorNum = randInt(5)
      var newBlock = p.rect(MARGIN + i*b_size, MARGIN + (11-j)*b_size,
                            b_size, b_size).attr({'fill': colors[colorNum]})
      dec.grid[j][i]=colorNum;
      dec.blockGrid[j][i]=newBlock;
      //if(i==0){console.log('adding type ' + colorNum + ' block to column 0......')}
      columns[i].push(newBlock); //add block to that column's set.
    }

    //populate pre:
    var newBlock = p.rect(MARGIN + i*b_size, MARGIN + (13)*b_size,
                            b_size, b_size).attr({'fill':colors[randInt(5)]})
    var newBlock = p.rect(MARGIN + i*b_size, MARGIN + (12)*b_size,
                          b_size, b_size).attr({'fill':colors[randInt(5)]})
    //TODO: add to grids
  }
  return columns;
}

makeBlocks()

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

function swapBlocks(){
  console.log('swapping')

  //Get the colors of the blocks
  left_color_num = dec.grid[cursor.data('left')[1]][cursor.data('left')[0]]
  right_color_num = dec.grid[cursor.data('right')[1]][cursor.data('right')[0]]
  //console.log(left_color_num)

  //Get references to the blocks
  left_block = dec.blockGrid[cursor.data('left')[1]][cursor.data('left')[0]]
  right_block = dec.blockGrid[cursor.data('right')[1]][cursor.data('right')[0]]
  //console.log(left_block)

  // translate the blocks
  if (left_block) { left_block.transform('...t'+b_size+",0")}
  if (right_block) { right_block.transform('...t'+(-1*b_size)+",0")}

  if (left_block || right_block){ //If at least one block is being moved, update the grids:
    //update the color grid
    dec.grid[cursor.data('left')[1]][cursor.data('left')[0]] = right_color_num
    dec.grid[cursor.data('right')[1]][cursor.data('right')[0]] = left_color_num

    //update the block grid
    dec.blockGrid[cursor.data('left')[1]][cursor.data('left')[0]] = right_block
    dec.blockGrid[cursor.data('right')[1]][cursor.data('right')[0]] = left_block

    if( left_block ? !right_block : right_block ) { // XOR operator. If only one block is moved, apply gravity.
      //Figure out which block was empty:
      if(!left_block){var empty = 'left'}
      else{var empty= 'right' }

      gravity('swap', empty)
    }

    clearBlocks();
  }
  console.log('swapped')
  //  both_empty = (left_color_num == -1 && right_color_num == -1);
}

dec.keycodes = {
  65: 'left', //a
  87: 'up',   //w
  68: 'right',//d
  83: 'down', //s
}

function gravity(reason, arg){
  console.log('applying gravity because ' + reason)
  // Possible reasons are 'swap' and 'match'. For swap, pass 'left' if the left space was empty,
  //   and 'right' if the right space was empty.

  // If due to swapping (and not on the first row), check beneath the side
  //   of the cursor that was empty for space,
  //   and above the side of the cursor that was full for blocks.
  //   If empty space is found, move that block and all blocks above it downward.
  if (reason == 'swap' && (cursor.data('left')[1] > 0)){
    // Left side of cursor was at cursor.data('left')
    var empty = arg; //'left' or 'right'
    var was_empty = cursor.data(empty);
    if (dec.grid[was_empty[1] - 1][was_empty[0]] == -1) {
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
      block_to_drop.animate({
        'y': block_to_drop.attr('y') + how_far*b_size
      }, Math.sqrt(2*how_far/dec.G), '<')

      //update the grids:
      dec.grid[was_empty[1] - how_far][was_empty[0]] = dec.grid[was_empty[1]][was_empty[0]];
      dec.grid[was_empty[1]][was_empty[0]] = -1;
      dec.blockGrid[was_empty[1] - how_far][was_empty[0]] = block_to_drop;
      dec.blockGrid[was_empty[1]][was_empty[0]] = undefined;
    } //no block below the freshly swapped block. Drop it.

    var full = (arg=='left' ? 'right' : 'left')
    var was_full = cursor.data(full)
    if(dec.grid[was_full[1] + 1][was_full[0]] !== -1) {
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
        block_to_drop.animate({
          'y': block_to_drop.attr('y') + b_size
        }, Math.sqrt(2/dec.G), '<')

        // Update the grids:
        dec.grid[was_full[1]+i][was_full[0]] = dec.grid[was_full[1]+i+1][was_full[0]];
        // new spot's number = old spot's number

        dec.grid[was_full[1]+i+1][was_full[0]] = -1;
        // migrate the space up the stack one notch

        dec.blockGrid[was_full[1]+i][was_full[0]] = block_to_drop;
        dec.blockGrid[was_full[1]+i+1][was_full[0]] = undefined;
      }
    } // block(s) tableclothed. Drop it/them.
  }

  if(reason == 'match'){
    //Check each grid spot

  }
  console.log('applied gravity')
}

function clearBlocks(){
  console.log('clearing blocks')
  // Check the grid for lines of 3 or more matching blocks.
  // If found, remove them from the board with a simple animation.

  var clear_locs = []; //grid locations of blocks to be cleared in [col, row] format
  var color_num;
  var clusters_found = 0
  for(var col=0; col<bucket_width; col++){
    for(var row=0; row<bucket_height; row++){
      var marked=false;
      if (dec.grid[row][col] !== -1){
        var how_many_r = 0; // how many matching blocks found to the right
        var how_many_u = 0; // how many matching blocks found upwards
        // We're starting from the bottom left,
        //   and will read rightward through the row, then shift up a row, etc.
        while(color_num == dec.grid[row][col+how_many_r+1] ){ how_many_r++}
        while(color_num == dec.grid[row + how_many_u + 1][col] ){ how_many_r++}
        if(dec.blockGrid[0][0].data('cluster') !== undefined){marked=true} //For code readability, check if block is already marked.
        if (how_many_r>1){
          if (!marked){clusters_found++;} //This hasn't been marked yet, so it belongs to a new cluster.
          for(var a=0; a<how_many_r; a++){
            console.log('here')
            dec.blockGrid[row][col+a].data('cluster', clusters_found)
            console.log('here?')
          }
        }  //we have a cluster. Mark it and the matching blocks to the right.
        if (how_many_u>1){
          if (!marked){clusters_found++;} //This hasn't been marked yet, so it belongs to a new cluster.
          for(var a=0; a<how_many_u; a++){
            console.log('here')
            dec.blockGrid[row+a][col].data('cluster', clusters_found)
            console.log('here?')
          }
        } //we have a cluster. Mark it and the matching blocks above it.
      } //If there's a block here, check for matches.
    } //end row loop
  } //end col loop

  // Clear marked blocks:
  for(var col=0; col<bucket_width; col++){
    for(var row=0; row<bucket_height; row++){
      if(dec.blockGrid[row][col].data('cluster', clusters_found) > 0 ) {
        dec.blockGrid[row][col].remove(); //remove it from the GUI
        dec.grid[row][col] =-1
      }
    } //end row loop
  } //end col loop
  console.log('cleared blocks')
  return gravity('match', clear_locs)
}

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
    case "menu":
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
      try { //try to respond to the keypress appropriately
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
          case 32: //spacebar
            event.preventDefault();
            swapBlocks();
            break;
          case 16: //shift
            console.log('push the next row up.')
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
      }
      catch(err){ console.log('error was thrown' + err); }
      break;
    default:
      ;
  }
});
