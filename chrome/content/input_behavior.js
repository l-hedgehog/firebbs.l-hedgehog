var isPreventDefault = false;//for events of keyboard & mouse
var IME = [];

function key_map(e){
//http://en.wikipedia.org/wiki/ASCII
//http://invisible-island.net/xterm/ctlseqs/ctlseqs.html#VT220-Style%20Function%20Keys
  if(isPreventDefault){
    e.preventDefault();

    if(e.charCode){

      if(!e.altKey && !e.ctrlKey){//send printable characters
        FireBBS.sendData(String.fromCharCode(e.charCode));
      }
      else if(e.altKey && !e.ctrlKey){
      }
      else if(!e.altKey && e.ctrlKey){// send control characters

        if(e.charCode == 0x32){
          FireBBS.sendData(String.fromCharCode(0x00));
        }
        else if(0x61 <= e.charCode && e.charCode <= 0x7A){
          //^C
          if(e.charCode == 0x63&&!window.getSelection().isCollapsed){
            var copyText = window.getSelection().toString();
            clipStr.data = copyText;
            clipTrans.setTransferData("text/unicode", clipStr, copyText.length * 2);
            clip.setData(clipTrans, null, clip.kGlobalClipboard);
          }
          //^V but cannot empty the clipboard ...
          else if(e.charCode == 0x76&&false){
            clip.emptyClipboard(clip.kGlobalClipboard);
          }
          else {
            FireBBS.sendData(String.fromCharCode(e.charCode - 0x60));
          }
        }
        else if(0x5B <= e.charCode && e.charCode <= 0x5F){
          FireBBS.sendData(String.fromCharCode(e.charCode - 0x40));
        }
      }
      else{}
    }
    else{
      switch(e.keyCode){
        case 8://BS
          FireBBS.sendData('\x08');
          break;
        case 9://HT
          FireBBS.sendData('\x09');
          break;
        case 13://CR
          FireBBS.sendData('\x0D');
          break;
        case 27://ESC
          FireBBS.sendData('\x1B');
          break;
        case 33://Page Up
          FireBBS.sendData('\x1B[5~');
          break;
        case 34://Page Down
          FireBBS.sendData('\x1B[6~');
          break;
        case 35://End
          FireBBS.sendData('\x1B[4~');
          break;
        case 36://Home
          FireBBS.sendData('\x1B[1~');
          break;
        case 37://Arrow Left
          FireBBS.sendData('\x1B[D');
          break;
        case 38://Arrow Up
          FireBBS.sendData('\x1B[A');
          break;
        case 39://Arrow Right
          FireBBS.sendData('\x1B[C');
          break;
        case 40://Arrow Down
          FireBBS.sendData('\x1B[B');
          break;
        case 45://Insert
          FireBBS.sendData('\x1B[2~');
          break;
        case 46://DEL
          FireBBS.sendData('\x1B[3~');
          //FireBBS.sendData('\x7F');
          break;
        case 112:
          break;
        default:
      }
    }
  }
}

function mouse_behavior(e){
  if(isPreventDefault){

    switch(e.type){
      case 'DOMMouseScroll':
        if(e.detail < 0){
          if(!e.altKey)
            FireBBS.sendData('\x1B[5~');
          else
            FireBBS.sendData('\x1B[A');
        }
        else{
          if(!e.altKey)
            FireBBS.sendData('\x1B[6~');
          else
            FireBBS.sendData('\x1B[B');
        }
        e.preventDefault();
        break;
      case 'contextmenu':
        if(window.getSelection().isCollapsed && (e.target.tagName.toLowerCase() != 'a')){
          FireBBS.sendData('\x1B[D');
          e.preventDefault();
        }
        break;
      case 'click':
        switch(e.button){
          case 0:
            if(e.target.tagName.toLowerCase() == 'a'){
              //make anchors clickable
            }

            else {
              if(e.target == FireBBS.cursor){
                FireBBS.sendData('\r');
              }

              else if(e.target.className == 'terminal_display'){
                if(window.getSelection().isCollapsed){
                  parsePTT(e.target);
                }
              }
              e.preventDefault();
            }
            break;
          default:
        }
        break;
      case 'dblclick':
        break;
      case 'mouseover':
        if(e.target.rel){
          if(e.target.rel.toLowerCase() == "pic_preview"){
            FireBBS.float_box.style.display = "block";
            FireBBS.float_box.innerHTML="<img src='" + e.target.href + "' onload='prePicResize(this)' />"
            e.target.addEventListener('mouseout', mouse_behavior, false);
            e.target.addEventListener('mousemove', mouse_behavior, false);
          }
          //else if(e.target.rel.toLowerCase() == "ip2loc"){
          //  FireBBS.float_box.style.display = "block";
          //  FireBBS.float_box.innerHTML="<iframe src='chrome://firebbs/content/iploc.html?ip=" + e.target.textContent + "' scrolling='no' />"
          //  e.target.addEventListener('mouseout', mouse_behavior, false);
          //  e.target.addEventListener('mousemove', mouse_behavior, false);
          //}
        }
        //fix bug while no mouseout event to hide img
        else if(e.target.tagName.toLowerCase() == "img"||e.target.tagName.toLowerCase() == "iframe"){
          FireBBS.float_box.style.display = "none";
        }
        break;
      case 'mouseout':
        FireBBS.float_box.style.display = "none";
        e.target.removeEventListener('mousemove', mouse_behavior, false);
        e.target.removeEventListener('mouseout', mouse_behavior, false);
        break;
      case 'mousemove':
        FireBBS.float_box.style.left = (e.clientX + 18) + "px";
        if(e.clientY <= 300){
          FireBBS.float_box.style.top = (e.clientY + 9) + "px";
          FireBBS.float_box.style.bottom = "auto";
        }
        else {
          FireBBS.float_box.style.bottom = (window.innerHeight - e.clientY + 9) + "px";
          FireBBS.float_box.style.top = "auto";
        }
        break;
      default:
    }
  }
}

