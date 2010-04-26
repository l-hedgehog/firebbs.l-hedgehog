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

const Cc = Components.classes;
const Ci = Components.interfaces;

var strBundle =
      Cc["@mozilla.org/intl/stringbundle;1"].
        getService(Ci.nsIStringBundleService).
        createBundle("chrome://firebbs/locale/firebbs.properties");
var prefs =
      Cc["@mozilla.org/preferences-service;1"].
        getService(Ci.nsIPrefService).
        getBranch("extensions.firebbs.");
var bcDBCS = 
      prefs.getBoolPref("experiment.bicolorDBCS");

var nsISocketTransportService =
      Cc["@mozilla.org/network/socket-transport-service;1"].
        getService(Ci.nsISocketTransportService);
var nsIInputStreamPump =
      Cc["@mozilla.org/network/input-stream-pump;1"].
        createInstance(Ci.nsIInputStreamPump);

if(bcDBCS) {
  var nsIBinaryInputStream =
      Cc["@mozilla.org/binaryinputstream;1"].
        createInstance(Ci.nsIBinaryInputStream);
  var nsIScriptableUnicodeConverter =
      Cc["@mozilla.org/intl/scriptableunicodeconverter"].
        createInstance(Ci.nsIScriptableUnicodeConverter);
}else {
  var nsIConverterInputStream =
      Cc["@mozilla.org/intl/converter-input-stream;1"].
        createInstance(Ci.nsIConverterInputStream);
  var nsIConverterOutputStream =
      Cc["@mozilla.org/intl/converter-output-stream;1"].
        createInstance(Ci.nsIConverterOutputStream);
}

var nsIClipboard =
      Cc["@mozilla.org/widget/clipboard;1"].
        getService(Ci.nsIClipboard);
var nsISupportsString =
      Cc["@mozilla.org/supports-string;1"].
        createInstance(Ci.nsISupportsString);
var nsITransferable =
      Cc["@mozilla.org/widget/transferable;1"].
        createInstance(Ci.nsITransferable);
nsITransferable.addDataFlavor("text/unicode");

var nsIAlertsService =
      Cc["@mozilla.org/alerts-service;1"].
        getService(Ci.nsIAlertsService);
var nsISound =
      Cc["@mozilla.org/sound;1"].
        getService(Ci.nsISound);
var nsIIOService =
      Cc["@mozilla.org/network/io-service;1"].
        getService(Ci.nsIIOService);

var nsIExtensionManager =
      Cc["@mozilla.org/extensions/manager;1"].
        getService(Ci.nsIExtensionManager);

var hzIPSearcher = null;
if(prefs.getBoolPref("ipsearcher")) {
  try {
    hzIPSearcher = 
      Cc["@hector.zhao/ipsearcher-service;2"].
        getService(Ci.hzIIPSearcherService);
    hzIPSearcher.init()
  }catch(e) {
    prefs.setBoolPref("ipsearcher", false);
    hzIPSearcher = null
  }
}

