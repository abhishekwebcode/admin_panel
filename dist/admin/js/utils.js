function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/** callback is used because activity returned by this function needs to update dom 2 times */
var getCompanyDetails = function getCompanyDetails(officeId, onSuccess, onError) {
  getActivity(officeId).then(function (record) {
    if (record) {
      onSuccess(record);
    }

    ;
    http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/activity/").concat(officeId, "/")).then(function (officeActivity) {
      putActivity(officeActivity).then(onSuccess);
    }).catch(onError);
  });
};

var getActivity = function getActivity(activityId) {
  return new Promise(function (resolve, reject) {
    var tx = window.database.transaction("activities");
    var store = tx.objectStore("activities");

    store.get(activityId).onsuccess = function (e) {
      return resolve(e.target.result);
    };
  });
};

var putActivity = function putActivity(activity) {
  return new Promise(function (resolve, reject) {
    var tx = window.database.transaction("activities", "readwrite");
    var store = tx.objectStore("activities");

    store.put(activity).onsuccess = function () {
      return resolve(activity);
    };
  });
};

var getOfficeActivity = function getOfficeActivity(officeId) {
  return new Promise(function (resolve, reject) {
    getActivity(officeId).then(function (record) {
      // lengthy byt his will work for now
      //TODO : change wrangler file to clean paths for all .html & index pages
      // /admin/index.html -> /admin/
      if (shouldFetchOfficeActivity(record)) {
        http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/activity/").concat(officeId, "/")).then(function (officeActivity) {
          putActivity(officeActivity).then(resolve);
        }).catch(reject);
        return;
      }

      resolve(record);
    });
    return;
  });
};

var shouldFetchOfficeActivity = function shouldFetchOfficeActivity(record) {
  if (new URLSearchParams(window.location.search).has('renewd') || !record) return true;
  var fetch = false;

  switch (window.location.pathname) {
    case '/admin':
    case '/admin/index.html':
    case '/admin/company/manage.html':
    case '/admin/account':
    case '/admin/account.html':
      fetch = true;
      break;
  }

  return fetch;
};

var handleProfileDetails = function handleProfileDetails(officeId) {
  getCompanyDetails(officeId, updateCompanyProfile, console.error);
};

var updateCompanyProfile = function updateCompanyProfile(activity) {
  var companyLogo = document.getElementById('company-logo');
  var companyName = document.getElementById('company-name');
  var companyAddress = document.getElementById('company-address');
  var companyDescription = document.getElementById('company-description');
  var companyCategory = document.getElementById('company-category');

  if (activity.attachment['Company Logo'].value) {
    companyLogo.src = activity.attachment['Company Logo'].value;
  }

  companyName.textContent = activity.attachment['Name'].value;
  companyAddress.textContent = activity.attachment['Registered Office Address'] ? activity.attachment['Registered Office Address'].value : '';
  companyDescription.textContent = activity.attachment['Description'].value;
  companyCategory.textContent = activity.attachment['Category'] ? activity.attachment['Category'].value : '';
};
/**
 * format string to INR 
 * @param {string} money 
 * @returns {string} 
 */


var formatMoney = function formatMoney(money) {
  var number = Number(money.split(',').join(''));
  return number.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  });
};

var emptyCard = function emptyCard(text) {
  var div = createElement('div', {
    className: 'mdc-card mdc-card--outlined  empty-card'
  });
  div.innerHTML = "<span class='text-cont'>\n    <i class='material-icons'>info</i>\n    ".concat(text, "\n    </span>");
  return div;
};

var handleFormButtonSubmit = function handleFormButtonSubmit(button, text) {
  button.classList.remove('active');

  if (text) {
    showSnacksApiResponse(text);
  }
};

var handleFormButtonSubmitSuccess = function handleFormButtonSubmitSuccess(button, text) {
  handleFormButtonSubmit(button, text);
  setTimeout(function () {
    window.history.back();
  }, 1000);
};

var getFormId = function getFormId() {
  var search = new URLSearchParams(window.location.search);
  return search.get('id');
};

var getFormRequestParams = function getFormRequestParams() {
  var id = getFormId();
  return {
    method: id ? 'PUT' : 'POST',
    url: id ? "".concat(appKeys.getBaseUrl(), "/api/activities/update") : "".concat(appKeys.getBaseUrl(), "/api/activities/create")
  };
};
/** Debouncing utils */


var timerId = null;

var debounce = function debounce(func, delay, value) {
  clearTimeout(timerId);
  timerId = setTimeout(function () {
    func(value);
  }, delay);
};

var initializeSearch = function initializeSearch(input, callback, delay) {
  input.addEventListener('input', function (ev) {
    var value = ev.currentTarget.value.trim().toLowerCase();
    debounce(callback, delay, value);
  });
};

var validatePhonNumber = function validatePhonNumber(iti) {
  var error = iti.getValidationError();
  var result = {
    message: '',
    isValid: false
  };

  if (error !== 0) {
    result.message = getPhoneFieldErrorMessage(error);
    return result;
  }

  if (!iti.isValidNumber()) {
    result.message = 'Invalid number. Please check again';
    return result;
  }

  ;
  result.isValid = true;
  return result;
};

