/* ***** BEGIN COPYRIGHT AND LICENSE BLOCK *****
 *
 * Copyright © 2012 Brendan Dahl
 * Copyright © 2011 Erik Vold
 * Copyright © 2012 Hector Zhao
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

/* Most part of this file is from pdf.js @ http://git.io/7QyhvQ (MIT/X11)
   setDefaultPrefs is from addon-sdk @ http://git.io/vx9XPQ (MPL/GPL/LGPL) */

'use strict';

const RESOURCE_NAME = 'firebbs';
const { classes: Cc, interfaces: Ci, manager: Cm, utils: Cu } = Components;
Cu.import('resource://gre/modules/Services.jsm');

let Factory = {
  registrar: null,
  aClass: null,
  register: function(aClass) {
    if (this.aClass) {
      return;
    }
    this.registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
    this.aClass = aClass;
    var proto = aClass.prototype;
    this.registrar.registerFactory(proto.classID, proto.classDescription,
      proto.contractID, this);
  },
  unregister: function() {
    if (!this.aClass) {
      return;
    }
    var proto = this.aClass.prototype;
    this.registrar.unregisterFactory(proto.classID, this);
    this.aClass = null;
  },
  createInstance: function(outer, iid) {
    if (outer !== null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
    return (new (this.aClass)).QueryInterface(iid);
  }
};

let setDefaultPrefs = function() {
  let branch = Services.prefs.getDefaultBranch('');
  let prefLoaderScope = {
    pref: function(key, val) {
      switch (typeof val) {
        case 'boolean':
          branch.setBoolPref(key, val);
          break;
        case 'number':
          branch.setIntPref(key, val);
          break;
        case 'string':
          branch.setCharPref(key, val);
          break;
      }
    }
  };

  let uri = Services.io.newURI(
      'defaults/preferences/prefs.js',
      null,
      Services.io.newURI(__SCRIPT_URI_SPEC__, null, null));
  if (uri.QueryInterface(Ci.nsIFileURL).file.exists()) {
    Services.scriptloader.loadSubScript(uri.spec, prefLoaderScope);
  }
};

let telnetProtocolUrl = null;

function startup(aData, aReason) {
  setDefaultPrefs();

  var resProt = Services.io.getProtocolHandler('resource')
                  .QueryInterface(Ci.nsIResProtocolHandler);
  var aliasFile = Cc['@mozilla.org/file/local;1']
                    .createInstance(Ci.nsILocalFile);
  var modulePath = aData.installPath.clone();
  modulePath.append('modules');
  aliasFile.initWithPath(modulePath.path);
  var aliasURI = Services.io.newFileURI(aliasFile);
  resProt.setSubstitution(RESOURCE_NAME, aliasURI);

  telnetProtocolUrl = aData.resourceURI.spec +
                      'components/install_telnet_protocol.js';
  Cu.import(telnetProtocolUrl);
  Factory.register(TelnetProtocol);
}

function shutdown(aData, aReason) {
  var resProt = Services.io.getProtocolHandler('resource')
                  .QueryInterface(Ci.nsIResProtocolHandler);
  resProt.setSubstitution(RESOURCE_NAME, null);

  Factory.unregister();
  if (telnetProtocolUrl) {
    Cu.unload(telnetProtocolUrl);
    telnetProtocolUrl = null;
  }
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
