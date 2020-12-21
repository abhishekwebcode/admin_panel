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
let drawer;
let hasMultipleOffice = false;
window.addEventListener('load', () => {
    firebase.auth().onAuthStateChanged(function (user) {
        // if user is logged out redirect to login page
        if (!user) {
            redirect('/index.html')
            return
        }
        handleDrawerView()
        window.addEventListener('resize', () => {
            handleDrawerView()
        })
        drawer = new mdc.drawer.MDCDrawer(document.querySelector(".mdc-drawer"))

        window.mdc.autoInit();

        firebase.auth().currentUser.getIdTokenResult().then(idTokenResult => {

            const claims = idTokenResult.claims;

            // if (claims.support) return redirect('/support');
            if (claims.admin && claims.admin.length) {

                // if there are multiple offices fill the drawer header with office list
                if (claims.admin.length > 1) {
                    hasMultipleOffice = true
                    document.querySelector('.mdc-drawer__header').classList.remove('hidden')
                    claims.admin.forEach(office => {
                        document.getElementById('office-list').appendChild(officeList(office))
                    });
                    const officeSelect = new mdc.select.MDCSelect(document.getElementById('office-select'));
                    // document.querySelector('#office-select .mdc-select__selected-text').textContent = window.sessionStorage.getItem('office')
                    if (claims.admin.indexOf(window.sessionStorage.getItem('office')) > -1) {
                        officeSelect.selectedIndex = claims.admin.indexOf(window.sessionStorage.getItem('office'))
                    } else {
                        officeSelect.selectedIndex = 0
                    }

                    // drawer.unlisten('MDCList:action');
                    let initOnce = 0
                    drawer.unlisten('MDCList:action', sel)
                    var sel = officeSelect.listen('MDCSelect:change', (ev) => {

                        initOnce++
                        if (initOnce % 2 !== 0) return
                        console.log(ev)
                        const selectedOffice = ev.detail.value
                        appLoader.show()
                        http('GET', `${appKeys.getBaseUrl()}/api/office?office=${selectedOffice}`).then(response => {
                            window.sessionStorage.setItem('office', selectedOffice)
                            window.sessionStorage.setItem('officeId', response.results[0].officeId);
                            redirect('/admin/index.html')
                        }).catch(err => {
                            appLoader.remove()
                            showSnacksApiResponse('Please try again later')
                        })
                    })
                }

                // if office is already present insesstion storage, use that
                if (window.sessionStorage.getItem('office')) {
                    initializeIDB(window.sessionStorage.getItem('office'))
                    return
                }
                return initializeIDB(claims.admin[0]);
            }
            return redirect('/join.html?new_user=1');
        })
    });
})


// firebase.auth().currentUser.getIdTokenResult(idTokenResult=>{
//     const claims = idTokenResult.claims.admin
//     if(claims && claims.length) {
//         claims.forEach(claim=>{

//         })
//     }
// })
const handleDrawerView = () => {
    const width = document.body.offsetWidth
    // if width is less than 839px then make drawer modal drawer 
    if (document.getElementById('drawer-scrim')) {
        document.getElementById('drawer-scrim').remove();
    };
    if (width < 839) {
        document.querySelector('.mdc-drawer').classList.replace('mdc-drawer--dismissible', 'mdc-drawer--modal');
        document.body.insertBefore(createElement('div', {
            className: 'mdc-drawer-scrim',
            id: 'drawer-scrim'
        }), document.querySelector('.mdc-drawer-app-content'));

        return
    }
    // make drawer dismissible for desktops
    document.querySelector('.mdc-drawer').classList.replace('mdc-drawer--modal', 'mdc-drawer--dismissible');

}

const initializeIDB = (office) => {

    if (!window.indexedDB) {

        // startApplication();
        return
    };

    const dbName = firebase.auth().currentUser.uid;
    const req = window.indexedDB.open(dbName, DB_VERSION);

    req.onerror = function (event) {
        console.error(event.target.error)
    }
    /** create object stores and initialize IDB Database.
     *   If no prior databse version exist this function will fire before onsuccess
     */
    req.onupgradeneeded = function (event) {
        if (event.oldVersion == 0) {
            try {
                appLoader.show();
            } catch (e) {
                console.log(e)
            }

            buildSchema(this.result, office);
            return
        }
        if (event.oldVersion == 1) {
            const tx = event.currentTarget.transaction;
            const store = tx.objectStore('types');
            store.createIndex("search_key_name", "search_key_name");
        }
    }
    req.onsuccess = function (event) {
        window.database = this.result;
        initDBErrorHandler();
        startApplication(office);
    }
    req.onblocked = function (event) {
        alert("Close other growthfile opened tabs");
    }
}


/**
 * Build object stores
 * @param {IDBDatabase} db // IDBDatabase interface 
 * @param {string} office 
 */
const buildSchema = (db, office) => {

    // users object store to add users meta data
    const users = db.createObjectStore("users", {
        keyPath: "phoneNumber",
        autoIncrement: true
    });
    users.createIndex("search_key", "search_key")
    users.createIndex("timestamp", "timestamp")
    // locations object store to add locations meta data
    const locations = db.createObjectStore("locations", {
        keyPath: "location"
    });
    locations.createIndex("search_key", "search_key");
    locations.createIndex("timestamp", "timestamp");

    // activity object store to add activity
    const activities = db.createObjectStore("activities", {
        keyPath: "activityId"
    });
    activities.createIndex("timestamp", "timestamp");

    const subscriptions = db.createObjectStore("subscriptions", {
        keyPath: "id"
    });
    subscriptions.createIndex("name", "name");

    // types object store to add types meta data (product, department etc)
    const types = db.createObjectStore("types", {
        keyPath: "id"
    })
    types.createIndex("template", "template");
    types.createIndex("timestamp", "timestamp");
    types.createIndex("search_key_name", "search_key_name");

    // meta object store to add meta data for user

    const meta = db.createObjectStore("meta", {
        keyPath: "meta"
    });
    // add office to meta object store, to later retrieve it for sending http requests
    // & other stuff
    meta.transaction.oncomplete = function () {
        const tx = db.transaction('meta', 'readwrite');
        const store = tx.objectStore('meta');
        store.add({
            meta: "meta",
            office,
        })
    }
}




