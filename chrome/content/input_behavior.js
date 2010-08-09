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

var isPreventDefault = false;//for events of keyboard & mouse

function key_map(e) {
//http://en.wikipedia.org/wiki/ASCII
//http://invisible-island.net/xterm/ctlseqs/ctlseqs.html#VT220-Style%20Function%20Keys
  if(isPreventDefault) {
    e.preventDefault();

    if(e.charCode) {

      if(!e.altKey && !e.ctrlKey) {//send printable characters
        FireBBS.sendData(String.fromCharCode(e.charCode))
      }else if(e.altKey && !e.ctrlKey) {
      }else if(!e.altKey && e.ctrlKey) {// send control characters

        if(e.charCode == 50) {
          FireBBS.sendData(String.fromCharCode(0))
        }else if(97 <= e.charCode && e.charCode <= 122) {
          //^C
          if(e.charCode == 99 && !window.getSelection().isCollapsed) {
            var copyText = window.getSelection().toString();
            FireBBS.input_area.focus();
            nsISupportsString.data = copyText;
            nsITransferable.setTransferData("text/unicode", nsISupportsString, copyText.length * 2);
            nsIClipboard.setData(nsITransferable, null, nsIClipboard.kGlobalClipboard);
          }else {
            FireBBS.sendData(String.fromCharCode(e.charCode - 96))
          }
        }else if(91 <= e.charCode && e.charCode <= 95) {
          FireBBS.sendData(String.fromCharCode(e.charCode - 64))
        }
        //Shift + ^C
        else if(e.charCode == 67 && e.shiftKey) {
          var ASCII = [FireBBS.output_area.firstChild, FireBBS.output_area.lastChild];
          if(!window.getSelection().isCollapsed) {
            ASCII = [window.getSelection().anchorNode.parentNode, window.getSelection().focusNode.parentNode]
          }
          FireBBS.input_area.focus();
          FireBBS.ASCII_cache = [];
          for(var i = ASCII[0];i != ASCII[1].nextSibling;i = i.nextSibling) {
            FireBBS.ASCII_cache.push(node2ASCII(i))
          }
          FireBBS.ASCII_cache.push("\u001b\u001b[m");
          FireBBS.ASCII_cache = FireBBS.ASCII_cache.join("");
          nsISupportsString.data = FireBBS.ASCII_cache;
          nsITransferable.setTransferData("text/unicode", nsISupportsString, FireBBS.ASCII_cache.length * 2);
          nsIClipboard.setData(nsITransferable, null, nsIClipboard.kGlobalClipboard)
        }
        //Shift + ^V
        else if(e.charCode == 86 && e.shiftKey &&
                nsIClipboard.hasDataMatchingFlavors(["text/unicode"], 1, nsIClipboard.kGlobalClipboard)) {
          nsIClipboard.getData(nsITransferable, nsIClipboard.kGlobalClipboard);
          var pasteStr = new Object;
          var pasteStrLength = new Object;
          nsITransferable.getTransferData("text/unicode", pasteStr, pasteStrLength);
          if(pasteStr) {
            var pasteText = pasteStr.value.QueryInterface(Ci.nsISupportsString).
                            data.substring(0, pasteStrLength.value / 2);
            FireBBS.sendData(pasteText)
          }
          nsIClipboard.emptyClipboard(nsIClipboard.kGlobalClipboard)
        }
      }else;
    }else {
      switch(e.keyCode) {
        case 8://BS
          FireBBS.sendData("\u0008");
          break;
        case 9://HT
          FireBBS.sendData("\t");
          break;
        case 13://CR
          FireBBS.sendData("\r");
          break;
        case 27://ESC
          FireBBS.sendData("\u001b");
          break;
        case 33://Page Up
          FireBBS.sendData("\u001b[5~");
          break;
        case 34://Page Down
          FireBBS.sendData("\u001b[6~");
          break;
        case 35://End
          FireBBS.sendData("\u001b[4~");
          break;
        case 36://Home
          FireBBS.sendData("\u001b[1~");
          break;
        case 37://Arrow Left
          FireBBS.sendData("\u001b[D");
          break;
        case 38://Arrow Up
          FireBBS.sendData("\u001b[A");
          break;
        case 39://Arrow Right
          FireBBS.sendData("\u001b[C");
          break;
        case 40://Arrow Down
          FireBBS.sendData("\u001b[B");
          break;
        case 45://Insert
          FireBBS.sendData("\u001b[2~");
          break;
        case 46://DEL
          FireBBS.sendData("\u001b[3~");
          //FireBBS.sendData('\x7F');
          break;
        case 112://Help ? About !
          if(nsIExtensionManager) {
            openDialog("chrome://mozapps/content/extensions/about.xul", "",
                       "chrome,centerscreen,modal",
                       "urn:mozilla:item:firebbs.l-hedgehog@hector.zhao",
                       nsIExtensionManager.datasource)
          }else {
            AddonManager.getAddonByID("firebbs.l-hedgehog@hector.zhao",
                                      function(addon) {
                                        openDialog("chrome://mozapps/content/extensions/about.xul", "",
                                                   "chrome,centerscreen,modal",
                                                   addon)
                                      })
          }
          break;
        default:
      }
    }
  }
}

