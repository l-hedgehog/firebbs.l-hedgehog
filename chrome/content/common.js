/* ***** BEGIN COPYRIGHT AND LICENSE BLOCK *****
 *
 * Copyright © 2007 Milx
 * Copyright © 2007, 2008, 2009, 2010 Hector Zhao
 *
 * This file is part of FireBBS.l-hedgehog.
 *
 * FireBBS.l-hedgehog is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * FireBBS.l-hedgehog is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with FireBBS.l-hedgehog.  If not, see <http://www.gnu.org/licenses/>.
 *
 * ***** END COPYRIGHT AND LICENSE BLOCK ***** */

function prePicRel(match){
  if(match.search(/\.(bmp|gif|jpe?g|png)$/i)==-1){
    return '';
  } else {
    return ' rel="pic_preview"'
  }
}

function ip2LocRel(match){
  var ipStart = match.search(/\d/);
  return match.substr(0, ipStart) + '<a rel="ip2loc">' + match.substr(ipStart, (match.length - ipStart - 1)) + '</a>]';
}

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

  var pos = convertMN2XY($cursor.position);
  if(bcDBCS){
    var lengthOfText = str.length;
    str = nsIScriptableUnicodeConverter.ConvertToUnicode(str);
    var bicolor = $character.lead + lengthOfText - stringLen(str);
  } else {
    var lengthOfText = stringLen(str);
  }
  //str = str.replace(/\uFFFD/g, ' ');
  str = str.replace(/\ufffd/g, '?');
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
  var fromIpTemplate=/\[FROM:\s\d+\.\d+\.\d+\.[*\d]+]/;
  if(hzIPSearcher)
    str = str.replace(fromIpTemplate, ip2LocRel);

  var s = '<span ';
  s += 'id="m' + $cursor.position.m + 'n' + $cursor.position.n + 'n' + ($cursor.position.n + lengthOfText) + '"';
  s += 'class="terminal_display" '
  s += 'style="';
  s += 'left: ' + pos[0] + 'px;';
  s += 'top: ' + pos[1] + 'px;';
  s += 'width: ' + (lengthOfText * $character.fontWidth) + 'px;';

  if($character.italic)
    s += 'font-style: ' + $character.getProperty('font-style') + ';';

  if($character.underline || $character.blink)
    s += 'text-decoration: ' + $character.getProperty('text-decoration') + ';';

  if($character.lead){
    FireBBS.HTMLString_cache = FireBBS.HTMLString_cache.replace(/<\/span>$/, str[0]+'</span>');
    s += 'overflow: hidden; text-indent: -' + $character.fontWidth + 'px;';
  }
  if(bcDBCS){
    switch(bicolor){
      case 0:
      case 1:
        $character.setLead(bicolor);
        break;
      default:
        //maybe throw an error?
    }
  }

  s += 'color: ' + $character.getProperty('color') + ';';
  s += 'background-color: ' + $character.getProperty('background-color') + ';">';
  s += str + '</span>';

  $garbage_span_collector.setRange($cursor.position.m, [$cursor.position.n, $cursor.position.n + lengthOfText]);
  $cursor.setPosition($cursor.position.m, $cursor.position.n + lengthOfText);
  return s;
}

function generate_bg_span(cursorPosition, cols){
  var pos = convertMN2XY($cursor.position);
  var s = '<span';
  s += ' id="m' + cursorPosition.m + 'n' + cursorPosition.n + 'n' + (cursorPosition.n + cols) + '"';
  s += 'class="terminal_display" '
  s += ' style="';
  s += 'left: ' + pos[0] + 'px;';
  s += 'top: ' + pos[1] + 'px;';
  s += 'background-color: ' + colorTable[10] + ';'
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
  var str2 = str.replace(/[\x00-\xFF\uFFFD]/g, '');
  //fix for these: '¤§¨°±·×÷'
  var str3 = str.replace(/[^\xA4\xA7\xA8\xB0\xB1\xB7\xD7\xF7]/g, '');
  //fix for these: 'àáèéêìíòóùúü'
  var str4 = str.replace(/[^\xE0\xE1\xE8-\xEA\xEC\xED\xF2\xF3\xF9\xFA\xFC]/g, '');
  //fix for ptt.cc login, but cannot find this string in the online pttbbs cvs 
  var len5 = /\ufffd\ufffd\x18\x01\ufffd/.test(str) ? 1 : 0;
  if(bcDBCS){
    return str.length + str2.length + str3.length + str4.length + len5;
  } else {
    return str.length + str2.length + str3.length;
  }
}

function locale(strName){
  return strBundle.GetStringFromName(strName);
}

function toHex(dec) {
  var hex = "0123456789ABCDEF";
  return hex[Math.floor(dec / 16)] + "" + hex[dec % 16];
}

function hexColor(color) {
  if(color.search("rgb")==0){
    var rgb = /(\d+),\s(\d+),\s(\d+)/.exec(color);
    return "#" + toHex(rgb[1]) + "" + toHex(rgb[2]) + "" + toHex(rgb[3]);
  } else {
    return color;
  }
}
