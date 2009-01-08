const Cc = Components.classes;
const Ci = Components.interfaces;

var nsISocketTransportService =
      Cc["@mozilla.org/network/socket-transport-service;1"].
        getService(Ci.nsISocketTransportService);
var nsIScriptableInputStream =
      Cc["@mozilla.org/scriptableinputstream;1"].
        createInstance(Ci.nsIScriptableInputStream);
var nsIInputStreamPump =
      Cc["@mozilla.org/network/input-stream-pump;1"].
        createInstance(Ci.nsIInputStreamPump);

var nsIConverterInputStream =
      Cc["@mozilla.org/intl/converter-input-stream;1"].
        createInstance(Ci.nsIConverterInputStream);

var nsIConverterOutputStream =
      Cc["@mozilla.org/intl/converter-output-stream;1"].
        createInstance(Ci.nsIConverterOutputStream);

var strBundle =
      Cc["@mozilla.org/intl/stringbundle;1"].
        getService(Ci.nsIStringBundleService).
        createBundle("chrome://firebbs/locale/firebbs.properties");

var prefs =
      Cc["@mozilla.org/preferences-service;1"].
        getService(Ci.nsIPrefService).
        getBranch("extensions.firebbs.");

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

var FireBBS = {
  cursor : null,
  output_area : null,
  float_box : null,
  outputStream : null,
  inputStream : null,
  HTMLString_cache : '',
  ASCII_cache: '',

  dataListener : {
      data : {},
      restStr : '',

      onStartRequest: function(request, context){
      },

      onStopRequest: function(request, context, status){
        FireBBS.outputStream.close();
        FireBBS.inputStream.close();
        nsIConverterInputStream.close();
        nsIConverterOutputStream.close();
        switchInputCapturer();
      },

      onDataAvailable: function(request, context, inputStream, offset, count){
        nsIConverterInputStream.readString(0xFFFF, this.data);
        var str = this.restStr + this.data.value;
        //FireBBS.ASCII_cache = str.replace(/\x1B/g, '\x1B\x1B').replace(/\r/g, '').replace(/\ufffd/g, '?');
        this.restStr ='';

        str = str.replace(/\x07/g, '\x1B\x07');//escape BEL
        str = str.replace(/[\b]/g, '\x1B[1D');//escape BS(replace )
        str = str.replace(/\t/g, '\x1B[8C');//escape HT(replace )
        str = str.replace(/\n/g, '\x1B\n');//escape LF
        str = str.replace(/\v/g, '\x1B[6B');//escape VT(replace )
        str = str.replace(/\f/g, '\x1B[2J\x1B[H');//escape FF(replace )
        str = str.replace(/\r/g, '\x1B[1G');//escape CR(replace )

        var strArray = str.split('\x1B');
        FireBBS.HTMLString_cache += generate_span(strArray[0]);

        for(var i = 1; i < strArray.length; i++){
         switch(strArray[i][0]){
          case '[' ://Functions using CSI
            var template = /^\x5B((?:|\d+|;)+)([\x40-\x5A\x60-\x7C])/;//Functions using CSI
            var result = template.exec(strArray[i]);

            if(result){
              CSIFunctionHandler(result[2], result[1].split(';'));
              FireBBS.HTMLString_cache += generate_span(strArray[i].substr(result[0].length));
            }
            else{
              if(i == strArray.length - 1){//this is an unfinished data message
                this.restStr = '\x1B' + strArray[i];
                }
              else{}
            }
            break;

          case '\x07':
            BEL();
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;
          case '\n':
            LF();
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;

          case 'D':
            IND();
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;
          case 'M':
            RI();
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;
          case 'E':
            NEL()
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;
          case '7':
            DECSC();
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;
          case '8':
            DECRC();
            FireBBS.HTMLString_cache += generate_span(strArray[i].substr(1));
            break;
          default:
            if(i == strArray.length - 1){//this is an unfinished data message
              this.restStr = '\x1B' + strArray[i];
            }
            else{}
          }
        }

        $garbage_span_collector.clearScreen();
        FireBBS.output_area.innerHTML += FireBBS.HTMLString_cache;
        FireBBS.HTMLString_cache = '';
        FireBBS.relocateCursor();
      },
  },

  init : function(){
    var transport = nsISocketTransportService.
          createTransport(null, 0,
                          document.location.hostname == "firebbs" ? "bbs.pku.edu.cn" : document.location.hostname,
                          document.location.port ? document.location.port : 23,
                          null);
    var options = document.location.search;
    var charset = (/charset\x3D(\w+)/.exec(options))
                ? (/charset\x3D(\w+)/.exec(options))[1]
                : (prefs.getComplexValue('charset', Ci.nsIPrefLocalizedString).data);
    var fontSize = /fontsize\x3D(\d+)/.exec(options);
    var fontFamily = /fontfamily\x3D((?:%|\w)+)/.exec(options);
    var terminal_display_class;
    
    for(var i=0; i<document.styleSheets[0].cssRules.length; i++){
      if(document.styleSheets[0].cssRules[i].selectorText == '.terminal_display'){
        terminal_display_class = document.styleSheets[0].cssRules[i];
      }
    }
      
      
      
      
    const REPLACEMENT_CHARACTER = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;

    this.outputStream = transport.openOutputStream(0,0,0);
    this.inputStream = transport.openInputStream(0,0,0);
    nsIConverterInputStream.init(this.inputStream, charset, 0xFFFF, REPLACEMENT_CHARACTER);
    nsIConverterOutputStream.init(this.outputStream, charset, 0xFFFF, REPLACEMENT_CHARACTER)



    nsIScriptableInputStream.init(this.inputStream);

    nsIInputStreamPump.init(this.inputStream, -1, -1, 0, 0, false);
    nsIInputStreamPump.asyncRead(this.dataListener,null);

    this.cursor = document.getElementById('cursor');
    this.output_area = document.getElementById('output_area');
    this.float_box = document.getElementById('float_box');
    
    //document.title = document.location.host;
    $garbage_span_collector.initCoveredArea();

    if(fontFamily){
      terminal_display_class.style.fontFamily = decodeURIComponent(fontFamily[1]) + ',monospace';
    } else {
      terminal_display_class.style.fontFamily = prefs.getComplexValue('fontfamily', Ci.nsIPrefLocalizedString).data + ',monospace';
    }

    if(fontSize){
      terminal_display_class.style.fontSize = fontSize[1] + 'px';
      terminal_display_class.style.lineHeight = fontSize[1] + 'px';
      $character.init(parseInt(fontSize[1]));
      this.output_area.style.width = $character.fontWidth * $output_area.cols + 'px';
      this.output_area.style.height = $character.fontHeight * $output_area.rows + 'px';
    } else {
      fontSize = prefs.getIntPref('fontsize');
      terminal_display_class.style.fontSize = fontSize + 'px';
      terminal_display_class.style.lineHeight = fontSize + 'px';
      $character.init(fontSize);
      this.output_area.style.width = $character.fontWidth * $output_area.cols + 'px';
      this.output_area.style.height = $character.fontHeight * $output_area.rows + 'px';
    }
  },

  sendData : function(str){
    nsIConverterOutputStream.writeString(str);
    FireBBS.cursor.style.color = 'red';

  },

  relocateCursor : function(){
    var pos = convertMN2XY($cursor.position);
    this.cursor.style.left = pos[0] + 'px';
    this.cursor.style.top = pos[1] + 'px';
    FireBBS.cursor.style.color = '';
  },
};