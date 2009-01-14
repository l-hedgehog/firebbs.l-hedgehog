/* ***** BEGIN COPYRIGHT AND LICENSE BLOCK *****
 *
 * Copyright © 2007,2009 Milx, Hector Zhao
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
 * long with FireBBS.l-hedgehog.  If not, see <http://www.gnu.org/licenses/>.
 *
 * ***** END COPYRIGHT AND LICENSE BLOCK ***** */

var colorTable = [];
//0~9 dark ones
colorTable[0] = 'black';
colorTable[1] = '#400000';
colorTable[2] = '#004000';
colorTable[3] = '#404000';
colorTable[4] = '#000040';
colorTable[5] = '#400040';
colorTable[6] = '#004040';
colorTable[7] = '#606060';
colorTable[9] = '#F9F9F9';
//10~19 normal ones
colorTable[10] = 'black';
colorTable[11] = 'maroon';
colorTable[12] = 'green';
colorTable[13] = 'olive';
colorTable[14] = 'navy';
colorTable[15] = 'purple';
colorTable[16] = 'teal';
colorTable[17] = 'silver';
colorTable[19] = '#F9F9F9';
//20~29 bright ones
colorTable[20] = 'gray';
colorTable[21] = 'red'
colorTable[22] = 'lime';
colorTable[23] = 'yellow' ;
colorTable[24] = 'blue';
colorTable[25] = 'fuchsia';
colorTable[26] = 'aqua';
colorTable[27] = 'white';
colorTable[29] = '#F9F9F9';

var $output_area = {
  rows : 24,
  cols : 80,
};

var $scrolling_region = {
  top: 1,
  bottom: $output_area.rows,

  setToDefault: function(){
    this.top = 1;
    this.bottom = $output_area.rows;
  },

  setRegion: function(top, bottom){
    this.top = top;
    this.bottom = bottom;
  },

};

var $cursor = {
  position : {
    m: 1,
    n: 1,
  },
  saved_position : {
    m: 1,
    n: 1,
  },

  setPosition: function(m, n){
    if(m < 1){
      this.position.m = 1;
    }
    else if(m <= $output_area.rows){
      this.position.m = m;
    }
    else{
      this.position.m = $output_area.rows;
    }

    if(n < 1){
      this.position.n = 1;
    }
    else if(n <= $output_area.cols){
      this.position.n = n;
    }
    else{
      this.position.n = $output_area.cols;
    }
  },

  savePosition: function(){
    this.saved_position.m = this.position.m;
    this.saved_position.n = this.position.n;
  },

  restorePosition: function(){
    this.position.m = this.saved_position.m;
    this.position.n = this.saved_position.n;
  }
};

var $character = {
  fontSize : 24,
  fontWidth : 12,
  fontHeight: 24,
  intensity: 10,
  italic : '',
  underline : '',
  blink : '',
  color : 7,
  backgroundColor : 0,
  image: 'positive',
  display: 'block',

  init: function(fontSize){
    this.fontSize = fontSize;
    this.fontWidth = fontSize / 2;
    this.fontHeight = fontSize;
  },

  setToDefault: function(){
    this.intensity = 10;
    this.italic = '';
    this.underline = '';
    this.blink = '';
    this.color = 7;
    this.backgroundColor = 0;
    this.image = 'positive';
    this.display = 'block';
  },

  setIntensityToBold: function(){
    this.intensity = 20;
  },

  setIntensityToNormal: function(){
    this.intensity = 10;
  },

  setIntensityToFaint: function(){
    this.intensity = 0
  },

  italicOn: function(){
    this.italic = 'italic';
  },

  italicOff: function(){
    this.italic = '';
  },

  underlineOn: function(){
    this.underline = 'underline';
  },

  underlineOff: function(){
    this.underline = '';
  },

  blinkOn: function(){
    this.blink = 'blink';
  },

  blinkOff: function(){
    this.blink = '';
  },

  setImagePositive: function(){
    this.image = 'positive';
  },

  setImageNegative: function(){
    this.image = 'negtive';
  },

  setVisibilityOn:function(){
    this.display = 'block';
  },

  setVisibilityOff:function(){
    this.display = 'none';
  },

  setColor: function(index){
    this.color = index;
  },

  setBackgroundColor: function(index){
    this.backgroundColor = index;
  },

  getProperty: function(pro){
    switch(pro){
      case 'display':
        return this.display;
      case 'font-style':
        return this.italic;
      case 'text-decoration':
          return this.underline + ' ' + this.blink;
      case 'color':
        if(this.color < 10){
          var index = this.intensity + (this.image == 'positive'
                                     ?  this.color
                                     :  this.backgroundColor);
          return colorTable[index];
        }
        else{
          return  this.image == 'positive'
                ? colorTable[20 + this.color % 10]
                : colorTable[20 + this.backgroundColor % 10];
        }
      case 'background-color':
        if(this.color < 10){
          var index = 10 + (this.image == 'positive'
                         ?  this.backgroundColor
                         :  this.color);
          return colorTable[index];
        }
        else{
          return  this.image == 'positive'
                ? colorTable[20 + this.backgroundColor % 10]
                : colorTable[20 + this.color % 10];
        }
    }
  },
};

var $garbage_span_collector = {
  coveredArea : [],

  initCoveredArea : function(){
    this.coveredArea.length = 0;
    for(var i = 0; i < 25; i++){
      this.coveredArea.push([]);
    }
  },

  interpretCoveredArea : function(){

    function combineRange(range1, range2){
      if(!range1.length){
        var tmp = [];
        tmp.push(range2)
        return tmp
      }

      var tmp = range1[range1.length -1];

      if(Math.abs(range2[1] - tmp[0]) -
         Math.abs(tmp[1] - tmp[0]) -
         Math.abs(range2[1] -range2[0]) <= 0){
        tmp[1] = range2[1];
        return range1.splice(range1.length - 1, 1, tmp);
      }
      else {
        range1.push(range2);
        return range1;
      }
    }

    for(var i=0; i<this.coveredArea.length; i++){
      if(this.coveredArea[i].length)
        this.coveredArea[i] = (this.coveredArea[i]).reduce(combineRange, []);
    }
  },

  setRange: function(m, range){
   // if(range[1]>81) range[1]=Infinity;
    this.coveredArea[m].push(range);
  },

  clearScreen: function(){
    this.interpretCoveredArea();
    var re = /m(\d+)n(\d+)n(\d+)/;

    with(FireBBS.output_area){
      for(var i = childNodes.length - 1; i >= 0 ; i--){
        if(childNodes[i].style.display == 'none'){
          removeChild(childNodes[i]);
          continue;
        }

        var result = re.exec(childNodes[i].id);
        if(!result) continue;
        ranges = this.coveredArea[result[1]];

        if(ranges.length){
          for(var j = 0; j < ranges.length; j++){
            if(ranges[j][0] <= result[2] &&
               ranges[j][1] >= result[3]){
              removeChild(childNodes[i]);
              break;
            }
          }
        }
      }
    }
    this.initCoveredArea();
  },
};