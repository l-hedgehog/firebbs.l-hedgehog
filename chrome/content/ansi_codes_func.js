/* ***** BEGIN COPYRIGHT AND LICENSE BLOCK *****
 *
 * Copyright © 2007 Milx
 * Copyright © 2008, 2009 Hector Zhao
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

//http://invisible-island.net/xterm/ctlseqs/ctlseqs.html

function parameterConverter1(element){
//convering '' to 1 and String to parseInt(String)
  return element ? parseInt(element) : 1;
}

function parameterConverter0(element){
//convering '' to 0 and String to parseInt(String)
  return element ? parseInt(element) : 0;
}

//Functions using CSI , ordered by the final character(s)
//*******************************************start

//CSI P s @
function ICH(P){//Insert P s (Blank) Character(s) (default = 1) (ICH)
  P = P.map(parameterConverter1);
}
//CSI P s A
function CUU(P){//Cursor Up P s Times (default = 1) (CUU)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m - P[0], $cursor.position.n);
}
//CSI P s B
function CUD(P){//Cursor Down P s Times (default = 1) (CUD)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m + P[0], $cursor.position.n);
}
//CSI P s C
function CUF(P){//Cursor Forward P s Times (default = 1) (CUF)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m, $cursor.position.n + P[0]);
}
//CSI P s D
function CUB(P){//Cursor Backward P s Times (default = 1) (CUB)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m, $cursor.position.n - P[0]);
}
//CSI P s E
function CNL(P){//Cursor Next Line P s Times (default = 1) (CNL)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m + P[0], 1);
}
//CSI P s F
function CPL(P){//Cursor Preceding Line P s Times (default = 1) (CPL)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m - P[0], 1);
}
//CSI P s G
function CHA(P){//Cursor Character Absolute [column] (default = [row,1]) (CHA)
  P = P.map(parameterConverter1);
  $cursor.setPosition($cursor.position.m,  P[0]);
}
//CSI Ps ; Ps H
function CUP(P){//Cursor Position [row;column] (default = [1,1]) (CUP)
  P = P.map(parameterConverter1);
  if(P.length == 1) P.push(1);
  $cursor.setPosition(P[0], P[1]);
}
//CSI P s I
function CHT(P){//Cursor Forward Tabulation P s tab stops (default = 1) (CHT)
  P = P.map(parameterConverter1);
}
//CSI P s J
function ED(P){//Erase in Display (ED)
  P = P.map(parameterConverter0);
  //var re = /m(\d+)n(\d+)/;
  var re = /^m(\d+)/;

  if((P[0] == 0 && $cursor.position.m == 1) ||
     (P[0] == 1 && $cursor.position.m == $output_area.rows))
    P[0] = 2;

  with(FireBBS.output_area){
    switch(P[0]){
      case 0://Erase Below (default)
        for(var i = childNodes.length - 1; i >= 0 ; i--){
          var result = re.exec(childNodes[i].id);
          if(!result) continue;
          if(parseInt(result[1]) >= $cursor.position.m)
            removeChild(childNodes[i]);
        }
        break;
      case 1://Erase Above
        for(var i = childNodes.length - 1; i >= 0 ; i--){
          var result = re.exec(childNodes[i].id);
          if(!result) continue;
          if(parseInt(result[1]) <= $cursor.position.m)
            removeChild(childNodes[i]);
        }
        break;
      case 2://Erase All
        innerHTML = '';
        break;
      case 3://Erase Saved Lines (xterm)
      break;
      default:
    }
  }
}
//CSI ? P s J
function DECSED(P){//Erase in Display (DECSED)
  P = P.map(parameterConverter0);
}
// CSI P s K
function EL(P){//Erase in Line (EL)
  P = P.map(parameterConverter0);
  var re = /m(\d+)n(\d+)/;

  with(FireBBS.output_area){
    switch(P[0]){
      case 0://Erase to Right (default)
        FireBBS.HTMLString_cache += generate_black_span($cursor.position, 80 - $cursor.position.n + 1);
        break;
      case 1://Erase to Left
        FireBBS.HTMLString_cache += generate_black_span({m: 1, n: 1}, $cursor.position.n);
        break;
      case 2://Erase All
        for(var i = childNodes.length - 1; i >= 0 ; i--){
          var result = re.exec(childNodes[i].id);
          if(!result) continue;
          if(parseInt(result[1]) == $cursor.position.m)
            removeChild(childNodes[i]);
        }
        break;
      default:
    }
  }
}
// CSI ? P s K
function DECSEL(P){//Erase in Line (DECSEL)
  P = P.map(parameterConverter0);
}
// CSI P s L
function IL(P){//Insert P s Line(s) (default = 1) (IL)
  P = P.map(parameterConverter1);
  var re = /^m(\d+)/;

  with(FireBBS.output_area){
    switch($cursor.position.m){
      case $output_area.rows:
        for(var i=0; i < childNodes.length; i++){//move span's positions
          var result = re.exec(childNodes[i].id);
          if(!result) continue;
          if(parseInt(result[1]) - P[0] < 1 ) {//
            childNodes[i].style.display = 'none';
          }
          else{
            childNodes[i].id = (childNodes[i].id).replace(result[0], 'm' + (parseInt(result[1]) - P[0]));
            childNodes[i].style.top = (childNodes[i].offsetTop - $character.fontHeight * P[0]) + 'px';
          }
        }
        break
      default:
        for(var i=0; i < childNodes.length; i++){//move span's positions
          var result = re.exec(childNodes[i].id);
          if(!result) continue;
          if(parseInt(result[1]) + P[0] >  $output_area.rows) {//
            childNodes[i].style.display = 'none';
          }
          else{
            if($cursor.position.m <= parseInt(result[1])){
              childNodes[i].id = (childNodes[i].id).replace(result[0], 'm' + (parseInt(result[1]) + P[0]));
              childNodes[i].style.top = (childNodes[i].offsetTop + $character.fontHeight * P[0]) + 'px';
            }
          }

        }
    }

  }
}
// CSI P s M
function DL(P){//Delete P s Line(s) (default = 1) (DL)
  P = P.map(parameterConverter1);
}
// CSI P s P
function DCH(P){//Delete P s Character(s) (default = 1) (DCH)
  P = P.map(parameterConverter1);
}
// CSI P s S
function SU(P){//Scroll up P s lines (default = 1) (SU)
}
// CSI P s T
function SD(P){//Scroll down P s lines (default = 1) (SD)
}
// CSI P s X
function ECH(P){//Erase P s Character(s) (default = 1) (ECH)
  P = P.map(parameterConverter1);
}
// CSI P s Z
function CBT(P){//Cursor Backward Tabulation P s tab stops (default = 1) (CBT)
  P = P.map(parameterConverter1);
}
// CSI P m `
function HPA(P){//Character Position Absolute [column] (default = [row,1]) (HPA)
  P = P.map(parameterConverter1);
}
// CSI P s b
function REP(P){//Repeat the preceding graphic character P s times (REP)
}
// CSI P s c
function Primary_DA(P){//Send Device Attributes (Primary DA)
  P = P.map(parameterConverter0);
}
// CSI > P s c
function Secondary_DA(P){//Send Device Attributes (Secondary DA)
  P = P.map(parameterConverter0);
}
// CSI P m d
function VPA(P){//Line Position Absolute [row] (default = [1,column]) (VPA)
  P = P.map(parameterConverter1);
}
// CSI P s ; Ps f
function HVP(P){//Horizontal and Vertical Position [row;column] (default = [1,1]) (HVP)
  CUP(P);
}
// CSI P s g
function TBC(P){//Tab Clear (TBC)
}
// CSI P m h
function SM(P){//Set Mode (SM)
}
// CSI ? P m h
function DECSET(P){//DEC Private Mode Set (DECSET)
}
// CSI P m i
function MC(P){//Media Copy (MC)
}
// CSI ? P m i
function MC_and_DECspecific(P){//Media Copy (MC, DEC-specific)
}
// CSI P m l
function RM(P){//Reset Mode (RM)
}
// CSI ? P m l
function DECRST(P){//DEC Private Mode Reset (DECRST)
}
// CSI P m m
function SGR(P){//Character Attributes (SGR)
  P = P.map(parameterConverter0);

  for(var i = 0; i < P.length; i++){
    if(P[i] < 10){
      switch(P[i]){
        case 0:
          $character.setToDefault();
          break;
        case 1:
          $character.setIntensityToBold();
          break;
        case 2:
          $character.setIntensityToFaint();
          break;
        case 3:
          $character.italicOn();
          break;
        case 4:
          $character.underlineOn();
          break;
        case 5:
          $character.blinkOn();
          break;
        case 7:
          $character.setImageNegative();
          break;
        case 8:
          $character.setVisibilityOff();
          break;
      }
    }
    else if(P[i] < 30){
      switch(P[i]){
        case 22:
          $character.setIntensityToNormal();
          break;
        case 24:
          $character.underlineOff();
          break;
        case 25:
          $character.blinkOff();
          break;
        case 27:
          $character.setImagePositive();
          break;
        case 28:
          $character.setVisibilityOn();
          break;
      }
    }
    else if(P[i] < 40){
      $character.setColor(P[i] % 10);
    }
    else if(P[i] < 50){
      $character.setBackgroundColor(P[i] % 10);
    }
    else if(P[i] < 100){
      $character.setColor(P[i]);
    }
    else if(P[i] < 110){
      $character.setBackgroundColor(P[i]);
    }
    else{
    }
  }
}
// CSI P s n
function DSR(P){//Device Status Report (DSR)
}
// CSI ? P s n
function DSR_and_DECspecific(P){//Device Status Report (DSR, DEC-specific)
}
// CSI ! p
function DECSTR(){//Soft terminal reset (DECSTR)
}
// CSI P s ; Ps ¨ p
function DECSCL(){//Set conformance level (DECSCL)
}
// CSI P s ¨ q
function DECSCA(P){//Select character protection attribute (DECSCA).
}
// CSI P s ; P s r
function DECSTBM(P){//Set Scrolling Region [top;bottom] (default = full size of window) (DECSTBM)
  $scrolling_region.setRegion(parseInt(P[0]), parseInt(P[1]));
}
// CSI P t ; P l; P b ; P r ; P s $ r
function DECCARA(){//Change Attributes in Rectangular Area (DECCARA)
}
// CSI s
function SCP(){//Save cursor (ANSI.SYS)
  $cursor.savePosition();
}
// CSI P t ; P l ; P b ; P r ; P s $ t
function DECRARA(){//Reverse Attributes in Rectangular Area (DECRARA).
}
// CSI u
function RCP(){//Save cursor (ANSI.SYS)
  $cursor.restorePosition();
}
// CSI P t ; P l; P b ; P r ; P p ; P t ; P l ; P p $ v
function DECCRA(){//Copy Rectangular Area (DECCRA)
}
// CSI P t ; P l ; P b ; P r ˇ w
function DECEFR(){//Enable Filter Rectangle (DECEFR)
}
// CSI P s x
function DECREQTPARM(){//Request Terminal Parameters (DECREQTPARM)
}
// CSI P s x
function DECSACE(){//Select Attribute Change Extent (DECSACE).
}
// CSI P c ; P t ; P l ; P b ; P r $ x
function DECFRA(){//Fill Rectangular Area (DECFRA).
}
// CSI P s ; P u ˇ z
function DECELR(){//Enable Locator Reporting (DECELR)
}
// CSI P t ; P l ; P b ; P r $ z
function DECERA(){//Erase Rectangular Area (DECERA).
}
// CSI P m ˇ {
function DECSLE(){//Select Locator Events (DECSLE)
}
// CSI P t ; P l ; P b ; P r $ {
function DECSERA(){//Selective Erase Rectangular Area (DECSERA).
}
// CSI P s ˇ |
function DECRQLP(){//Request Locator Position (DECRQLP)
}
//*******************************************end

function CSIFunctionHandler(which, P){
  if(which == 'm'){
    SGR(P);
  }
  else{
    switch(which){
      case 'A' :
        CUU(P);
        break;
      case 'B' :
        CUD(P);
        break;
      case 'C' :
        CUF(P);
        break;
      case 'D' :
        CUB(P);
        break;
      case 'E' :
        CNL(P);
        break;
      case 'F' :
        CPL(P);
        break;
      case 'G' :
        CHA(P);
        break;
      case 'H' :
        CUP(P);
        break;
      case 'J' :
        ED(P);
        break;
      case 'K' :
        EL(P);
        break;
      case 'L' :
        IL(P);
        break;
      case 'f' :
        HVP(P);
        break;
      case 'r' :
        DECSTBM(P);
        break;
      case 's' :
        SCP();
        break;
      case 'u' :
        RCP();
        break;
      default:
    }
  }
}

//Controls beginning with ESC
//**************************Start
//ESC 7
function DECSC(){//Save Cursor (DECSC)
  SCP();
}
//ESC 8
function DECRC(){//Restore Cursor (DECRC)
  RCP();
}
//Esc D
function IND(){//Move/scroll window up one line(IND)
  var re = /^m(\d+)/;
  
  with(FireBBS.output_area){
    for(var i = 0; i < childNodes.length; i++){//move span's positions
      var result = re.exec(childNodes[i].id);
      if(!result) continue;
      
      var m = parseInt(result[1]);
      if(m < $scrolling_region.top || m > $scrolling_region.bottom)
        continue;
        
      if(m == $scrolling_region.top) {//
        childNodes[i].style.display = 'none';
      }
      else{
        childNodes[i].id = (childNodes[i].id).replace(result[0], 'm' + (m - 1));
        childNodes[i].style.top = (childNodes[i].offsetTop - $character.fontHeight) + 'px';
      }
    }
  }
  

}
//Esc M
function RI(){//Move/scroll window down one line (RI)
  var re = /^m(\d+)/;

  with(FireBBS.output_area){
    for(var i=0; i < childNodes.length; i++){//move span's positions
      var result = re.exec(childNodes[i].id);
      if(!result) continue;
      
      var m = parseInt(result[1]);
      if(m < $scrolling_region.top || m > $scrolling_region.bottom)
        continue;
      
      if(m == $scrolling_region.bottom) {//
        childNodes[i].style.display = 'none';
      }else{
        childNodes[i].id = (childNodes[i].id).replace(result[0], 'm' + (m + 1));
        childNodes[i].style.top = (childNodes[i].offsetTop + $character.fontHeight) + 'px';

      }
    }
  }
  

  
}
//Esc E
function NEL(){//Move to next line(NEL )
}
//***********************End

//Single-character functions
//**********************Start

//BEL
function BEL(){
  nsIAlertsService.showAlertNotification("chrome://firebbs/skin/firebbs.png", 
                                      locale("alerts"), locale("newMessage"));
  if(prefs.getCharPref('sound')) {
    nsISound.play(nsIIOService.newURI(prefs.getCharPref('sound'), null, null));  
  } else {
    nsISound.playSystemSound("_moz_mailbeep");
  }
}
//LF(Line Feed)
function LF(){
  //if($cursor.position.m == $output_area.rows){
  if($cursor.position.m == $scrolling_region.bottom){
    IND([1]);
  }
  else{
    CUD([1]);
  }
}