var createSubscription = function createSubscription(office, subscriptionName) {
  var requestBody = {
    attachment: {
      'Phone Number': {
        type: 'phoneNumber',
        value: firebase.auth().currentUser.phoneNumber
      },
      'Template': {
        type: 'string',
        value: subscriptionName
      }
    },
    office: office,
    share: [],
    venue: [],
    schedule: [],
    geopoint: {
      latitude: 0,
      longitude: 0
    },
    template: 'subscription'
  };
  return http('POST', "".concat(appKeys.getBaseUrl(), "/api/activities/create"), requestBody);
};

var formatCreatedTime = function formatCreatedTime(timestamp) {
  if (!timestamp) return '';
  return moment(timestamp).calendar(null, {
    sameDay: 'hh:mm A',
    lastDay: '[Yesterday]',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd',
    lastWeek: 'DD/MM/YY',
    sameElse: 'DD/MM/YY'
  });
};

var formatDutyTime = function formatDutyTime(timestamp) {
  return moment(timestamp).calendar(null, {
    sameDay: 'hh:mm A',
    lastDay: '[Yesterday] hh:mm A',
    nextDay: '[Tomorrow] hh:mm A',
    nextWeek: 'dddd',
    lastWeek: 'DD/MM/YY',
    sameElse: 'DD/MM/YY'
  });
};

var createActivityBody = function createActivityBody() {
  var object = {
    attachment: {},
    venue: [],
    schedule: [],
    office: '',
    activityId: '',
    template: '',
    share: [],
    geopoint: {
      latitude: 0,
      longitude: 0
    }
  };
  return {
    setAttachment: function setAttachment(name, value, type) {
      object.attachment[name] = {
        value: value,
        type: type
      };
    },
    setVenue: function setVenue(venue) {
      object.venue = venue;
    },
    setSchedule: function setSchedule(schedule) {
      object.schedule = schedule;
    },
    setOffice: function setOffice(office) {
      object.office = office;
    },
    setTemplate: function setTemplate(template) {
      object.template = template;
    },
    setActivityId: function setActivityId(activityId) {
      object.activityId = activityId;
    },
    setShare: function setShare(share) {
      object.share = share;
    },
    get: function get() {
      return object;
    }
  };
};

var toggleFabList = function toggleFabList(parentButton) {
  parentButton.querySelector('.mdc-fab__icon').classList.toggle('is-active');

  if (document.getElementById('drawer-scrim')) {
    document.getElementById('drawer-scrim').classList.toggle('block');
  }

  document.querySelectorAll('.fabs .fab').forEach(function (el) {
    el.classList.toggle('is-visible');
  });
};

var appLoader = function () {
  return {
    show: function show() {
      var div = createElement('div', {
        className: 'initializing-box mdc-elevation--z4'
      });
      div.innerHTML = " <div class=\"straight-loader\"></div>\n        <p>Please wait...</p>";
      document.getElementById('app-loader').innerHTML = div.outerHTML;
      document.querySelector('.mdc-drawer-app-content').classList.add('initializing-db');
      document.querySelector('.mdc-drawer').classList.add('hidden');
    },
    remove: function remove() {
      document.getElementById('app-loader').innerHTML = '';
      document.querySelector('.mdc-drawer-app-content').classList.remove('initializing-db');
      document.querySelector('.mdc-drawer').classList.remove('hidden');
    }
  };
}();

var userStatusChange = function userStatusChange(userActivity) {
  return new Promise(function (resolve, reject) {
    http('POST', "".concat(appKeys.getBaseUrl(), "/api/services/changeUserStatus"), {
      phoneNumber: userActivity.attachment['Phone Number'].value,
      office: userActivity.office
    }).then(function () {
      if (!userActivity.activityId) return Promise.resolve();
      userActivity.status === 'CANCELLED';
      return putActivity(userActivity);
    }).then(function () {
      return updateUser(userActivity.attachment['Phone Number'].value, {
        employeeStatus: userActivity.activityId ? 'CANCELLED' : null
      });
    }).then(function () {
      localStorage.removeItem('selected_user');
      setTimeout(function () {
        return resolve();
      }, 4000);
    }).catch(reject);
  });
};

var updateUser = function updateUser(phonenumber, attr) {
  return new Promise(function (resolve) {
    var tx = window.database.transaction('users', 'readwrite');
    var store = tx.objectStore('users');

    store.get(phonenumber).onsuccess = function (e) {
      var record = e.target.result;

      var updatedRec = _extends(record, attr);

      store.put(updatedRec).onsuccess = function () {
        resolve(true);
      };
    };
  });
};

var isUserActive = function isUserActive(user) {
  if (!user) return;
  if (user.employeeStatus === 'CANCELLED') return;
  return !(!user.employeeId && !user.adminId && !user.subscriptions.length);
};

var getTypeList = function getTypeList(props, onSuccess, onError) {
  var officeId = props.officeId;
  var limit = props.limit;
  var loadOnce = props.loadOnce;
  var template = props.template;

  window.database.transaction("types").objectStore("types").index("template").getAll(template, limit).onsuccess = function (e) {
    var records = e.target.result.filter(function (rec) {
      return rec.officeId === officeId;
    });
    onSuccess(records);
    if (records.length && loadOnce) return;
    http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/type?template=").concat(template).concat(limit ? "&limit=".concat(limit, "&start=0") : '')).then(function (response) {
      var tx = window.database.transaction("types", "readwrite");
      var store = tx.objectStore("types");
      response.results.forEach(function (result) {
        result.template = template;
        result.search_key_name = result.name.toLowerCase();
        store.put(result);
      });

      tx.oncomplete = function () {
        onSuccess(response.results);
      };
    }).catch(onError);
  };
};