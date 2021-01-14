function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var locationSearch = document.getElementById("location-search");
var employeeSearch = document.getElementById('employee-search');
var supervisorSearch = document.getElementById('supervisor-search');
var dutyStartDate = document.getElementById('duty-start-date');
var dutyEndDate = document.getElementById('duty-end-date');
var dutyStartTime = document.getElementById('duty-start-time');
var dutyEndTime = document.getElementById('duty-end-time');
var productSearch = document.getElementById('product-search');
var productList = document.getElementById('product-list');
var productRate = document.getElementById('product-rate');
var productQuantity = document.getElementById('product-quantity');
var formHeading = document.getElementById('form-heading');
var form = document.getElementById('manage-form');
var submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]');

var init = function init(office, officeId) {
  // check if we have activity id in url. 
  // if activity id is  found, then udpate the form else create
  var dutyLocation = new URLSearchParams(window.location.search).get('location');
  var formId = getFormId();
  var requestParams = getFormRequestParams();

  if (!dutyLocation) {
    document.querySelector('.duty-location').classList.remove('hidden');
  }
  /** manage start and end date */


  dutyStartDate.addEventListener('change', function (evt) {
    dutyEndDate.value = evt.target.value;
    dutyEndDate.min = evt.target.value;
  });
  dutyStartTime.addEventListener('change', function (evt) {
    dutyEndTime.value = evt.target.value;
    dutyEndTime.min = evt.target.value;
  });

  if (formId) {
    document.getElementById('form-heading').innerHTML = 'Update Duty';
    getActivity(formId).then(function (activity) {
      if (activity) {
        updateDuty(activity);
      }

      http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/activity/").concat(formId, "/")).then(function (res) {
        putActivity(res).then(updateDuty);
      });
    });
  } else {
    var hours = new Date().getHours();
    var minutes = new Date().getMinutes();
    var year = new Date().getFullYear();
    var month = new Date().getMonth() + 1;
    var date = new Date().getDate();
    dutyStartDate.value = "".concat(year, "-").concat(month < 10 ? '0' : '').concat(month, "-").concat(date < 10 ? '0' : '').concat(date);
    dutyStartTime.value = "".concat(hours < 10 ? '0' : '').concat(hours, ":").concat(minutes < 10 ? '0' : '').concat(minutes);
  }

  dutyStartDate.dispatchEvent(new Event('change', {
    'bubbles': true
  }));
  dutyStartTime.dispatchEvent(new Event('change', {
    'bubbles': true
  }));
  locationAdditionComponent({
    input: locationSearch,
    officeId: officeId
  });
  locationSearch.addEventListener('selected', function (ev) {
    locationSearch.value = ev.detail.locationName;
  });
  userAdditionComponent({
    input: supervisorSearch,
    officeId: officeId,
    singleChip: true
  });
  userAdditionComponent({
    input: employeeSearch,
    officeId: officeId
  });
  supervisorSearch.addEventListener('selected', function (ev) {
    var user = ev.detail.user;
    supervisorSearch.value = user.employeeName || user.displayName || user.phoneNumber;
    supervisorSearch.dataset.number = user.phoneNumber;
  });
  employeeSearch.addEventListener('selected', function (ev) {
    var user = ev.detail.user;
    employeeSearch.dataset.number += user.phoneNumber + ',';
    employeeSearch.value = '';
  });
  employeeSearch.addEventListener('removed', function (ev) {
    var user = ev.detail.user;
    var split = employeeSearch.dataset.number.split(",");
    var index = split.indexOf(user.phoneNumber);
    split.splice(index, 1);
    var string = split.join(",");
    employeeSearch.dataset.number = string;
    employeeSearch.value = '';
  });
  var productMenu = new mdc.menu.MDCMenu(document.getElementById('product-menu'));
  /**  manage products */

  getTypeList({
    officeId: officeId,
    template: 'product',
    loadOnce: true
  }, function (products) {
    initializeSearch(productSearch, function (value) {
      var tx = window.database.transaction("types");
      var store = tx.objectStore("types");
      var index = store.index("search_key_name");
      var matchedProducts = [];

      index.openCursor(IDBKeyRange.bound(value.toLowerCase(), value.toLowerCase() + "\uFFFF")).onsuccess = function (ev) {
        var cursor = ev.target.result;
        if (!cursor) return;
        matchedProducts.push(cursor.value);
        cursor.continue();
      };

      tx.oncomplete = function () {
        productList.innerHTML = '';
        matchedProducts.filter(function (product) {
          return document.getElementById(product.id) ? null : product;
        }).forEach(function (product) {
          productList.appendChild(productMenuLi(product));
        });

        if (matchedProducts.length > 0) {
          productMenu.open = true;
        }
      };
    }, 1000);
  });
  productMenu.listen('MDCMenu:selected', function (event) {
    var product = JSON.parse(event.detail.item.dataset.product);
    menu.open = false;
    productSearch.value = '';
    appendProductCard(product);
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    submitBtn.classList.add('active');
    var activityBody = createActivityBody();
    activityBody.setOffice(office);
    activityBody.setActivityId(formId);
    activityBody.setTemplate('duty');
    activityBody.setSchedule([{
      startTime: moment("".concat(dutyStartDate.value, "T").concat(dutyStartTime.value)).valueOf(),
      endTime: moment("".concat(dutyEndDate.value, "T").concat(dutyEndTime.value)).valueOf(),
      name: 'Duty'
    }]);
    activityBody.setAttachment('Location', dutyLocation || locationSearch.value, 'string');

    var selectedProducts = _toConsumableArray(document.querySelectorAll('.add-product-card.selected-product')).map(function (el) {
      if (el.dataset.name) {
        return {
          name: el.dataset.name,
          rate: Number(el.querySelector('.product-rate input').value),
          quantity: Number(el.querySelector('.product-quantity input').value)
        };
      }

      ;
    });

    activityBody.setAttachment('Products', selectedProducts, 'product');
    activityBody.setAttachment('Supervisor', supervisorSearch.dataset.number, 'phoneNumber');
    activityBody.setAttachment('Include', employeeSearch.dataset.number, 'string');
    activityBody.setAttachment('Date', moment(dutyStartDate.value).format('Do MMM YYYY'), 'string');
    var requestBody = activityBody.get();
    console.log(requestBody);
    http(requestParams.method, requestParams.url, requestBody).then(function (res) {
      var message = 'Duty created';

      if (requestParams.method === 'PUT') {
        message = 'Duty updated';
      }

      ;

      if (requestParams.method === 'PUT') {
        putActivity(requestBody).then(function (res) {
          handleFormButtonSubmitSuccess(submitBtn, message);
        });
        return;
      }

      handleFormButtonSubmitSuccess(submitBtn, message);
    }).catch(function (err) {
      handleFormButtonSubmit(submitBtn, err.message);
    });
  });
};

