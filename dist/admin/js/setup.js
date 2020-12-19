/** initialize IDB and claims validation */
// Prefixes of all IDB implementations.
// Taken from https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {
  READ_WRITE: "readwrite"
}; // This line should only be needed if it is needed to support the object's constants for older browsers

window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
window.DB_VERSION = 2;
window.database;
var drawer;
var hasMultipleOffice = false;
window.addEventListener('load', function () {
  firebase.auth().onAuthStateChanged(function (user) {
    // if user is logged out redirect to login page
    if (!user) {
      redirect('/index.html');
      return;
    }

    handleDrawerView();
    window.addEventListener('resize', function () {
      handleDrawerView();
    });
    drawer = new mdc.drawer.MDCDrawer(document.querySelector(".mdc-drawer"));
    window.mdc.autoInit();
    firebase.auth().currentUser.getIdTokenResult().then(function (idTokenResult) {
      var claims = idTokenResult.claims;
      if (claims.support) return redirect('/support');

      if (claims.admin && claims.admin.length) {
        // if there are multiple offices fill the drawer header with office list
        if (claims.admin.length > 1) {
          hasMultipleOffice = true;
          document.querySelector('.mdc-drawer__header').classList.remove('hidden');
          claims.admin.forEach(function (office) {
            document.getElementById('office-list').appendChild(officeList(office));
          });
          var officeSelect = new mdc.select.MDCSelect(document.getElementById('office-select')); // document.querySelector('#office-select .mdc-select__selected-text').textContent = window.sessionStorage.getItem('office')

          if (claims.admin.indexOf(window.sessionStorage.getItem('office')) > -1) {
            officeSelect.selectedIndex = claims.admin.indexOf(window.sessionStorage.getItem('office'));
          } else {
            officeSelect.selectedIndex = 0;
          } // drawer.unlisten('MDCList:action');


          var initOnce = 0;
          drawer.unlisten('MDCList:action', sel);
          var sel = officeSelect.listen('MDCSelect:change', function (ev) {
            initOnce++;
            if (initOnce % 2 !== 0) return;
            console.log(ev);
            var selectedOffice = ev.detail.value;
            appLoader.show();
            http('GET', "".concat(appKeys.getBaseUrl(), "/api/office?office=").concat(selectedOffice)).then(function (response) {
              window.sessionStorage.setItem('office', selectedOffice);
              window.sessionStorage.setItem('officeId', response.results[0].officeId);
              redirect('/admin/index.html');
            }).catch(function (err) {
              appLoader.remove();
              showSnacksApiResponse('Please try again later');
            });
          });
        } // if office is already present insesstion storage, use that


        if (window.sessionStorage.getItem('office')) {
          initializeIDB(window.sessionStorage.getItem('office'));
          return;
        }

        return initializeIDB(claims.admin[0]);
      }

      return redirect('/join');
    });
  });
}); // firebase.auth().currentUser.getIdTokenResult(idTokenResult=>{
//     const claims = idTokenResult.claims.admin
//     if(claims && claims.length) {
//         claims.forEach(claim=>{
//         })
//     }
// })

var handleDrawerView = function handleDrawerView() {
  var width = document.body.offsetWidth; // if width is less than 839px then make drawer modal drawer 

  if (document.getElementById('drawer-scrim')) {
    document.getElementById('drawer-scrim').remove();
  }

  ;

  if (width < 839) {
    document.querySelector('.mdc-drawer').classList.replace('mdc-drawer--dismissible', 'mdc-drawer--modal');
    document.body.insertBefore(createElement('div', {
      className: 'mdc-drawer-scrim',
      id: 'drawer-scrim'
    }), document.querySelector('.mdc-drawer-app-content'));
    return;
  } // make drawer dismissible for desktops


  document.querySelector('.mdc-drawer').classList.replace('mdc-drawer--modal', 'mdc-drawer--dismissible');
};