function mouse_behavior(e) {
  if(isPreventDefault) {

    switch(e.type) {
      case "DOMMouseScroll":
        if(e.detail < 0) {
          if(!e.altKey) {
            FireBBS.sendData("\u001b[5~")
          }else {
            FireBBS.sendData("\u001b[A")
          }
        }else {
          if(!e.altKey) {
            FireBBS.sendData("\u001b[6~")
          }else {
            FireBBS.sendData("\u001b[B")
          }
        }
        e.preventDefault();
        break;
      case "contextmenu":
        if(window.getSelection().isCollapsed && e.target.tagName.toLowerCase() != "a") {
          FireBBS.sendData("\u001b[D");
          e.preventDefault()
        }
        break;
      case "click":
        switch(e.button) {
          case 0:
            if(e.target.tagName.toLowerCase() == "a") {
              //make anchors clickable
            }else {
              if(e.target == FireBBS.cursor) {
                FireBBS.sendData("\r")
              }else if(e.target.className == "terminal_display") {
                if(window.getSelection().isCollapsed) {
                  parsePTT(e.target)
                }
              }
              e.preventDefault();
            }
            break;
          default:
        }
        break;
      case "dblclick":
        break;
      case "mouseover":
        if(e.target.rel) {
          if(e.target.rel.toLowerCase() == "pic_preview") {
            FireBBS.float_box.style.display = "block";
            FireBBS.float_box.innerHTML = "<img src='" + e.target.href + "' onload='prePicResize(this)' />";
            e.target.addEventListener("mouseout", mouse_behavior, false);
            e.target.addEventListener("mousemove", mouse_behavior, false)
          }else if(e.target.rel.toLowerCase() == "ip2loc") {
            FireBBS.float_box.style.display = "block";
            var address = hzIPSearcher.location(e.target.textContent);
            FireBBS.float_box.innerHTML = "<span id='ip2loc'>" + address + "</span>";
            e.target.addEventListener("mouseout", mouse_behavior, false);
            e.target.addEventListener("mousemove", mouse_behavior, false)
          }
        }
        //fix bug while no mouseout event to hide img
        else if(e.target.tagName.toLowerCase() == "img" || e.target.id == "ip2loc") {
          FireBBS.float_box.style.display = "none"
        }
        break;
      case "mouseout":
        FireBBS.float_box.style.display = "none";
        e.target.removeEventListener("mousemove", mouse_behavior, false);
        e.target.removeEventListener("mouseout", mouse_behavior, false);
        break;
      case "mousemove":
        FireBBS.float_box.style.left = e.clientX + 18 + "px";
        if(e.clientY <= 300) {
          FireBBS.float_box.style.top = e.clientY + 9 + "px";
          FireBBS.float_box.style.bottom = "auto"
        }else {
          FireBBS.float_box.style.bottom = window.innerHeight - e.clientY + 9 + "px";
          FireBBS.float_box.style.top = "auto"
        }
        break;
      default:
    }
    if(window.getSelection().isCollapsed) {
      FireBBS.input_area.focus()
    }
  }
}

