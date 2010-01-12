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

    var conv   = null;
    var ip2loc = null;
    var lib    = null;
}

IPSearcherService.prototype = {
    classDescription: "IPSearcher Service",
    classID:          Components.ID("{d6e0b16b-7dfa-4917-9dd6-703863031d93}"),
    contractID:       "@hector.zhao/ipsearcher-service;1",
    QueryInterface:   XPCOMUtils.generateQI([Ci.nsISupports]),

    init: function(){
        this.conv = Cc["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Ci.nsIScriptableUnicodeConverter);
        //this is hardcoded to gb2312 as qqwry.dat/ipwry.dat is encoded in gb2312;
        this.conv.charset = "gb2312";

        var dll = __LOCATION__.parent;
        dll.append("ipsearcher.dll");
        dll.QueryInterface(Ci.nsILocalFile);
        this.lib = ctypes.open(dll);
        this.ip2loc = this.lib.declare("GetAddress",
                                       ctypes.stdcall_abi,
                                       ctypes.string,
                                       ctypes.string);
    },

    location: function(ip){
        return this.conv.ConvertToUnicode(this.ip2loc(ip));
    },

    stop: function(){
        this.lib.close();
    },
};

var components = [IPSearcherService];
function NSGetModule(compMgr, fileSpec)
{
	return XPCOMUtils.generateModule(components);
}