function parsePTT(target){
  var reg_id = /m(\d+)n(\d+)n(\d+)/.exec(target.id);
  var m = parseInt(reg_id[1]);
  var n1 = parseInt(reg_id[2]);
  var n2 = parseInt(reg_id[3]);

  if(n1 <= 9 && n2 >= 11 && 10 <= m && m <= 22){//menu
    var reg_func = /^\s+([A-Z])\)/.exec(target.textContent);
    if(reg_func){
      FireBBS.sendData(reg_func[1] + '\r');
    }
  }
  if(n1 <= 2 && 3 <= m && m <= 23){//list
    var reg_num = /^\s*(\d+)(?:\s|$)/.exec(target.textContent)
    if(reg_num){
      if(target.textContent.indexOf(reg_num[1]) < 15)
        FireBBS.sendData(reg_num[1] + '\r\r');
    }
  }


}

function switchInputCapturer(){
  isPreventDefault = !isPreventDefault;
}

function key_down(e){
  if(isPreventDefault){
    e.preventDefault();

    if(e.ctrlKey){
      window.addEventListener('keyup', key_up, false);
    }
    else if(e.keyCode==112){
      var extensionManager =
        Cc["@mozilla.org/extensions/manager;1"].
        getService(Ci.nsIExtensionManager);
      openDialog("chrome://mozapps/content/extensions/about.xul", "",
                 "chrome,centerscreen,modal",
                 "urn:mozilla:item:firebbs.l-hedgehog@hector.zhao",
                 extensionManager.datasource);
    }
    else if(e.keyCode==113){
      clipStr.data = FireBBS.ASCII_cache;
      clipTrans.setTransferData("text/unicode", clipStr, FireBBS.ASCII_cache.length * 2);
      clip.setData(clipTrans, null, clip.kGlobalClipboard);
    }
    else if(e.keyCode==114&&clip.hasDataMatchingFlavors(["text/unicode"], 1, clip.kGlobalClipboard)){
      clip.getData(clipTrans, clip.kGlobalClipboard);
      var pasteStr = new Object();
      var pasteStrLength = new Object();
      clipTrans.getTransferData("text/unicode", pasteStr, pasteStrLength);
      if(pasteStr){
        var pasteText = pasteStr.value.QueryInterface(Ci.nsISupportsString).
                        data.substring(0, pasteStrLength.value / 2);
        FireBBS.sendData(pasteText);
      }
    }
    else if(e.keyCode==115){
      var str = {out: null};
      var dialog = openDialog("chrome://firebbs/content/input.xul",
                              "firebbsDialog", "chrome,centerscreen,modal", str);
      if(str.out != ''){
        FireBBS.sendData(str.out);
      }
    }
  }
}

function key_up(e){
  if(isPreventDefault){
    e.preventDefault();

    if(IME.length==0){
      IME.push(e.keyCode);
      return;
    }
    if(IME.pop()==(49-e.keyCode)){//Ctrl+Space
      if(e.keyCode==17||e.keyCode==32){
        var str = window.prompt(locale("IMEPrompt"));
        if(str != ''){
          FireBBS.sendData(str);
        }
      }
    }
    window.removeEventListener('keyup', key_up, false);
  }
}

function prePicResize(img){
  var imgWidth = parseFloat(document.defaultView.getComputedStyle(img,null).width);
  var imgHeight = parseFloat(document.defaultView.getComputedStyle(img,null).height);
  var scale = imgHeight / 300;
  if(scale>1){
    img.style.width = (imgWidth / scale) + "px";
    img.style.height = (imgHeight / scale) + "px";
  }
}