var createProductOption = function createProductOption(product) {
  var li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.dataset.value = product.name;
  li.dataset.product = JSON.stringify(product);
  li.innerHTML = "  <span class=\"mdc-list-item__ripple\"></span>\n    <span class=\"mdc-list-item__text\">".concat(product.name, "</span>");
  return li;
};

var productMenuLi = function productMenuLi(product) {
  var li = createElement('li', {
    className: 'mdc-list-item',
    attrs: {
      role: 'menuitem'
    }
  });
  li.dataset.product = JSON.stringify(product);
  var span = createElement('span', {
    textContent: product.name,
    className: 'mdc-list-item__text'
  });
  li.appendChild(span);
  new mdc.ripple.MDCRipple(li);
  return li;
};

var appendProductCard = function appendProductCard(product) {
  var node = document.getElementById('clone-node').cloneNode(true);
  node.querySelector('.remove').addEventListener('click', function () {
    node.remove();
  });
  node.id = product.id;
  node.dataset.name = product.name;
  node.querySelector('.product-name-heading').textContent = product.name;
  node.querySelector('.product-rate input').value = product.rate || '';
  node.querySelector('.product-quantity input').value = product.quantity || '';
  node.classList.remove('hidden');
  node.classList.add('selected-product');
  document.querySelector('.product-manage').appendChild(node);
};

var updateDuty = function updateDuty(duty) {
  locationSearch.value = duty.attachment['Location'].value;
  dutyStartDate.value = moment(duty.schedule[0].startTime).format('YYYY-MM-DD');
  dutyStartTime.value = moment(duty.schedule[0].startTime).format('HH:mm');
  dutyEndDate.value = moment(duty.schedule[0].endTime).format('YYYY-MM-DD');
  dutyEndTime.value = moment(duty.schedule[0].endTime).format('HH:mm');
  var supervisorNumber = duty.attachment['Supervisor'].value;
  var employeeNumbers = duty.attachment['Include'].value;
  supervisorSearch.value = supervisorNumber || '';
  supervisorSearch.dataset.number = supervisorNumber;
  employeeSearch.dataset.number = employeeNumbers;

  window.database.transaction('users').objectStore('users').get(supervisorNumber).onsuccess = function (e) {
    supervisorSearch.value = e.target.result.employeeName;
  };

  if (duty.assignees) {
    duty.assignees.forEach(function (assignee) {
      var chip = createUserChip(assignee);

      if (document.querySelector(".mdc-chip[data-number=\"".concat(assignee.phoneNumber, "\"]"))) {
        document.querySelector(".mdc-chip[data-number=\"".concat(assignee.phoneNumber, "\"]")).remove();
      }

      if (assignee.phoneNumber !== supervisorNumber) {
        document.getElementById('employee-chipset').appendChild(chip);
      }
    });
  }

  new mdc.chips.MDCChipSet(document.getElementById('employee-chipset'));
  duty.attachment['Products'].value.forEach(function (product) {
    if (product.name && !document.querySelector(".add-product-card[data-name=\"".concat(product.name, "\"]"))) {
      appendProductCard(product);
    }
  });
};