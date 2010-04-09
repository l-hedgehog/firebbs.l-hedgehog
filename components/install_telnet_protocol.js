/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla.
 *
 * The Initial Developer of the Original Code is IBM Corporation.
 * Portions created by IBM Corporation are Copyright (C) 2004
 * IBM Corporation. All Rights Reserved.
 *
 * As part of FireBBS.l-hedgehog, XPCOMUtils is introduced into this file
 * by Hector Zhao in 2009.
 *
 * Contributor(s):
 *   Darin Fisher <darin@meer.net>
 *   Doron Rosenberg <doronr@us.ibm.com>
 *   Hector Zhao <http://github.com/l-hedgehog>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Telnet protocol related
const kSCHEME              = "telnet";
const kPROTOCOL_NAME       = "Telnet Protocol";
const kPROTOCOL_CONTRACTID = "@mozilla.org/network/protocol;1?name=" + kSCHEME;
const kPROTOCOL_CID        = Components.ID("5FAF83FD-708D-45c0-988B-C7404FB25376");

// Mozilla defined
const kSTANDARDURL_CONTRACTID = "@mozilla.org/network/standard-url;1";
const kIOSERVICE_CONTRACTID   = "@mozilla.org/network/io-service;1";

const nsISupports        = Components.interfaces.nsISupports;
const nsIIOService       = Components.interfaces.nsIIOService;
const nsIProtocolHandler = Components.interfaces.nsIProtocolHandler;
const nsIStandardURL     = Components.interfaces.nsIStandardURL;
const nsIURI             = Components.interfaces.nsIURI;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function TelnetProtocol() {
}

TelnetProtocol.prototype = {
  classDescription: kPROTOCOL_NAME,
  classID:          kPROTOCOL_CID,
  contractID:       kPROTOCOL_CONTRACTID,
  QueryInterface:   XPCOMUtils.generateQI([nsIProtocolHandler,
                                           nsISupports]),

  scheme: kSCHEME,
  defaultPort: 23,
  protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                 nsIProtocolHandler.URI_NOAUTH |
                 nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,
  
  allowPort: function(port, scheme) {
    return false
  },

  newURI: function(spec, charset, baseURI) {
    var cls = Components.classes[kSTANDARDURL_CONTRACTID];
    var url = cls.createInstance(nsIStandardURL);
    url.init(nsIStandardURL.URLTYPE_STANDARD,
             this.defaultPort, spec, charset, baseURI);

    return url.QueryInterface(nsIURI)
  },

  newChannel: function(aURI) {
    // aURI is a nsIUri, so get a string from it using .spec
    var site_url = aURI.spec;

    // strip away the kSCHEME: part
    site_url = site_url.substring(site_url.indexOf("://") + 3, site_url.length);
    // site_url = encodeURI(site_url);

    /* create dummy nsIURI and nsIChannel instances */
    var ios = Components.classes[kIOSERVICE_CONTRACTID].getService(nsIIOService);

    return ios.newChannel("chrome://firebbs/content/firebbs.html", null, null)
  }
};

// XPCOM registration.
var components = [TelnetProtocol];
function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule(components)
}
