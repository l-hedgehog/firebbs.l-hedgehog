function prePicRel(match){
  if(match.search(/\.(bmp|gif|jpe?g|png)$/i)==-1){
    return '';
  } else {
    return ' rel="pic_preview"'
  }
}

//function ip2LocRel(match){
//  var ipStart = match.search(/\d/);
//  return match.substr(0, ipStart) + '<a rel="ip2loc">' + match.substr(ipStart, (match.length - ipStart - 1)) + '</a>]';
//}

//trick to avoid </img> in link
function addLink(match){
  var imgTag = match.search(/&lt;/);
  if(imgTag==-1){
    return '<a href="' + match + '" target="_blank"' + prePicRel(match) + '>' + match + '</a>';
  } else {
    return '<a href="' + match.substr(0, imgTag) + '" target="_blank" rel="pic_preview">' + match.substr(0, imgTag) + '</a>' + match.substr(imgTag);
  }
}

function generate_span(str){
  if(!str || $character.display == 'none') return '';

  //str = str.replace(/\uFFFD/g, ' ');
  str = str.replace(/\ufffd/g, '?');
  var pos = convertMN2XY($cursor.position);
  var lengthOfText = stringLen(str);
  if(str.match(/&|<|>|"/g)){
     str = str.replace(/&/g, '&amp;');
     str = str.replace(/</g, '&lt;');
     str = str.replace(/>/g, '&gt;');
     str = str.replace(/"/g, '&quot;');
  }
  //add html link
  var urlTemplate=/(https?:\/\/)([\w-.]+)(:[0-9]+)?(\/[\/\w;,?:@&=+$.!~*'#%-]*)?/g;  //()
  str = str.replace(urlTemplate, addLink);
  //add ip2location link
  //var fromIpTemplate=/\[FROM:\s\d+\.\d+\.\d+\.[*\d]+]/;
  //str = str.replace(fromIpTemplate, ip2LocRel);

  var s = '<span';
  s += ' id="m' + $cursor.position.m + 'n' + $cursor.position.n + 'n' + ($cursor.position.n + lengthOfText) + '"';
  s += 'class="terminal_display" '
  s += ' style="';
  s += 'left: ' + pos[0] + 'px;';
  s += 'top: ' + pos[1] + 'px;';
  s += 'width: ' + (lengthOfText * $character.fontWidth) + 'px;';

  if($character.italic)
    s += 'font-style: ' + $character.getProperty('font-style') + ';';

  if($character.underline || $character.blink)
    s +=  'text-decoration: ' + $character.getProperty('text-decoration') + ';';

  s += 'color: ' + $character.getProperty('color') + ';';
  s += 'background-color: ' + $character.getProperty('background-color') + ';">';
  s += str + '</span>';

  $garbage_span_collector.setRange($cursor.position.m, [$cursor.position.n, $cursor.position.n + lengthOfText]);
  $cursor.setPosition($cursor.position.m, $cursor.position.n + lengthOfText);
  return s;
}

function generate_black_span(cursorPosition, cols){
  var pos = convertMN2XY($cursor.position);
  var s = '<span';
  s += ' id="m' + cursorPosition.m + 'n' + cursorPosition.n + 'n' + (cursorPosition.n + cols) + '"';
  s += 'class="terminal_display" '
  s += ' style="';
  s += 'left: ' + pos[0] + 'px;';
  s += 'top: ' + pos[1] + 'px;';
  s += 'background-color: black;'
  s += 'width: ' + (cols * $character.fontWidth) + 'px"> </span>';
  $garbage_span_collector.setRange($cursor.position.m, [cursorPosition.n, cursorPosition.n + cols]);
  return s;
}

function convertMN2XY(cursorPosition){
  var origin = [FireBBS.output_area.offsetLeft + 1,
                FireBBS.output_area.offsetTop + 1];
  var realX = origin[0] + (cursorPosition.n - 1) * $character.fontWidth;
  var realY = origin[1] + (cursorPosition.m - 1) * $character.fontHeight;
  return [realX, realY];
}

function stringLen(str){
  str2 = str.replace(/[\x00-\xFF\uFFFD]/g, '');
  //bug fix for this: '§·×÷°'
  str3 = str.replace(/[^\xA7\xB0\xB7\xD7\xF7]/g, '');
  return str.length + str2.length + str3.length;
}
