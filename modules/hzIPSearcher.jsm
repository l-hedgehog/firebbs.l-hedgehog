/* ***** BEGIN COPYRIGHT AND LICENSE BLOCK *****
 *
 * Copyright © 2010, 2012 Hector Zhao
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

var EXPORTED_SYMBOLS = ['hzIPSearcher'];

const { classes: Cc, interfaces: Ci, results: Cr,
        utils: Cu, Exception: CE } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

var hzIPSearcher = (function() {
  var _conv  = null,
      _data  = null,
      _file  = null,
      _index = null,
      _total = null;

  var _close = function() {
    _data = null
  };

  var _getadd = function(ipstr) {
    var ip = _str2ip(ipstr);
    var begin = 0;
    var end = _total;
    var ret = [];
    while(true) {
      if(begin >= end - 1) {
        break
      }
      if(ip < _rbytes(_index + 7 * Math.floor((begin + end) / 2), 4)) {
        end = (begin + end) / 2
      }else {
        begin = (begin + end) / 2
      }
    }
    var temp = _rbytes(_index + 7 * Math.floor(begin) + 4, 3);
    if(ip <= _rbytes(temp, 4)) {
      temp += 4;
      if(String.fromCharCode(1) == _data[temp]) {
        temp = _rbytes(temp + 1, 3)
      }
      if(String.fromCharCode(2) == _data[temp]) {
        ret.push(_rbytes(temp + 1, 3));
        temp += 4
      }else {
        ret.push(temp);
        temp = _data.indexOf(String.fromCharCode(0), ret[0]) + 1
      }
      if(String.fromCharCode(2) == _data[temp]) {
        ret.push(_rbytes(temp + 1, 3))
      }else {
        ret.push(temp)
      }
      temp = _data.indexOf(String.fromCharCode(0), ret[0]);
      ret[0] = _data.substring(ret[0], temp);
      temp = _data.indexOf(String.fromCharCode(0), ret[1]);
      ret[1] = _data.substring(ret[1], temp)
    }else {
      ret.push("Unknown data");
      ret.push("")
    }
    return ret.join(" ").replace("CZ88.NET", "")
  };

  var _open = function() {
    var fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                    createInstance(Ci.nsIFileInputStream);
    fstream.init(_file, -1, 0, 0);
    var bstream = Cc["@mozilla.org/binaryinputstream;1"].
                    createInstance(Ci.nsIBinaryInputStream);
    bstream.setInputStream(fstream);
    _data = bstream.readBytes(bstream.available());
    fstream.close();
    bstream.close()
  };

  var _rbytes = function(offset, count) {
    var ret = 0;
    for(var i = count;i > 0;i--) {
        ret *= 256;
        ret += parseInt(_data.charCodeAt(offset + i - 1), 10)
    }
    return ret
  };

  var _str2ip = function(ipstr) {
    var ret = 0;
    var iparr = ipstr.split(".");
    for(var i = 0;i < 4;i++) {
      ret *= 256;
      if(!isNaN(parseInt(iparr[i], 10))) {
        ret += parseInt(iparr[i], 10)
      }
    }
    return ret
  };

  var init = function() {
    if(!_index) {
      _file = Cc["@mozilla.org/file/directory_service;1"].
                 getService(Ci.nsIProperties).
                 get("ProfD", Ci.nsIFile);
      _file.append("QQwry.dat");
      if(_file.exists() && _file.isFile()) {
        _open();
        _index = _rbytes(0, 4);
        _total = _rbytes(4, 4) - _index;
        _close();
        if(_total % 7) {
          throw CE("QQwry.dat is corrupted", Cr.NS_ERROR_FILE_CORRUPTED);
        }else {
          _total /= 7;
          _total++
        }

        _conv = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                   createInstance(Ci.nsIScriptableUnicodeConverter);
        //this is hardcoded to gb2312 as QQwry.dat is encoded in gb2312;
        _conv.charset = "gb2312"
      }else {
        throw CE("Cannot find QQwry.dat", Cr.NS_ERROR_FILE_NOT_FOUND);
      }
    }
  };

  var location = function(ip) {
    _open();
    var ret = _conv.ConvertToUnicode(_getadd(ip));
    _close();
    return ret
  };

  return {
    init:     init,
    location: location
  }
})();
