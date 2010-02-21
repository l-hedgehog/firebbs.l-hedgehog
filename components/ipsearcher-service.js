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
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/ctypes.jsm");

function IPSearcherService()
{
    this.wrappedJSObject = this;
}

IPSearcherService.prototype = {
    classDescription: "IPSearcher Service",
    classID:          Components.ID("{d6e0b16b-7dfa-4917-9dd6-703863031d93}"),
    contractID:       "@hector.zhao/ipsearcher-service;2",
    QueryInterface:   XPCOMUtils.generateQI([Ci.nsISupports]),

    conv:  null,
    data:  null,
    index: null,
    total: null,

    getadd: function(ipstr){
        var ip = this.str2ip(ipstr);
        var begin = 0;
        var end = this.total;
        var ret = [];
        while(true){
            if(begin >= end - 1)
                break;
            if(ip < this.rbytes((this.index + 7 * Math.floor((begin + end) / 2)), 4))
                end = (begin + end) / 2;
            else
                begin = (begin + end) / 2;
        }
        var temp = this.rbytes((this.index + 7 * Math.floor(begin) + 4), 3);
        if(ip <= this.rbytes(temp, 4)){
            temp += 4;
            if(String.fromCharCode(0x01) == this.data[temp])
                temp = this.rbytes(temp + 1, 3);
            if(String.fromCharCode(0x02) == this.data[temp]){
                ret.push(this.rbytes(temp + 1, 3));
                temp += 4;
            }
            else{
                ret.push(temp);
                temp = this.data.indexOf(String.fromCharCode(0x00), ret[0]) + 1;
            }
            if(String.fromCharCode(0x02) == this.data[temp])
                ret.push(this.rbytes(temp + 1, 3));
            else
                ret.push(temp);
            temp = this.data.indexOf(String.fromCharCode(0x00), ret[0]);
            ret[0] = this.data.substring(ret[0], temp);
            temp = this.data.indexOf(String.fromCharCode(0x00), ret[1]);
            ret[1] = this.data.substring(ret[1], temp);
        }
        else{
            ret.push("Unknown data");
            ret.push("");
        }
        return ret.join(" ").replace("CZ88.NET", "Unknown data");
    },

    rbytes: function(offset, count){
        var ret = 0;
        for(var i = count; i > 0; i--){
            ret *= 256;
            ret += parseInt(this.data.charCodeAt(offset + i - 1), 10);
        }
        return ret;
    },

    str2ip : function(ipstr){
        var ret = 0;
        var iparr = ipstr.split(".");
        for(var i = 0; i < 4; i++){
            ret *= 256;
            if(!isNaN(parseInt(iparr[i], 10)))
                ret += parseInt(iparr[i], 10);
        }
        return ret;
    },

    init: function(){
        var nsIDirectoryService = Cc["@mozilla.org/file/directory_service;1"].
                                  getService(Ci.nsIProperties);
        var curProcD = nsIDirectoryService.get("CurProcD", Ci.nsIFile);
        var profD = nsIDirectoryService.get("ProfD", Ci.nsIFile);
        var file = __LOCATION__.parent;
        curProcD.append("QQwry.dat");
        profD.append("QQwry.dat");
        if(curProcD.isFile()){
            curProcD.moveTo(file, null);
        }
        else if(profD.isFile()){
            profD.moveTo(file, null);
        }
        file.append("QQwry.dat");
        if(file.isFile()){
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                            createInstance(Ci.nsIFileInputStream);
            fstream.init(file, -1, 0, 0);
            var bstream = Cc["@mozilla.org/binaryinputstream;1"].
                            createInstance(Ci.nsIBinaryInputStream);
            bstream.setInputStream(fstream);
            this.data = bstream.readBytes(bstream.available());

            this.index = this.rbytes(0, 4);
            this.total = this.rbytes(4, 4) - this.index;
            if(this.total % 7){
                alert("QQwry.dat is corrupted");
            }
            else{
                this.total /= 7;
                this.total ++;
            }

            this.conv = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                        createInstance(Ci.nsIScriptableUnicodeConverter);
            //this is hardcoded to gb2312 as qqwry.dat/ipwry.dat is encoded in gb2312;
            this.conv.charset = "gb2312";
        }
        else{
            alert("Cannot find QQwry.dat");
        }
    },

    location: function(ip){
        return this.conv.ConvertToUnicode(this.getadd(ip));
    },

    stop: function(){
        this.conv = null;
        this.data = null;
    },
};

var components = [IPSearcherService];
function NSGetModule(compMgr, fileSpec)
{
    return XPCOMUtils.generateModule(components);
}