var initializeIDB = function initializeIDB(office) {
  if (!window.indexedDB) {
    // startApplication();
    return;
  }

  ;
  var dbName = firebase.auth().currentUser.uid;
  var req = window.indexedDB.open(dbName, DB_VERSION);

  req.onerror = function (event) {
    console.error(event.target.error);
  };
  /** create object stores and initialize IDB Database.
   *   If no prior databse version exist this function will fire before onsuccess
   */


  req.onupgradeneeded = function (event) {
    if (event.oldVersion == 0) {
      try {
        appLoader.show();
      } catch (e) {
        console.log(e);
      }

      buildSchema(this.result, office);
      return;
    }

    if (event.oldVersion == 1) {
      var tx = event.currentTarget.transaction;
      var store = tx.objectStore('types');
      store.createIndex("search_key_name", "search_key_name");
    }
  };

  req.onsuccess = function (event) {
    window.database = this.result;
    initDBErrorHandler();
    startApplication(office);
  };

  req.onblocked = function (event) {
    alert("Close other growthfile opened tabs");
  };
};
/**
 * Build object stores
 * @param {IDBDatabase} db // IDBDatabase interface 
 * @param {string} office 
 */


var buildSchema = function buildSchema(db, office) {
  // users object store to add users meta data
  var users = db.createObjectStore("users", {
    keyPath: "phoneNumber",
    autoIncrement: true
  });
  users.createIndex("search_key", "search_key");
  users.createIndex("timestamp", "timestamp"); // locations object store to add locations meta data

  var locations = db.createObjectStore("locations", {
    keyPath: "location"
  });
  locations.createIndex("search_key", "search_key");
  locations.createIndex("timestamp", "timestamp"); // activity object store to add activity

  var activities = db.createObjectStore("activities", {
    keyPath: "activityId"
  });
  activities.createIndex("timestamp", "timestamp");
  var subscriptions = db.createObjectStore("subscriptions", {
    keyPath: "id"
  });
  subscriptions.createIndex("name", "name"); // types object store to add types meta data (product, department etc)

  var types = db.createObjectStore("types", {
    keyPath: "id"
  });
  types.createIndex("template", "template");
  types.createIndex("timestamp", "timestamp");
  types.createIndex("search_key_name", "search_key_name"); // meta object store to add meta data for user

  var meta = db.createObjectStore("meta", {
    keyPath: "meta"
  }); // add office to meta object store, to later retrieve it for sending http requests
  // & other stuff

  meta.transaction.oncomplete = function () {
    var tx = db.transaction('meta', 'readwrite');
    var store = tx.objectStore('meta');
    store.add({
      meta: "meta",
      office: office
    });
  };
};
/**
 * Since all error event bubbles up to db, init the error handler for all idb errors
 */


var initDBErrorHandler = function initDBErrorHandler() {
  window.indexedDB.onerror = function (ev) {
    console.error("Database error: " + event.target.error);
  };
};

