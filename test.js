
function gravity(reason, arg){
  console.log('applying gravity because ' + reason)
  const DEBUG = true;

  if (reason == 'swap' && (cursor.data('left')[1] > 0)){
    // Left side of cursor was at cursor.data('left')
    var empty = arg; //'left' or 'right'
    var was_empty = cursor.data(empty);
    var full = (arg=='left' ? 'right' : 'left')
    var was_full = cursor.data(full)
  }

  if(reason == 'match'){
    var stupid = 'dumb';
  }

  if (reason=='command'){
    // Check beneath each grid spot which is above the first row and contains a block.
  }

  console.log('applied gravity')
  return findClusters();
  //return null;
}
