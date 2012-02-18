'use strict';

const { classes: Cc, interfaces: Ci, manager: Cm, utils: Cu } = Components;

Cu.import('resource://gre/modules/Services.jsm');

// (Un)Register a class as a component, from http://git.io/7QyhvQ (MIT/X11)
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

// Default prefs workaround, from http://git.io/vx9XPQ (MPL/GPL/LGPL)
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
  telnetProtocolUrl = aData.resourceURI.spec +
                      'components/install_telnet_protocol.js';
  Cu.import(telnetProtocolUrl);
  Factory.register(TelnetProtocol);
}

function shutdown(aData, aReason) {
  Factory.unregister();
  if (telnetProtocolUrl) {
    Cu.unload(telnetProtocolUrl);
    telnetProtocolUrl = null;
  }
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