var startApplication = function startApplication(office) {
  var menu = new mdc.iconButton.MDCIconButtonToggle(document.getElementById('menu'));
  menu.listen('MDCIconButtonToggle:change', function (event) {
    if (drawer.root.classList.contains('mdc-drawer--dismissible')) {
      if (drawer.root.classList.contains('default-open')) {
        drawer.open = false;
        drawer.root.classList.remove('default-open');
        return;
      }
    }

    drawer.open = !drawer.open;
  });

  if (firebase.auth().currentUser.photoURL) {
    document.getElementById('user-logo').src = firebase.auth().currentUser.photoURL;
  } // get office id


  getOfficeId(office).then(function (officeId) {
    // get office activity 
    return getOfficeActivity(officeId);
  }).then(function (officeActivity) {
    var userProfileLogo = document.getElementById('user-logo');
    userProfileLogo.addEventListener('click', function (ev) {
      openProfileBox(ev);
    });
    appLoader.remove();

    if (window.location.pathname.split("/").indexOf("account") > -1 || window.location.pathname.split("/").indexOf("account.html") > -1) {
      init(office, officeActivity.activityId);
      return;
    }

    var dialog = new mdc.dialog.MDCDialog(document.getElementById('payment-dialog'));
    var dialogBody = document.getElementById('payment-dialog--body');
    var dialogTitle = document.getElementById('my-dialog-title');
    document.getElementById('choose-plan-button').href = "../join.html?office=".concat(encodeURIComponent(office));
    var schedule = officeActivity.schedule;
    var isUserFirstContact = officeActivity.attachment['First Contact'].value === firebase.auth().currentUser.phoneNumber;

    if (!hasMultipleOffice) {
      dialog.scrimClickAction = "";
    }

    ;

    if (!officeHasMembership(schedule)) {
      dialogTitle.textContent = 'You are just 1 step away from tracking your employees successfully.';
      dialogBody.textContent = 'Choose your plan to get started.';
      officeActivity.geopoint = {
        latitude: 0,
        longitude: 0
      };
      http('PUT', "".concat(appKeys.getBaseUrl(), "/api/activities/update"), officeActivity).then(function (res) {
        if (isUserFirstContact) {
          dialog.open();
          return;
        }

        dialogBody.textContent = 'Please ask the business owner to complete the payment';
        dialog.open();
      });
      return;
    }

    if (isOfficeMembershipExpired(schedule)) {
      var diff = getDateDiff(schedule);

      if (diff > 3) {
        dialogTitle.textContent = 'Your plan has expired.';
        dialogBody.textContent = 'Choose plan to renew now.';
      }

      if (isUserFirstContact) {
        dialog.open();
        return;
      }

      ;
      dialogBody.textContent = 'Please ask the business owner to renew the payment';
      dialog.open();
      return;
    }

    init(office, officeActivity.activityId);
  }).catch(console.error); //init drawer & menu for non-desktop devices
};

var openProfileBox = function openProfileBox(event) {
  event.stopPropagation();
  document.querySelector('.user-profile--logo').classList.add('focused');
  var el = document.querySelector('.profile-box');

  if (el.classList.contains('hidden')) {
    el.classList.remove('hidden');
  } else {
    closeProfileBox();
  }

  ;
  var name = firebase.auth().currentUser.displayName;
  var email = firebase.auth().currentUser.email;
  var photo = firebase.auth().currentUser.photoURL;

  if (photo) {
    document.getElementById('auth-image').src = photo;
  }

  document.getElementById('auth-name').textContent = name;
  document.getElementById('auth-email').textContent = email;
};

var closeProfileBox = function closeProfileBox() {
  var el = document.querySelector('.profile-box');
  document.querySelector('.user-profile--logo').classList.remove('focused');
  el.classList.add('hidden');
};

var getOfficeId = function getOfficeId(office) {
  window.sessionStorage.setItem('office', office);
  return new Promise(function (resolve, reject) {
    var officeIdSessionStorage = window.sessionStorage.getItem('officeId');
    if (officeIdSessionStorage) return resolve(window.sessionStorage.getItem('officeId'));

    window.database.transaction("meta").objectStore("meta").get("meta").onsuccess = function (event) {
      var record = event.target.result;

      if (record.officeId) {
        window.sessionStorage.setItem('officeId', record.officeId);
        resolve(record.officeId);
        return;
      }

      http('GET', "".concat(appKeys.getBaseUrl(), "/api/office?office=").concat(encodeURIComponent(office))).then(function (response) {
        if (!response.results.length) {
          showSnacksApiResponse('Office not found');
          return;
        }

        var officeId = response.results[0].officeId;
        window.sessionStorage.setItem('officeId', officeId);
        window.database.transaction("meta", "readwrite").objectStore("meta").put({
          meta: "meta",
          office: office,
          officeId: officeId
        });
        resolve(officeId);
      });
    };
  });
};

var officeList = function officeList(name) {
  var li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.dataset.value = name;
  li.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n    <span class=\"mdc-list-item__text\">".concat(name, "</span>");
  return li;
};