/**
 * Since all error event bubbles up to db, init the error handler for all idb errors
 */
const initDBErrorHandler = () => {
    window.indexedDB.onerror = function (ev) {
        console.error("Database error: " + event.target.error);
    }
}

const startApplication = (office) => {
 
    const menu = new mdc.iconButton.MDCIconButtonToggle(document.getElementById('menu'))
    menu.listen('MDCIconButtonToggle:change', function (event) {
        if (drawer.root.classList.contains('mdc-drawer--dismissible')) {
            if (drawer.root.classList.contains('default-open')) {
                drawer.open = false;
                drawer.root.classList.remove('default-open');
                return
            }
        }
        drawer.open = !drawer.open;
    });

    if (firebase.auth().currentUser.photoURL) {
        document.getElementById('user-logo').src = firebase.auth().currentUser.photoURL;
    }
    // get office id
    getOfficeId(office).then(officeId => {
        // get office activity 
        return getOfficeActivity(officeId)
    }).then(officeActivity => {
        const userProfileLogo = document.getElementById('user-logo');
        userProfileLogo.addEventListener('click', (ev) => {
           
            openProfileBox(ev);
        })
        appLoader.remove();
        if(window.location.pathname.split("/").indexOf("account")  > -1 || window.location.pathname.split("/").indexOf("account.html") > -1) {
            init(office, officeActivity.activityId)
            return
        }

        const dialog = new mdc.dialog.MDCDialog(document.getElementById('payment-dialog'));
        const dialogBody = document.getElementById('payment-dialog--body');
        const dialogTitle = document.getElementById('my-dialog-title');
        const renewBtn = document.getElementById('choose-plan-button');
        renewBtn.href = `./account.html#subscription-cont`;
        const schedule = officeActivity.schedule;
        const isUserFirstContact = officeActivity.attachment['First Contact'].value === firebase.auth().currentUser.phoneNumber;
        if (!hasMultipleOffice) {
            dialog.scrimClickAction = "";
        };
        if (!officeHasMembership(schedule)) {
            dialogTitle.textContent = 'You are just 1 step away from tracking your employees successfully.';
            dialogBody.textContent = 'Choose plan to renew now.';
            officeActivity.geopoint = {
                latitude: 0,
                longitude: 0
            };
            http('PUT', `${appKeys.getBaseUrl()}/api/activities/update`, officeActivity).then(res => {
                if (isUserFirstContact) {
                    dialog.open();
                    return
                }
                dialogBody.textContent = 'Please ask the business owner to complete the payment';
                dialog.open();
                renewBtn.classList.add('hidden')
            });
            return
        }

        if (isOfficeMembershipExpired(schedule)) {
            const diff = getDateDiff(schedule);
            if (diff > 3) {
                dialogTitle.textContent = 'Your plan has expired.'
                dialogBody.textContent = 'Choose plan to renew now.'
            }
            if (isUserFirstContact) {
                dialog.open();
                return
            };

            dialogBody.textContent = 'Please ask the business owner to renew the payment';
            dialog.open();
            renewBtn.classList.add('hidden')
            return
        }

        init(office, officeActivity.activityId)
    }).catch(console.error)

    //init drawer & menu for non-desktop devices

}

const openProfileBox = (event) => {
    event.stopPropagation();
    document.querySelector('.user-profile--logo').classList.add('focused')

    const el = document.querySelector('.profile-box');
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
    } else {
        closeProfileBox()
    };
    const name = firebase.auth().currentUser.displayName;
    const email = firebase.auth().currentUser.email;
    const photo = firebase.auth().currentUser.photoURL;

    if (photo) {
        document.getElementById('auth-image').src = photo;
    }
    document.getElementById('auth-name').textContent = name;
    document.getElementById('auth-email').textContent = email;



}

const closeProfileBox = () => {
    const el = document.querySelector('.profile-box');
    document.querySelector('.user-profile--logo').classList.remove('focused')
    el.classList.add('hidden');
}

const getOfficeId = (office) => {
    window.sessionStorage.setItem('office', office)
    return new Promise((resolve, reject) => {
        const officeIdSessionStorage = window.sessionStorage.getItem('officeId')
        if (officeIdSessionStorage) return resolve(window.sessionStorage.getItem('officeId'));

        window.database.transaction("meta").objectStore("meta").get("meta").onsuccess = function (event) {
            const record = event.target.result;
            if (record.officeId) {
                window.sessionStorage.setItem('officeId', record.officeId)
                resolve(record.officeId);
                return
            }
            http('GET', `${appKeys.getBaseUrl()}/api/office?office=${encodeURIComponent(office)}`).then(response => {
                if (!response.results.length) {
                    showSnacksApiResponse('Office not found')
                    return
                }
                const officeId = response.results[0].officeId;
                window.sessionStorage.setItem('officeId', officeId);
                window.database.transaction("meta", "readwrite").objectStore("meta").put({
                    meta: "meta",
                    office,
                    officeId
                });
                resolve(officeId);
            })
        }
    })
}




const officeList = (name) => {
    const li = createElement('li', {
        className: 'mdc-list-item'
    });
    li.dataset.value = name;
    li.innerHTML = `<span class="mdc-list-item__ripple"></span>
    <span class="mdc-list-item__text">${name}</span>`
    return li
}