var FireBBS = {
  cursor:           null,
  output_area:      null,
  input_area:       null,
  float_box:        null,
  outputStream:     null,
  inputStream:      null,
  HTMLString_cache: [],
  ASCII_cache:      [],
  previous_node:    null,

  dataListener: {
    data:    {},
    restStr: '',

    onStartRequest: function(request, context) {
    },

    onStopRequest: function(request, context, status) {
      try {
        FireBBS.stop()
      }catch(e) {
        return
      }
    },

    onDataAvailable: function(request, context, inputStream, offset, count) {
      if(bcDBCS) {
        this.data.value = nsIBinaryInputStream.readBytes(nsIBinaryInputStream.available());
        $character.setLead(0)
      }else {
        nsIConverterInputStream.readString(65535, this.data)
      }
      var str = this.restStr + this.data.value;
      this.restStr = "";
      if(str == "\u0007") {
        this.restStr = str;
        $bel_msg.init();
        return
      }
      var belMsg = false;
      if(!str.search(/\x07/)) {
        belMsg = /[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d+(\x1b\[1;44;37m)?\s(\x1b\[32m)?\d{2}:\d{2}/.test(str)
      }

      str = str.replace(/\x07/g, "\u001b\u0007");//escape BEL
      str = str.replace(/[\b]/g, "\u001b[1D");//escape BS(replace )
      str = str.replace(/\t/g, "\u001b[8C");//escape HT(replace )
      str = str.replace(/\n/g, "\u001b\n");//escape LF
      str = str.replace(/\v/g, "\u001b[6B");//escape VT(replace )
      str = str.replace(/\f/g, "\u001b[2J\u001b[H");//escape FF(replace )
      str = str.replace(/\r/g, "\u001b[1G");//escape CR(replace )

      var strArray = str.split("\u001b");
      FireBBS.HTMLString_cache.push(generate_span(strArray[0]));

      for(var i = 1;i < strArray.length;i++) {
        switch(strArray[i][0]) {
          case "["://Functions using CSI
            var template = /^\x5B((?:|\d+|;)+)([\x40-\x5A\x60-\x7C])/;//Functions using CSI
            var result = template.exec(strArray[i]);

            if(result) {
              CSIFunctionHandler(result[2], result[1].split(";"));
              var span = generate_span(strArray[i].substr(result[0].length));
              FireBBS.HTMLString_cache.push(span)
            }else {
              if(i == strArray.length - 1) {//this is an unfinished data message
                this.restStr = "\u001b" + strArray[i]
              }else;
            }
            break;

          case "\u0007":
            BEL(belMsg);
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;
          case "\n":
            LF();
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;

          case "D":
            IND();
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;
          case "M":
            RI();
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;
          case "E":
            NEL();
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;
          case "7":
            DECSC();
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;
          case "8":
            DECRC();
            FireBBS.HTMLString_cache.push(generate_span(strArray[i].substr(1)));
            break;
          default:
            if(i == strArray.length - 1) {//this is an unfinished data message
              this.restStr = "\u001b" + strArray[i]
            }else;
        }
      }

      $garbage_span_collector.clearScreen();
      FireBBS.output_area.innerHTML += FireBBS.HTMLString_cache.join("");
      FireBBS.HTMLString_cache = [];
      FireBBS.relocateCursor()
    }
  },

  init: function() {
    var transport = nsISocketTransportService.
          createTransport(null, 0,
                          document.location.hostname == "firebbs" ? "bbs.pku.edu.cn" : document.location.hostname,
                          document.location.port ? document.location.port : 23,
                          null);
    var options = document.location.search;
    var bgColor = /bgcolor\x3D(\w+)/.exec(options);
    var charset = /charset\x3D(\w+)/.exec(options)
                ? /charset\x3D(\w+)/.exec(options)[1]
                : prefs.getComplexValue("charset", Ci.nsIPrefLocalizedString).data;
    var fontSize = /fontsize\x3D(\d+)/.exec(options);
    var fontFamily = /fontfamily\x3D((?:%|\w)+)/.exec(options);
    var terminal_display_class;
    
    for(var i = 0;i < document.styleSheets[0].cssRules.length;i++) {
      if(document.styleSheets[0].cssRules[i].selectorText == ".terminal_display") {
        terminal_display_class = document.styleSheets[0].cssRules[i]
      }
    }

    this.outputStream = transport.openOutputStream(0, 0, 0);
    this.inputStream = transport.openInputStream(0, 0, 0);
    if(bcDBCS) {
      nsIBinaryInputStream.setInputStream(this.inputStream);
      nsIScriptableUnicodeConverter.charset = charset
    }else {
      const REPLACEMENT_CHARACTER = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
      nsIConverterInputStream.init(this.inputStream, charset, 65535, REPLACEMENT_CHARACTER);
      nsIConverterOutputStream.init(this.outputStream, charset, 65535, REPLACEMENT_CHARACTER);
    }

    nsIInputStreamPump.init(this.inputStream, -1, -1, 0, 0, false);
    nsIInputStreamPump.asyncRead(this.dataListener, null);

    this.cursor = document.getElementById("cursor");
    this.output_area = document.getElementById("output_area");
    this.input_area = document.getElementById("input_area");
    this.float_box = document.getElementById("float_box");
    this.previous_node = [0, false, false, 10, 7];
    $anti_idler.init(prefs.getIntPref("idledelay"));
    
    //document.title = document.location.host;
    $garbage_span_collector.initCoveredArea();

    bgColor = bgColor
            ? bgColor[1]
            : prefs.getCharPref("bgcolor");
    bgColor = hexColor(bgColor);
    document.body.style.backgroundColor = bgColor;
    for(var i = 0;i < colorTable.length;i++) {
      if(bgColor == colorTable[i]) {
        colorTable[i] = "black";
        break
      }
    }
    colorTable[0] = bgColor;
    colorTable[10] = bgColor;

    fontFamily = fontFamily
               ? decodeURIComponent(fontFamily[1])
               : prefs.getComplexValue("fontfamily", Ci.nsIPrefLocalizedString).data;
    terminal_display_class.style.fontFamily = fontFamily + ",monospace";

    fontSize = fontSize
             ? fontSize[1]
             : prefs.getIntPref("fontsize");
    fontSize = parseInt(fontSize, 10);
    fontSize += fontSize % 2;
    terminal_display_class.style.fontSize = fontSize + "px";
    terminal_display_class.style.lineHeight = fontSize + "px";
    $character.init(fontSize);
    this.output_area.style.width = $character.fontWidth * $output_area.cols + "px";
    this.output_area.style.height = $character.fontHeight * $output_area.rows + "px"

    //try fix chewing
    if(charset=="big5") {
      this.input_area.style.background = "-moz-linear-gradient(left center, " + bgColor + ", transparent, transparent)";
      this.input_area.style.border = "0px none";
      this.input_area.style.color = "silver";
      this.input_area.style.fontSize = fontSize + "px";
      this.input_area.style.height = fontSize + "px";
      this.input_area.style.opacity = "0.8";
      this.input_area.style.width = "auto"
    }
  },

  stop: function() {
    this.outputStream.close();
    this.inputStream.close();
    if(bcDBCS) {
      nsIBinaryInputStream.close()
    }else {
      nsIConverterInputStream.close();
      nsIConverterOutputStream.close()
    }
    switchInputCapturer();
    $anti_idler.stop()
  },

  sendData: function(str) {
    if(bcDBCS) {
      str = nsIScriptableUnicodeConverter.ConvertFromUnicode(str);
      str += nsIScriptableUnicodeConverter.Finish();
      FireBBS.outputStream.write(str, str.length);
      FireBBS.outputStream.flush()
    }else {
      nsIConverterOutputStream.writeString(str)
    }
    FireBBS.cursor.style.color = "red";
    $anti_idler.update()
  },

  relocateCursor: function() {
    var pos = convertMN2XY($cursor.position);
    this.cursor.style.left = pos[0] + "px";
    this.cursor.style.top = pos[1] + "px";
    FireBBS.cursor.style.color = ""
  }
};
