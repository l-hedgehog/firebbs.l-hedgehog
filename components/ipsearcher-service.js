/* ***** BEGIN COPYRIGHT AND LICENSE BLOCK *****
 *
 * Copyright © 2010 Hector Zhao
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
const Cr = Components.results;
const Cu = Components.utils;
const CE = Components.Exception;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function IPSearcherService() {
}

IPSearcherService.prototype = {
  classDescription: "IPSearcher Service",
  classID:          Components.ID("{d6e0b16b-7dfa-4917-9dd6-703863031d93}"),
  contractID:       "@hector.zhao/ipsearcher-service;2",
  QueryInterface:   XPCOMUtils.generateQI([Ci.hzIIPSearcherService]),

  _conv:  null,
  _data:  null,
  _file:  null,
  _index: null,
  _total: null,

  _close: function() {
    this._data = null
  },

  _getadd: function(ipstr) {
    var ip = this._str2ip(ipstr);
    var begin = 0;
    var end = this._total;
    var ret = [];
    while(true) {
      if(begin >= end - 1) {
        break
      }
      if(ip < this._rbytes(this._index + 7 * Math.floor((begin + end) / 2), 4)) {
        end = (begin + end) / 2
      }else {
        begin = (begin + end) / 2
      }
    }
    var temp = this._rbytes(this._index + 7 * Math.floor(begin) + 4, 3);
    if(ip <= this._rbytes(temp, 4)) {
      temp += 4;
      if(String.fromCharCode(1) == this._data[temp]) {
        temp = this._rbytes(temp + 1, 3)
      }
      if(String.fromCharCode(2) == this._data[temp]) {
        ret.push(this._rbytes(temp + 1, 3));
        temp += 4
      }else {
        ret.push(temp);
        temp = this._data.indexOf(String.fromCharCode(0), ret[0]) + 1
      }
      if(String.fromCharCode(2) == this._data[temp]) {
        ret.push(this._rbytes(temp + 1, 3))
      }else {
        ret.push(temp)
      }
      temp = this._data.indexOf(String.fromCharCode(0), ret[0]);
      ret[0] = this._data.substring(ret[0], temp);
      temp = this._data.indexOf(String.fromCharCode(0), ret[1]);
      ret[1] = this._data.substring(ret[1], temp)
    }else {
      ret.push("Unknown data");
      ret.push("")
    }
    return ret.join(" ").replace("CZ88.NET", "")
  },

  _open: function() {
    var fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                    createInstance(Ci.nsIFileInputStream);
    fstream.init(this._file, -1, 0, 0);
    var bstream = Cc["@mozilla.org/binaryinputstream;1"].
                    createInstance(Ci.nsIBinaryInputStream);
    bstream.setInputStream(fstream);
    this._data = bstream.readBytes(bstream.available());
    fstream.close();
    bstream.close()
  },

  _rbytes: function(offset, count) {
    var ret = 0;
    for(var i = count;i > 0;i--) {
        ret *= 256;
        ret += parseInt(this._data.charCodeAt(offset + i - 1), 10)
    }
    return ret
  },

  _str2ip: function(ipstr) {
    var ret = 0;
    var iparr = ipstr.split(".");
    for(var i = 0;i < 4;i++) {
      ret *= 256;
      if(!isNaN(parseInt(iparr[i], 10))) {
        ret += parseInt(iparr[i], 10)
      }
    }
    return ret
  },

  init: function() {
    if(!this._index) {
      this._file = Cc["@mozilla.org/file/directory_service;1"].
                     getService(Ci.nsIProperties).
                     get("ProfD", Ci.nsIFile);
      this._file.append("QQwry.dat");
      if(this._file.exists() && this._file.isFile()) {
        this._open();
        this._index = this._rbytes(0, 4);
        this._total = this._rbytes(4, 4) - this._index;
        this._close();
        if(this._total % 7) {
          throw CE("QQwry.dat is corrupted", Cr.NS_ERROR_FILE_CORRUPTED);
        }else {
          this._total /= 7;
          this._total++
        }

        this._conv = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                       createInstance(Ci.nsIScriptableUnicodeConverter);
        //this is hardcoded to gb2312 as QQwry.dat is encoded in gb2312;
        this._conv.charset = "gb2312"
      }else {
        throw CE("Cannot find QQwry.dat", Cr.NS_ERROR_FILE_NOT_FOUND);
      }
    }
  },

  location: function(ip) {
    this._open();
    var ret = this._conv.ConvertToUnicode(this._getadd(ip));
    this._close();
    return ret
  }
};

var components = [IPSearcherService];
function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule(components)
}