function parsePTT(target) {
  var reg_id = /m(\d+)n(\d+)n(\d+)/.exec(target.id);
  var m = parseInt(reg_id[1]);
  var n1 = parseInt(reg_id[2]);
  var n2 = parseInt(reg_id[3]);

  if(n1 <= 9 && n2 >= 11 && 10 <= m && m <= 22) {//menu
    var reg_func = /^\s+([A-Z])\)/.exec(target.textContent);
    if(reg_func) {
      FireBBS.sendData(reg_func[1] + "\r")
    }
  }
  if(n1 <= 2 && 3 <= m && m <= 23) {//list
    var reg_num = /^\s*(\d+)(?:\s|$)/.exec(target.textContent);
    if(reg_num) {
      if(target.textContent.indexOf(reg_num[1]) < 15) {
        FireBBS.sendData(reg_num[1] + "\r\r")
      }
    }
  }
}

function switchInputCapturer() {
  isPreventDefault = !isPreventDefault
}

function composition_start() {
  var pos = convertMN2XY($cursor.position);
  //try fix chewing
  if(FireBBS.input_area.style.opacity) {
    FireBBS.input_area.style.width = window.innerWidth - pos[0] - 30 + "px"
  }
  FireBBS.input_area.style.left = pos[0] + "px";
  FireBBS.input_area.style.top = pos[1] - 1 + "px"
}

function composition_end() {
  FireBBS.input_area.style.top = "-100px";
  FireBBS.sendData(FireBBS.input_area.value);
  FireBBS.input_area.value = ""
}

function prePicResize(img) {
  var imgWidth = parseFloat(document.defaultView.getComputedStyle(img, null).width);
  var imgHeight = parseFloat(document.defaultView.getComputedStyle(img, null).height);
  var scale = imgHeight / 300;
  if(scale > 1) {
    img.style.width = imgWidth / scale + "px";
    img.style.height = imgHeight / scale + "px"
  }
}

function node2ASCII(node) {
  var style = node.style;
  if(!style.color) {
    return ""
  }
  var color = [];
  for(var i = 0;i < colorTable.length;i++) {
    if(hexColor(style.color) == colorTable[i]) {
      color[0] = i > 9 ? i : i + 30
    }
    if(hexColor(style.backgroundColor) == colorTable[i]) {
      color[1] = i
    }
    if(color[0] && color[1]) {
      break
    }
  }
  var lineStart = /m(\d+)n(\d+)n(\d+)/.exec(node.id)[2] == "1";
  if(lineStart) {
    FireBBS.previous_node = [0, false, false, 10, 7]
  }
  var s = ["\u001b\u001b["];
  var intensity = Math.floor(color[0] / 10) - 1;
  if(intensity != FireBBS.previous_node[0]) {
    s.push(intensity);
    s.push(";");
    FireBBS.previous_node[0] = intensity;
    if(!intensity) {
      FireBBS.previous_node = [0, false, false, 10, 7]
    }
  }
  var underline = style.textDecoration.search("underline") != -1;
  if(underline != FireBBS.previous_node[1]) {
    s.push(underline ? "4" : "24");
    s.push(";");
    FireBBS.previous_node[1] = underline
  }
  var blink = style.textDecoration.search("blink") != -1;
  if(blink != FireBBS.previous_node[2]) {
    s.push(blink ? "5" : "25");
    s.push(";");
    FireBBS.previous_node[2] = blink
  }
  if(color[1] != FireBBS.previous_node[3]) {
    s.push(40 + color[1] % 10);
    s.push(";");
    FireBBS.previous_node[3] = color[1]
  }
  color[0] = color[0] % 10;
  if(color[0] != FireBBS.previous_node[4]) {
    s.push(30 + color[0]);
    s.push(";");
    FireBBS.previous_node[4] = color[0]
  }
  var latest = s.length - 1;
  s[latest] = "m";
  var text = node.innerHTML.replace(/<.+?>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  if(style.textIndent) {
    s = ["\u001b[D"].concat(s, ["\u001b[C"]);
    text = text.substr(1)
  }
  if(s.length == 1) {
    s = []
  }
  s.push(text);
  return [(lineStart && FireBBS.ASCII_cache.length ? "\u001b\u001b[m\r" : "")].concat(s).join("")
}
