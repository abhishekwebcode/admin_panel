function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/*
Custom event polyfill for IE
*/
(function () {
  if (typeof window.CustomEvent === "function") return false;

  function CustomEvent(event, params) {
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: null
    };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  window.CustomEvent = CustomEvent;
})();
/**
 * polyfill for toggleAttribute
 */


if (!Element.prototype.toggleAttribute) {
  Element.prototype.toggleAttribute = function (name, force) {
    if (force !== void 0) force = !!force;

    if (this.hasAttribute(name)) {
      if (force) return true;
      this.removeAttribute(name);
      return false;
    }

    if (force === false) return false;
    this.setAttribute(name, "");
    return true;
  };
}

;
/** Polyfill for Childnode.remove() */

(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('remove')) {
      return;
    }

    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        if (this.parentNode === null) {
          return;
        }

        this.parentNode.removeChild(this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

window.addEventListener('load', function () {
  // make ripple work correctly
  new mdc.ripple.MDCRipple(journeyPrevBtn).unbounded = true;
  firebase.auth().onAuthStateChanged(function (user) {
    // if user is logged out.
    if (user) {
      // history.pushState(history.state, null, basePathName + `#`)
      initJourney();
      return;
    }

    redirect('/index.html');
  });
}); // root element into which view will get updated

var journeyContainer = document.getElementById("journey-container");
var journeyHeadline = document.getElementById('journey-text'); // cta-actions container;

var actionsContainer = document.querySelector('.cta-actions'); // prev button

var journeyPrevBtn = document.getElementById('journey-prev'); // linearProgressBar for onboarding

var journeyBar = new mdc.linearProgress.MDCLinearProgress(document.getElementById('onboarding-progress')); // default path name;

var basePathName = window.location.pathname;
/**
 * On clicking back navigation in browser or previous button,
 * browser history will pop current state &
 * load the prev view
 */

window.addEventListener('popstate', function (ev) {
  if (localStorage.getItem('completed') === "true") {
    for (var i = 0; i < 50; i++) {
      history.pushState(history.state, null, null);
    }

    ;
    localStorage.removeItem("completed");
    redirect("/");
    return;
  }

  ;
  var hash = window.location.hash;
  var view = hash.replace('#', '');
  var fnName = redirect;

  switch (view) {
    case 'welcome':
      fnName = initFlow;
      break;

    case 'category':
      fnName = categoryFlow;
      break;

    case 'office':
      fnName = officeFlow;
      break;

    case 'choosePlan':
      fnName = choosePlan;
      break;

    case 'payment':
      history.pushState(null, null, basePathName + "".concat(window.location.search, "#employees"));
      fnName = addEmployeesFlow;
      break;

    case 'employees':
      fnName = addEmployeesFlow;
      break;

    default:
      fnName = redirect;
      break;
  }

  if (fnName === redirect) {
    redirect('/join');
    return;
  }

  fnName();
  decrementProgress();
});
/**
 *  progress value is set from 0 to 1
 *  there are 6 onboarding steps . so each increment and decrement is updated by 
 *  0.16666666666666666
 */

/**
 * 
 * Increment progress bar by 1/6th
 */

var incrementProgress = function incrementProgress() {
  journeyBar.progress = journeyBar.foundation.progress + 0.16666666666666666;
};
/**
 * 
 * Decrement progress bar by 1/6th
 */


var decrementProgress = function decrementProgress() {
  journeyBar.progress = journeyBar.foundation.progress - 0.16666666666666666;
};

var initJourney = function initJourney() {
  onboarding_data_save.init();
  journeyPrevBtn.addEventListener('click', function (e) {
    history.back();
  });
  firebase.auth().currentUser.getIdTokenResult().then(function (idTokenResult) {
    //if new user start with welcome screen
    var searchParams = new URLSearchParams(window.location.search);
    var newOfficeCreation = searchParams.get('createNew');
    var isRenew = searchParams.get('renew') && searchParams.get('renew') === "1";

    if (!isAdmin(idTokenResult) || newOfficeCreation) {
      onboarding_data_save.set({
        status: 'PENDING'
      });
      history.pushState(history.state, null, basePathName + "?new_user=1#welcome");
      initFlow();
      return;
    }

    ;
    var office = searchParams.get('office');
    journeyContainer.innerHTML = "<div class='center-screen'><div class=\"lds-ring\"><div></div><div></div><div></div><div></div></div><p>Please wait</p></div>";
    http('GET', "".concat(appKeys.getBaseUrl(), "/api/office?office=").concat(office)).then(function (officeMeta) {
      if (!officeMeta.results.length) {
        onboarding_data_save.set({
          status: 'PENDING'
        });
        history.pushState(history.state, null, basePathName + "?new_user=1#welcome");
        initFlow();
        return;
      }

      return http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeMeta.results[0].officeId, "/activity/").concat(officeMeta.results[0].officeId, "/"));
    }).then(function (officeActivity) {
      localStorage.removeItem('completed');
      var data = {
        name: officeActivity.office,
        officeId: officeActivity.activityId,
        firstContact: officeActivity.creator,
        category: officeActivity.attachment.Category ? officeActivity.attachment.Category.value : '',
        registeredOfficeAddress: officeActivity.attachment['Registered Office Address'].value,
        pincode: officeActivity.attachment.Pincode ? officeActivity.attachment.Pincode.value : '',
        description: officeActivity.attachment.Description.value,
        yearOfEstablishment: officeActivity.attachment['Year Of Establishment'] ? officeActivity.attachment['Year Of Establishment'].value : '',
        template: 'office',
        companyLogo: officeActivity.attachment['Company Logo'] ? officeActivity.attachment['Company Logo'].value : '',
        schedule: officeActivity.schedule,
        endTime: officeActivity.schedule[0].endTime,
        pstart: getPaymentStart(officeActivity.schedule[0].endTime),
        pend: getPaymentEnd(officeActivity.schedule[0].endTime)
      };
      onboarding_data_save.set(data);
      onboarding_data_save.set({
        status: 'COMPLETED'
      });

      if (isRenew) {
        handlePayment(data, Number(searchParams.get("plan")));
        return;
      }

      ;
      history.pushState(history.state, null, basePathName + "#choosePlan");
      choosePlan();
    }).catch(console.error);
  });
};

var getPaymentStart = function getPaymentStart(endTime) {
  var currentTs = Date.now();
  if (currentTs > endTime) return currentTs;
  return endTime;
};

var getPaymentEnd = function getPaymentEnd(endTime) {
  var searchParams = new URLSearchParams(window.location.search);
  var currentTs = Date.now();
  var time = currentTs > endTime ? currentTs : endTime;
  var duration = searchParams.get('renew') ? getDuration(Number(searchParams.get('plan')), time) : '';
  return duration;
};

var nextButton = function nextButton() {
  var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'Next';

  if (document.getElementById('journey-next')) {
    document.getElementById('journey-next').remove();
  }

  var button = createElement('button', {
    className: 'mdc-button mdc-button--raised',
    id: 'journey-next'
  });
  button.innerHTML = " <div class=\"mdc-button__ripple\"></div>\n        <span class=\"mdc-button__label\">".concat(text, "</span>\n        <div class='straight-loader button hidden'></div>\n        ");
  new mdc.ripple.MDCRipple(button);
  return {
    element: button,
    setLoader: function setLoader() {
      button.style.pointerEvents = 'none';
      button.querySelector('.straight-loader').classList.remove('hidden');
      button.querySelector('.mdc-button__label').classList.add('hidden');
    },
    removeLoader: function removeLoader() {
      button.style.pointerEvents = 'all';
      button.querySelector('.straight-loader').classList.add('hidden');
      button.querySelector('.mdc-button__label').classList.remove('hidden');
    }
  };
};

function initFlow() {
  journeyPrevBtn.classList.remove('hidden');
  journeyHeadline.textContent = 'Welcome to easy tracking';
  var secondaryText = createElement('div', {
    className: 'onboarding-headline--secondary',
    textContent: 'Lets get started! Enter your details'
  });
  var nameTitle = createElement('div', {
    className: 'onboarding-content--text',
    textContent: 'Name'
  });
  var emailTitle = createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: 'Email'
  });
  var nameField = textFieldOutlinedWithoutLabel({
    required: true,
    autocomplete: "name",
    value: firebase.auth().currentUser.displayName || ''
  });
  var emailField = textFieldOutlinedWithoutLabel({
    required: true,
    autocomplete: "email",
    type: 'email',
    value: firebase.auth().currentUser.email || ''
  });
  var frag = document.createDocumentFragment();
  frag.appendChild(secondaryText);
  frag.appendChild(nameTitle);
  frag.appendChild(nameField);
  frag.appendChild(textFieldHelper());
  frag.appendChild(emailTitle);
  frag.appendChild(emailField);
  frag.appendChild(textFieldHelper());
  var nameFieldInit = new mdc.textField.MDCTextField(nameField);
  var emailFieldInit = new mdc.textField.MDCTextField(emailField);
  var nextBtn = nextButton();
  nextBtn.element.addEventListener('click', function (ev) {
    if (!nameFieldInit.value) {
      setHelperInvalid(nameFieldInit, 'Enter your name');
      return;
    }

    if (!emailFieldInit.value) {
      setHelperInvalid(emailFieldInit, 'Enter your email');
      return;
    }

    setHelperValid(nameFieldInit);
    setHelperValid(emailFieldInit);
    var firstContact = {
      displayName: nameFieldInit.value,
      email: emailFieldInit.value,
      phoneNumber: firebase.auth().currentUser.phoneNumber
    };
    nextBtn.setLoader();
    handleAuthUpdate(firstContact).then(function () {
      onboarding_data_save.set({
        firstContact: firstContact
      });
      history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#category"));
      incrementProgress();
      categoryFlow();
      journeyPrevBtn.classList.remove('hidden');
    }).catch(function (error) {
      nextBtn.removeLoader();
      var message = getEmailErrorMessage(error);

      if (message) {
        setHelperInvalid(emailFieldInit, message);
        return;
      }

      sendErrorLog({
        message: authError.message,
        stack: authError.stack
      });
    });
  });
  journeyContainer.innerHTML = '';
  journeyContainer.appendChild(frag);
  actionsContainer.appendChild(nextBtn.element);
  nameFieldInit.input_.addEventListener('focus', function () {
    setTimeout(function () {
      document.body.scrollTop = 80;
    }, 600);
  });
}

function categoryFlow() {
  document.body.scrollTop = 0;
  journeyHeadline.innerHTML = 'Choose the category that fits your business best';
  var grid = createElement('div', {
    className: 'mdc-layout-grid'
  });
  var container = createElement('div', {
    className: 'category-container mdc-layout-grid__inner'
  });
  var selectedDiv;
  var otherCateogryInput;
  var nextBtn = nextButton();
  nextBtn.element.disabled = true;
  categoriesDataset().forEach(function (category) {
    var div = createElement('div', {
      className: 'category-box mdc-card mdc-elevation--z4 mdc-layout-grid__cell--span-2-phone mdc-layout-grid__cell'
    });
    div.dataset.name = category.name;
    var svgCont = createElement('div', {
      className: 'cateogry-icon'
    });
    category.icon.then(function (svg) {
      svgCont.innerHTML = svg;
    });
    var text = createElement('div', {
      className: 'category-text',
      textContent: category.name
    });
    div.appendChild(svgCont);
    div.appendChild(text);
    div.addEventListener('click', function (ev) {
      if (selectedDiv) {
        selectedDiv.classList.remove('category-active');
      }

      selectedDiv = div;
      selectedDiv.classList.add('category-active');

      if (document.querySelector('.input-div')) {
        document.querySelector('.input-div').remove();
      }

      ;

      if (category.name === 'Others') {
        var field = categoryInputField(container, '');
        otherCateogryInput = field;
        field.root.scrollIntoView();
      }

      ;
      nextBtn.element.disabled = false;
    });
    container.appendChild(div);
  });
  grid.appendChild(container);
  nextBtn.element.addEventListener('click', function () {
    var selectedCategoryName = selectedDiv.dataset.name;

    if (selectedCategoryName === 'Others') {
      if (!otherCateogryInput.value) {
        setHelperInvalid(otherCateogryInput, 'Enter a category');
        return;
      }

      setHelperValid(otherCateogryInput);
      selectedCategoryName = otherCateogryInput.value;
    } // onboarding_data_save.set({
    //     'category': selectedCategoryName
    // })


    history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#office"));
    officeFlow(selectedCategoryName);
  });
  actionsContainer.appendChild(nextBtn.element);
  journeyContainer.innerHTML = '';
  journeyContainer.appendChild(grid);

  if (onboarding_data_save.get().category) {
    var el = container.querySelector("[data-name=\"".concat(onboarding_data_save.get().category, "\"]"));

    if (!el) {
      el = container.querySelector("[data-name=\"Others\"]");
      var field = categoryInputField(container, onboarding_data_save.get().category);
      otherCateogryInput = field;
      field.root.scrollIntoView();
    }

    el.classList.add('category-active');
    selectedDiv = el;
    nextBtn.element.disabled = false;
  }
}

var categoryInputField = function categoryInputField(container, inputValue) {
  var inputDiv = createElement('div', {
    className: 'input-div mt-10 mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet mdc-layout-grid__cell--span-12-desktop'
  });
  var inputField = textFieldOutlined({
    type: 'text',
    required: true,
    value: inputValue,
    label: 'Enter your cateogry',
    id: 'other-category-input'
  });
  inputDiv.appendChild(inputField);
  inputDiv.appendChild(textFieldHelper());
  container.appendChild(inputDiv);
  return new mdc.textField.MDCTextField(inputField);
};

var categoriesDataset = function categoriesDataset() {
  var categories = [{
    name: 'Security service',
    icon: svgLoader('./img/category/security.svg')
  }, {
    name: 'Maintenance',
    icon: svgLoader('./img/category/maintenance.svg')
  }, {
    name: 'House keeping',
    icon: svgLoader('./img/category/housekeeping.svg')
  }, {
    name: 'Sales',
    icon: svgLoader('./img/category/salesman.svg')
  }, {
    name: 'Facility management',
    icon: svgLoader('./img/category/facility-management.svg')
  }, {
    name: 'Inspection',
    icon: svgLoader('./img/category/inspection.svg')
  }, {
    name: 'Audit',
    icon: svgLoader('./img/category/audit2.svg')
  }, {
    name: 'Compliance',
    icon: svgLoader('./img/category/compliance3.svg')
  }, {
    name: 'Others',
    icon: svgLoader('./img/category/others.svg')
  }];
  return categories;
};

var svgLoader = function svgLoader(source) {
  return new Promise(function (resolve, reject) {
    if (!window.fetch) {
      var request = new XMLHttpRequest();
      request.open('GET', source);
      request.setRequestHeader('Content-Type', 'image/svg+xml');

      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          resolve(request.responseText);
          return;
        }
      };

      request.send();
      return;
    }

    fetch(source, {
      headers: new Headers({
        'content-type': 'image/svg+xml',
        mode: 'no-cors'
      }),
      method: 'GET'
    }).then(function (response) {
      return response.text();
    }).then(resolve);
  });
};

function officeFlow() {
  var category = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : onboarding_data_save.get().category;
  incrementProgress();
  journeyHeadline.innerHTML = 'Tell us about your company';
  var officeContainer = createElement('div', {
    className: 'office-container'
  });
  var savedData = onboarding_data_save.get();
  var companyName = textFieldOutlinedWithoutLabel({
    required: true,
    id: 'company-name',
    autocomplete: 'organization',
    value: savedData.name || ''
  });
  var year = textFieldOutlined({
    type: 'number',
    label: 'Year',
    id: 'year',
    maxlength: '4',
    pattern: "\d*",
    autocomplete: 'bday-year',
    max: new Date().getFullYear(),
    value: savedData.yearOfEstablishment || '',
    min: 1900
  });
  var logoCont = createElement('div', {
    className: 'logo-container'
  });
  var actionCont = createElement('div');
  var logoText = createElement('div', {
    className: 'logo-text',
    textContent: 'Company logo'
  });
  var logo = createElement('input', {
    type: 'file',
    accept: 'image/*'
  });
  var companyLogo; // open file explorer and get image

  logo.addEventListener('change', function (ev) {
    getImageBase64(ev).then(function (base64) {
      companyLogo = base64;

      if (document.querySelector('.image-cont')) {
        document.querySelector('.image-cont').remove();
      }

      logoCont.appendChild(createImage(companyLogo, logo, companyLogo));
    }).catch(console.error);
  });
  actionCont.appendChild(logoText);
  actionCont.appendChild(logo);
  logoCont.appendChild(actionCont);

  if (savedData.companyLogo) {
    companyLogo = savedData.companyLogo;
    logoCont.appendChild(createImage(companyLogo, logo, companyLogo));
  }

  ;
  var address = textAreaOutlined({
    required: true,
    label: 'Address',
    autocomplete: 'address-line1',
    id: 'address',
    rows: 2,
    value: savedData.registeredOfficeAddress || '',
    cols: 8
  });
  var pincode = textFieldOutlinedWithoutLabel({
    required: true,
    type: 'number',
    label: 'PIN code',
    autocomplete: 'postal-code',
    value: savedData.pincode || ''
  });
  var description = textAreaOutlined({
    label: 'Description',
    rows: 4,
    cols: 8,
    id: 'description',
    value: savedData.description || ''
  });
  var frag = document.createDocumentFragment();
  officeContainer.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: "Company name"
  }));
  officeContainer.appendChild(companyName);
  officeContainer.appendChild(textFieldHelper());
  officeContainer.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: "When was your company established ?"
  }));
  officeContainer.appendChild(year);
  officeContainer.appendChild(textFieldHelper());
  officeContainer.appendChild(logoCont);
  officeContainer.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: "Company's address"
  }));
  officeContainer.appendChild(address);
  officeContainer.appendChild(textFieldHelper());
  officeContainer.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: "PIN code"
  }));
  officeContainer.appendChild(pincode);
  officeContainer.appendChild(textFieldHelper());
  officeContainer.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: "Description"
  }));
  officeContainer.appendChild(description);
  officeContainer.appendChild(textFieldHelper());
  frag.appendChild(officeContainer);
  var inputFields = {
    name: new mdc.textField.MDCTextField(companyName),
    address: new mdc.textField.MDCTextField(address),
    year: new mdc.textField.MDCTextField(year),
    pincode: new mdc.textField.MDCTextField(pincode),
    description: new mdc.textField.MDCTextField(description)
  };
  /**
   * handle listeners for name,year & Address field to autofill description;
   * 
   */

  inputFields.description.input_.addEventListener('input', function () {
    if (!inputFields.description.value.trim()) {
      inputFields.description.input_.dataset.typed = "no";
    } else {
      inputFields.description.input_.dataset.typed = "yes";
    }
  });
  [inputFields.name.input_, inputFields.year.input_, inputFields.address.input_].forEach(function (el) {
    el.addEventListener('input', function (ev) {
      handleOfficeDescription(category);
    });
  });
  var nxtButton = nextButton();
  nxtButton.element.addEventListener('click', function () {
    if (!inputFields.name.value) {
      setHelperInvalid(inputFields.name, 'Enter your company name');
      return;
    }

    ;

    if (!inputFields.address.value) {
      setHelperInvalid(inputFields.address, 'Enter your company address');
      return;
    }

    ;

    if (inputFields.year.value && !isValidYear(inputFields.year.value)) {
      setHelperInvalid(inputFields.year, 'Enter correct year');
      return;
    }

    isValidPincode(inputFields.pincode.value).then(function (isValid) {
      if (!isValid) {
        setHelperInvalid(inputFields.pincode, 'Enter correct PIN code');
        return;
      }

      var officeData = {
        name: inputFields.name.value,
        registeredOfficeAddress: inputFields.address.value,
        pincode: inputFields.pincode.value,
        description: inputFields.description.value,
        yearOfEstablishment: inputFields.year.value,
        companyLogo: companyLogo || "",
        category: category,
        template: 'office',
        timezone: "Asia/Kolkata"
      };

      if (!shouldProcessRequest(savedData, officeData)) {
        handleOfficeRequestSuccess(officeData);
        return;
      }

      var officeRequest = createRequestBodyForOffice(officeData);
      nxtButton.setLoader();
      sendOfficeRequest(officeRequest).then(function (res) {
        if (res.officeId) {
          officeData.officeId = res.officeId;
        }

        officeData.pstart = Date.now();
        officeData.name = res.office;
        handleOfficeRequestSuccess(officeData);

        if (window.fbq) {
          fbq('trackCustom', 'Office Created');
        }

        sendAcqusition();
      }).catch(function (error) {
        nxtButton.removeLoader();
        var field;
        var message;

        if (error.message === "Office with the name '".concat(officeData.name, "' already exists")) {
          field = inputFields.name;
          message = "".concat(officeData.name, " already exists. Choose a differnt company name");
        }

        if (error.message === "Invalid registered address: '".concat(officeData.registeredOfficeAddress, "'")) {
          field = inputFields.address;
          message = "Enter a valid company address";
        }

        if (error.message === 'Pincode is not valid') {
          field = inputFields.pincode;
          message = 'PIN code is not correct';
        }

        ;

        if (field) {
          setHelperInvalid(field, message);
          return;
        }

        ;
        sendErrorLog({
          message: error.message,
          stack: error.stack
        });
      });
    });
  });
  journeyContainer.innerHTML = '';
  journeyContainer.appendChild(frag);
  actionsContainer.appendChild(nxtButton.element);
  document.body.scrollTop = 0;
}

;

var removeSpecialCharsInside = function removeSpecialCharsInside(str) {
  var reverseText = str.split('').reverse().join('');
  var firstIndex = new RegExp(/([a-zA-Z0-9])/, 'ig').exec(str).index;
  var lastIndex = new RegExp(/([a-zA-Z0-9])/, 'ig').exec(reverseText).index;
  return str.substring(firstIndex, str.length - lastIndex).trim();
};

var sendOfficeRequest = function sendOfficeRequest(officeRequest, retry) {
  return new Promise(function (resolve, reject) {
    if (officeRequest.method === 'PUT') {
      http(officeRequest.method, officeRequest.endpoint, officeRequest.data).then(resolve).catch(function (err) {
        if (err.message !== "unauthorized") return reject(err);
        retry++;

        if (retry > 3) {
          return reject(err);
        }

        setTimeout(function () {
          return sendOfficeRequest(officeRequest, retry).then(resolve).catch(reject);
        }, 1000);
      });
      return;
    }

    http(officeRequest.method, officeRequest.endpoint, officeRequest.data).then(resolve).catch(reject);
  });
};

var handleOfficeRequestSuccess = function handleOfficeRequestSuccess(officeData) {
  onboarding_data_save.set(officeData);
  onboarding_data_save.set({
    'category': officeData.category
  });
  history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#choosePlan"));
  incrementProgress();
  choosePlan();
};

var getPlans = function getPlans() {
  var schedule = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var plans = [{
    amount: 999,
    duration: '3 Months',
    preferred: true
  }, {
    amount: 2999,
    duration: 'Year',
    preferred: false
  }];

  if (!officeHasMembership(schedule)) {
    plans.push({
      amount: 0,
      duration: 'Free trial 3 days'
    });
  }

  return plans;
};

function choosePlan() {
  var officeData = onboarding_data_save.get();
  document.body.scrollTop = 0;
  journeyHeadline.innerHTML = 'Choose your plan';
  var ul = createElement('ul', {
    className: 'mdc-list'
  });
  ul.setAttribute('role', 'radiogroup');
  var plans = getPlans(officeData.schedule);
  plans.forEach(function (plan, index) {
    var li = createElement('li', {
      className: 'mdc-list-item plan-list'
    });
    li.setAttribute('role', 'radio');

    if (plan.preferred) {
      li.setAttribute('aria-checked', 'true');
      li.setAttribute('tabindex', '0');
    } else {
      li.setAttribute('aria-checked', 'false');
    }

    li.innerHTML = "\n        <span class=\"mdc-list-item__ripple\"></span>\n        <span class=\"mdc-list-item__graphic\">\n        <div class=\"mdc-radio\">\n          <input class=\"mdc-radio__native-control\"\n                type=\"radio\"\n                id=\"plan-list-radio-item-".concat(index, "\"\n                name=\"plan-list-radio-item-group\"\n                value=\"").concat(plan.amount, "\"\n                ").concat(plan.preferred ? 'checked' : '', "\n                >\n          <div class=\"mdc-radio__background\">\n            <div class=\"mdc-radio__outer-circle\"></div>\n            <div class=\"mdc-radio__inner-circle\"></div>\n          </div>\n        </div>\n      </span>\n      <label class=\"mdc-list-item__text\" for=\"plan-list-radio-item-").concat(index, "\">").concat(convertNumberToInr(plan.amount), " / ").concat(plan.duration, "</label>\n        ");
    new mdc.ripple.MDCRipple(li);
    ul.appendChild(li);
  });
  journeyContainer.innerHTML = '';
  journeyContainer.appendChild(ul);
  var ulInit = new mdc.list.MDCList(ul);
  console.log(ulInit);
  var nextBtn = nextButton();
  nextBtn.element.addEventListener('click', function () {
    nextBtn.setLoader();
    waitTillCustomClaimsUpdate(officeData.name, function () {
      var planSelected = plans[ulInit.selectedIndex].amount;
      officeData.pend = getDuration(planSelected, officeData.pstart);
      handlePayment(officeData, planSelected);
    });
  });
  actionsContainer.appendChild(nextBtn.element);
}

var handlePayment = function handlePayment(officeData, plan) {
  http('POST', "".concat(appKeys.getBaseUrl(), "/api/services/payment"), {
    orderAmount: plan,
    orderCurrency: 'INR',
    office: officeData.name,
    paymentType: "membership",
    paymentMethod: "pgCashfree",
    phoneNumber: firebase.auth().currentUser.phoneNumber,
    pstart: officeData.pstart,
    pend: officeData.pend
  }).then(function (res) {
    onboarding_data_save.set({
      plan: plan,
      orderId: res.orderId || '',
      paymentToken: res.paymentToken || ''
    });

    if (plan == 0) {
      history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#employees"));
      incrementProgress();
      addEmployeesFlow();
      return;
    }

    history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#payment"));
    incrementProgress();
    managePayment();
  }).catch(function (err) {
    showSnacksApiResponse('An error occured. Try again later');

    try {
      nextBtn.removeLoader();
    } catch (e) {
      console.log(e);
    }
  });
};

var convertNumberToInr = function convertNumberToInr(amount) {
  return Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount).replace(/\D00$/, '');
};

function managePayment() {
  var officeData = onboarding_data_save.get();
  document.body.scrollTop = 0;
  journeyHeadline.innerHTML = 'Choose your payment method';
  console.log(officeData);
  var payment_modes = [{
    label: 'Add Debit/Credit/ATM Card',
    id: 'card'
  }, {
    label: 'Netbanking',
    id: 'netbanking'
  }, {
    label: 'UPI',
    id: 'upi'
  }, {
    label: 'Wallet',
    id: 'wallet'
  }];
  var div = createElement('form', {
    className: 'payment-form mdc-form'
  });
  var selectedMode;
  var nextBtn = nextButton('Pay ' + convertNumberToInr(officeData.plan));
  payment_modes.forEach(function (mode, index) {
    var cont = createElement('div', {
      className: 'payment-mode'
    });
    var paymentModeCont = createElement('div', {
      className: 'full-width inline-flex',
      style: 'width:100%'
    });
    paymentModeCont.appendChild(createRadio(mode.id, mode.label));
    cont.appendChild(paymentModeCont);

    if (mode.id === 'card') {
      var cardsLogo = createElement('div', {
        className: 'cards-logo'
      });
      cardsLogo.appendChild(createElement('img', {
        src: './img/brand-logos/visa.png'
      }));
      cardsLogo.appendChild(createElement('img', {
        src: './img/brand-logos/master_card.png'
      }));
      cardsLogo.appendChild(createElement('img', {
        src: './img/brand-logos/maestro.png'
      }));
      cardsLogo.appendChild(createElement('img', {
        src: './img/brand-logos/amex.jpg'
      }));
      cardsLogo.appendChild(createElement('img', {
        src: './img/brand-logos/diners_club_intl_logo.jpg'
      }));
      cardsLogo.appendChild(createElement('img', {
        src: './img/brand-logos/RuPay.jpg'
      }));
      cont.appendChild(cardsLogo);
    }

    var expanded = createElement('div', {
      className: 'payment-mode--expand hidden'
    });
    paymentModeCont.addEventListener('click', function () {
      document.querySelectorAll('.payment-mode--selected').forEach(function (el) {
        el.classList.remove('payment-mode--selected');
      });
      cont.classList.add('payment-mode--selected');
      paymentModeCont.querySelector('.mdc-radio input').checked;
      document.querySelectorAll('.payment-mode--expand').forEach(function (el) {
        if (el) {
          el.innerHTML = '';
          el.classList.add('hidden');
        }
      });
      expanded.classList.remove('hidden');
      var view;

      if (mode.id === 'card') {
        view = cardMode();
      }

      if (mode.id === 'upi') {
        view = upiMode();
      }

      ;

      if (mode.id === 'wallet') {
        view = walletMode();
      }

      if (mode.id === 'netbanking') {
        view = netBankingMode();
      }

      selectedMode = view;
      selectedMode.method = mode.id;
      expanded.innerHTML = '';
      nextBtn.element.removeAttribute('disabled');
      expanded.appendChild(view.element);
    });
    cont.appendChild(expanded);
    div.appendChild(cont);
  });

  if (!selectedMode) {
    nextBtn.element.setAttribute('disabled', 'true');
  }

  nextBtn.element.addEventListener('click', function () {
    var isValid = false;
    nextBtn.setLoader();
    var method = selectedMode.method;

    if (method === 'card') {
      isValid = isCardValid(selectedMode.fields);
    }

    if (method === 'upi') {
      isValid = isUpiValid(selectedMode.fields);
    }

    if (method === 'wallet') {
      isValid = isWalletValid(selectedMode.fields);
    }

    if (method === 'netbanking') {
      isValid = isNetbankingValid(selectedMode.fields);
    }

    ;
    if (!isValid) return nextBtn.removeLoader();
    CashFree.initPopup();
    var paymentBody = getPaymentBody();
    var cshFreeRes = CashFree.init({
      layout: {},
      mode: appKeys.getMode() === 'dev' ? "TEST" : "PROD",
      checkout: "transparent"
    });

    if (cshFreeRes.status !== "OK") {
      console.log(cshFreeRes);
      nextBtn.removeLoader();
      return;
    }

    ;
    var cashFreeRequestBody;

    switch (method) {
      case 'card':
        cashFreeRequestBody = getCardPaymentRequestBody(selectedMode.fields, paymentBody);
        break;

      case 'netbanking':
        cashFreeRequestBody = getNetbankingRequestBody(selectedMode.fields, paymentBody);
        break;

      case 'upi':
        cashFreeRequestBody = getUpiRequestBody(selectedMode.fields, paymentBody);
        break;

      case 'wallet':
        cashFreeRequestBody = getWalletRequestBody(selectedMode.fields, paymentBody);
        break;

      default:
        console.log("no payment option found");
        break;
    }

    console.log(cashFreeRequestBody);
    CashFree.paySeamless(cashFreeRequestBody, function (ev) {
      cashFreePaymentCallback(ev, nextBtn, officeData.officeId);
    });
  });
  actionsContainer.appendChild(nextBtn.element);
  journeyContainer.innerHTML = '';
  journeyContainer.appendChild(div);
}
/**
 * 
 * @param {object} fields
 * @returns {Boolean} 
 */


var isCardValid = function isCardValid(fields) {
  if (!fields.holder.valid) {
    setHelperInvalid(fields.holder);
    return;
  }

  if (!fields.cvv.valid) {
    setHelperInvalid(fields.cvv);
    return;
  }

  if (!isCardNumberValid(fields.number.value)) {
    setHelperInvalid(fields.number);
    return;
  }

  if (!fields.expiryMonth.value) {
    document.getElementById('expiry-label').textContent = 'Choose card expiry month';
    document.getElementById('expiry-label').classList.remove('hidden');
    return;
  }

  if (!fields.expiryYear.value) {
    document.getElementById('expiry-label').textContent = 'Choose card expiry year';
    document.getElementById('expiry-label').classList.remove('hidden');
    return;
  }

  return true;
};

var isUpiValid = function isUpiValid(field) {
  if (!field.vpa.valid) {
    setHelperInvalid(field.vpa);
    return;
  }

  return true;
};

var isWalletValid = function isWalletValid(field) {
  if (field.code.value === "Choose an option") {
    document.getElementById('wallet-helper-text').classList.remove('hidden');
    return;
  }

  return true;
};

var isNetbankingValid = function isNetbankingValid(field) {
  return field.code.valid;
};

var isCardNumberValid = function isCardNumberValid(cardNumber) {
  if (!cardNumber) return;
  var formattedNumber = cardNumber.split(" ").join("");
  var luhnValue = checkLuhn(formattedNumber);
  if (luhnValue == 0) return true;
  return false;
};

var getPaymentBody = function getPaymentBody() {
  var officeData = onboarding_data_save.get();
  return {
    appId: appKeys.cashFreeId(),
    orderId: officeData.orderId,
    paymentToken: officeData.paymentToken,
    orderAmount: officeData.plan,
    customerName: firebase.auth().currentUser.displayName,
    customerPhone: firebase.auth().currentUser.phoneNumber,
    customerEmail: firebase.auth().currentUser.email,
    orderCurrency: 'INR',
    notifyUrl: appKeys.cashFreeWebhook()
  };
};
/**
 * Handle card payment
 * @param {Object} cardFields 
 * @param {Object} paymentBody 
 */


var getCardPaymentRequestBody = function getCardPaymentRequestBody(cardFields, paymentBody) {
  paymentBody.paymentOption = 'card';
  paymentBody.card = {
    number: cardFields.number.value.split(" ").join(""),
    expiryMonth: cardFields.expiryMonth.value,
    expiryYear: cardFields.expiryYear.value,
    cvv: cardFields.cvv.value,
    holder: cardFields.holder.value
  };
  return paymentBody;
};

var getNetbankingRequestBody = function getNetbankingRequestBody(nbFields, paymentBody) {
  paymentBody.paymentOption = "nb";
  paymentBody.nb = {
    code: nbFields.code.value
  };
  return paymentBody;
};

var getUpiRequestBody = function getUpiRequestBody(upiFields, paymentBody) {
  paymentBody.paymentOption = 'upi';
  paymentBody.upi = {
    vpa: upiFields.vpa.value
  };
  return paymentBody;
};

var getWalletRequestBody = function getWalletRequestBody(walletFields, paymentBody) {
  paymentBody.paymentOption = 'wallet';
  paymentBody.wallet = {
    code: walletFields.code.value
  };
  return paymentBody;
};

var cashFreePaymentCallback = function cashFreePaymentCallback(ev, nextBtn, officeId) {
  console.log(ev);

  if (ev.name === "VALIDATION_ERROR") {
    showSnacksApiResponse('An error occured. Try again later');
    nextBtn.removeLoader();
    return;
  }

  showTransactionDialog(ev.response, officeId);
};

var showTransactionDialog = function showTransactionDialog(paymentResponse, officeId) {
  var dialog = new mdc.dialog.MDCDialog(document.getElementById('payment-dialog'));
  var dialogTitle = document.getElementById('payment-dialog-title');
  var dialogBtn = document.getElementById('payment-next-btn');
  dialogTitle.textContent = 'PAYMENT ' + paymentResponse.txStatus;
  dialogBtn.addEventListener('click', function () {
    dialog.close();

    if (paymentResponse.txStatus === 'SUCCESS') {
      if (new URLSearchParams(window.location.search).get('renew')) {
        redirect('/admin/index.html?renewd=1');
      }

      history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#employees"));
      addEmployeesFlow();
      incrementProgress();
      return;
    }

    managePayment();
  });

  if (paymentResponse.txStatus === 'SUCCESS') {
    dialogTitle.classList.add('mdc-theme--success');
    dialogBtn.classList.add('mdc-button--raised-success');
    dialogBtn.querySelector('.mdc-button__label').textContent = 'CONTINUE';
  } else {
    dialogTitle.classList.add('mdc-theme--error');
    dialogBtn.classList.add('mdc-button--raised-error');
    dialogBtn.querySelector('.mdc-button__label').textContent = 'RETRY';
  }

  document.getElementById('txn-status').textContent = paymentResponse.txStatus;
  document.getElementById('txn-order-id').textContent = paymentResponse.orderId;
  document.getElementById('txn-amount').textContent = paymentResponse.orderAmount;
  document.getElementById('txn-ref-id').textContent = paymentResponse.referenceId;
  document.getElementById('txn-mode').textContent = paymentResponse.paymentMode;
  document.getElementById('txn-msg').textContent = paymentResponse.txMsg;
  document.getElementById('txn-time').textContent = paymentResponse.txTime;
  dialog.scrimClickAction = "";
  console.log(dialog);
  dialog.open();
};

var cardMode = function cardMode() {
  var cont = createElement('div', {
    className: 'payment-mode--card'
  });
  var grid = createElement('div', {
    className: 'mdc-layout-grid'
  });
  var inner = createElement('div', {
    className: 'mdc-layout-grid__inner'
  });
  var nameCont = createElement('div', {
    className: 'mdc-layout-grid__cell mdc-layout-grid__cell--span-4'
  });
  var nameField = textFieldOutlinedWithoutLabel({
    id: 'card-name',
    required: true,
    placeholder: 'Name',
    autocomplete: 'cc-name'
  });
  nameCont.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: 'Card holder',
    style: 'height:37px'
  }));
  nameCont.appendChild(nameField);
  nameCont.appendChild(textFieldHelper('Card holder name is incorrect'));
  var numberCont = createElement('div', {
    className: 'mdc-layout-grid__cell mdc-layout-grid__cell--span-5-desktop'
  });
  var numberField = textFieldOutlinedWithoutLabel({
    id: 'card-number',
    required: true,
    indicator: 'Card number',
    field: 'number',
    placeholder: 'Number',
    autocomplete: 'cc-number',
    type: 'tel'
  });
  numberCont.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: 'Card number',
    style: 'height:37px'
  }));
  numberCont.appendChild(numberField);
  numberCont.appendChild(textFieldHelper('Card number is incorrect'));
  var expiryCont = createElement('div', {
    className: 'mdc-layout-grid__cell--span-3 expiry-cont'
  });
  var expiryInner = createElement('div', {
    className: 'inline-flex mt-10 full-width',
    style: 'width:100%'
  });
  var monthSelect = createElement('select', {
    className: 'mr-10 expiry-select',
    autocomplete: 'cc-exp-month',
    style: 'border:1px rgb(171,171,171) solid; border-radius: 5px; outline-color: rgb(45,75,113);'
  });
  monthSelect.appendChild(createElement('option', {
    value: "",
    textContent: 'MM',
    attrs: {
      disabled: "true",
      selected: "true"
    }
  }));

  for (var i = 1; i <= 12; i++) {
    var month = i;

    if (i < 10) {
      month = '0' + i;
    }

    var option = createElement('option', {
      value: month,
      textContent: month
    });
    monthSelect.appendChild(option);
  }

  expiryInner.appendChild(monthSelect);
  var yearSelect = createElement('select', {
    className: 'expiry-select',
    autocomplete: 'cc-exp-year',
    style: 'border:1px rgb(171,171,171) solid; border-radius: 5px; outline-color: rgb(45,75,113);'
  });
  yearSelect.appendChild(createElement('option', {
    value: "",
    textContent: 'YYYY',
    attrs: {
      disabled: "true",
      selected: "true"
    }
  }));

  for (var i = 2020; i <= 2040; i++) {
    var _option = createElement('option', {
      value: i,
      textContent: i
    });

    yearSelect.appendChild(_option);
  }

  expiryInner.appendChild(yearSelect);
  expiryCont.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: 'Card expiry',
    style: 'height:37px'
  }));
  var cvvCont = createElement('div', {
    className: 'mdc-layout-grid__cell mdc-layout-grid__cell--span-4'
  });
  var cvvField = textFieldOutlinedWithoutLabel({
    id: 'card-cvv',
    placeholder: 'CVV',
    autocomplete: 'cc-csc',
    type: 'password',
    maxlength: 4
  });
  cvvCont.appendChild(createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: 'Card CVV',
    style: 'height:37px'
  }));
  cvvCont.appendChild(cvvField);
  cvvCont.appendChild(textFieldHelper('CVV is incorrect'));
  expiryCont.appendChild(expiryInner);
  expiryCont.appendChild(createElement('label', {
    className: 'expiry-valid--label mdc-theme--error hidden',
    id: 'expiry-label',
    style: 'font-size:0.75rem'
  }));
  inner.appendChild(nameCont);
  inner.appendChild(numberCont);
  inner.appendChild(expiryCont);
  inner.appendChild(cvvCont);
  grid.appendChild(inner);
  cont.appendChild(grid);
  var numberFieldInit = new mdc.textField.MDCTextField(numberField);
  numberFieldInit.input_.addEventListener('keyup', function (ev) {
    console.log(ev.currentTarget.value);
    ev.currentTarget.value = ev.currentTarget.value.replace(/[^0-9 \,]/, '');
    var value = ev.currentTarget.value.split(" ").join("");
    var length = value.length;

    if (!length) {
      ev.preventDefault();
      return;
    }

    if (ev.keyCode == 8) return;

    if (Number(length) % 4 == 0) {
      ev.currentTarget.value += ' ';
    }
  });
  var fields = {
    number: numberFieldInit,
    holder: new mdc.textField.MDCTextField(nameField),
    expiryMonth: monthSelect,
    expiryYear: yearSelect,
    cvv: new mdc.textField.MDCTextField(cvvField)
  };
  return {
    element: cont,
    fields: fields
  };
};

var netBankingMode = function netBankingMode() {
  var banks = {
    "Allahabad Bank": 3001,
    "Andhra Bank": 3002,
    "Andhra Bank Corporate": 3070,
    "Axis Bank": 3003,
    "Axis Bank Corporate": 3071,
    "Bank of Baroda - Corporate": 3060,
    "Bank of Baroda - Retail": 3005,
    "Bank of India": 3006,
    "Bank of Maharashtra": 3007,
    "Canara Bank": 3009,
    "Catholic Syrian Bank": 3010,
    "Central Bank of India": 3011,
    "City Union Bank": 3012,
    "Corporation Bank": 3013,
    "DBS Bank Ltd": 3017,
    "DCB Bank - Corporate": 3062,
    "DCB Bank - Personal": 3018,
    "Dena Bank": 3015,
    "Deutsche Bank": 3016,
    "Dhanlakshmi Bank Corporate": 3072,
    "Dhanlakshmi Bank": 3019,
    "Equitas Small Finance Bank": 3076,
    "Federal Bank": 3020,
    "HDFC Bank": 3021,
    "ICICI Bank": 3022,
    "ICICI Corporate Netbanking": 3073,
    "IDBI Bank": 3023,
    "IDFC Bank": 3024,
    "Indian Bank": 3026,
    "Indian Overseas Bank": 3027,
    "IndusInd Bank": 3028,
    "Jammu and Kashmir Bank": 3029,
    "Karnataka Bank Ltd": 3030,
    "Karur Vysya Bank": 3031,
    "Kotak Mahindra Bank": 3032,
    "Laxmi Vilas Bank - Retail Net Banking": 3033,
    "Oriental Bank of Commerce": 3035,
    "Punjab & Sind Bank": 3037,
    "Punjab National Bank - Corporate": 3065,
    "Punjab National Bank - Retail": 3038,
    "Ratnakar Corporate Banking": 3074,
    "RBL Bank": 3039,
    "Saraswat Bank": 3040,
    "Shamrao Vithal Bank Corporate": 3075,
    "South Indian Bank": 3042,
    "Standard Chartered Bank": 3043,
    "State Bank Of India": 3044,
    "Syndicate Bank": 3050,
    "Tamilnad Mercantile Bank Ltd": 3052,
    "UCO Bank": 3054,
    "Union Bank of India": 3055,
    "United Bank of India": 3056,
    "Vijaya Bank": 3057,
    "Yes Bank Ltd": 3058
  };

  if (appKeys.getMode() === 'dev') {
    banks['TEST Bank'] = 3333;
  }

  ;
  var cont = createElement('div', {
    className: 'payment-mode--nb'
  });
  var keys = Object.keys(banks);
  var select = createDialogSelect('netbanking-select', banks);
  var selectInit = new mdc.select.MDCSelect(select);
  select.addEventListener('click', function () {
    var dialog = new mdc.dialog.MDCDialog(document.getElementById('netbanking-dialog'));
    var ul = document.getElementById('bank-list');
    ul.innerHTML = '';
    keys.forEach(function (bank, index) {
      var li = createElement('li', {
        className: 'mdc-list-item'
      });

      if (index == 0) {
        li.classList.add('mdc-dialog__button--default');
      }

      li.dataset.bank = bank;
      li.dataset.mdcDialogAction = "accept";
      li.setAttribute('role', 'radio');
      li.innerHTML = "\n            <span class=\"mdc-list-item__ripple\"></span>\n            <span class=\"mdc-list-item__graphic\">\n            <div class=\"mdc-radio\">\n              <input class=\"mdc-radio__native-control\"\n                    type=\"radio\"\n                    id=\"bank-list-radio-item-".concat(index, "\"\n                    name=\"bank-list-radio-item-group\"\n                    value=\"").concat(banks[bank], "\">\n              <div class=\"mdc-radio__background\">\n                <div class=\"mdc-radio__outer-circle\"></div>\n                <div class=\"mdc-radio__inner-circle\"></div>\n              </div>\n            </div>\n          </span>\n          <label class=\"mdc-list-item__text\" for=\"bank-list-radio-item-").concat(index, "\">").concat(bank, "</label>\n            ");
      new mdc.ripple.MDCRipple(li);
      li.addEventListener('click', function () {
        selectInit.value = banks[bank].toString();
        selectInit.selectedText.textContent = bank;
      });
      ul.appendChild(li);
    });
    console.log(dialog);
    var input = document.getElementById('search-bank');
    input.addEventListener('input', function (ev) {
      var value = ev.currentTarget.value.trim().toLowerCase();
      ul.childNodes.forEach(function (child) {
        if (child.dataset.bank.toLowerCase().indexOf(value) == -1) {
          child.classList.add('hidden');
        } else {
          child.classList.remove('hidden');
        }
      });
    });
    dialog.open();
  });
  cont.appendChild(select);
  var fields = {
    code: selectInit
  };
  return {
    element: cont,
    fields: fields
  };
};

var walletMode = function walletMode() {
  var wallets = {
    "FreeCharge": 4001,
    "MobiKwik": 4002,
    "Ola Money": 4003,
    "Reliance Jio Money": 4004,
    "Airtel Money": 4006
  };
  var cont = createElement('div', {
    className: 'payment-mode--wallet'
  });
  var select = createDialogSelect('wallet-select', wallets);
  var selectInit = new mdc.select.MDCSelect(select);
  select.addEventListener('click', function () {
    var dialog = new mdc.dialog.MDCDialog(document.getElementById('wallet-dialog'));
    var ul = document.getElementById('wallet-list');
    ul.innerHTML = '';
    Object.keys(wallets).forEach(function (wallet, index) {
      var li = createElement('li', {
        className: 'mdc-list-item'
      });

      if (index == 0) {
        li.classList.add('mdc-dialog__button--default');
      }

      li.dataset.mdcDialogAction = "accept";
      li.setAttribute('role', 'radio');
      li.innerHTML = "\n            <span class=\"mdc-list-item__ripple\"></span>\n            <span class=\"mdc-list-item__graphic\">\n            <div class=\"mdc-radio\">\n              <input class=\"mdc-radio__native-control\"\n                    type=\"radio\"\n                    id=\"wallet-list-radio-item-".concat(index, "\"\n                    name=\"wallet-list-radio-item-group\"\n                    value=\"").concat(wallet, "\">\n              <div class=\"mdc-radio__background\">\n                <div class=\"mdc-radio__outer-circle\"></div>\n                <div class=\"mdc-radio__inner-circle\"></div>\n              </div>\n            </div>\n          </span>\n          <label class=\"mdc-list-item__text\" for=\"wallet-list-radio-item-").concat(index, "\">").concat(wallet, "</label>\n            ");
      new mdc.ripple.MDCRipple(li);
      li.addEventListener('click', function () {
        console.log(selectInit);
        selectInit.value = wallets[wallet].toString();
        selectInit.selectedText.textContent = wallet;
      });
      ul.appendChild(li);
    });
    console.log(dialog);
    dialog.focusTrap_.options.initialFocusEl = ul.children[0];
    dialog.open();
  });
  cont.appendChild(select);
  cont.appendChild(createElement('div', {
    className: 'mdc-theme--error hidden',
    textContent: 'Please choose an option',
    style: 'font-size:0.75rem',
    id: 'wallet-helper-text'
  }));
  return {
    element: cont,
    fields: {
      code: selectInit
    }
  };
};

var upiMode = function upiMode() {
  var cont = createElement('div', {
    className: 'payment-mode--upi'
  });
  var label = createElement('div', {
    className: 'onboarding-content--text mdc-typography--headline6',
    textContent: 'Enter UPI ID'
  });
  var tf = textFieldOutlinedWithoutLabel({
    required: true,
    placeholder: 'MobileNumber@upi'
  });
  cont.appendChild(label);
  cont.appendChild(tf);
  cont.appendChild(textFieldHelper('UPI ID is incorrect'));
  var fields = {
    vpa: new mdc.textField.MDCTextField(tf)
  };
  return {
    element: cont,
    fields: fields
  };
};
/**
 * user luhn algorithm to validate card number
 * @param {String} serialNumber 
 */


var checkLuhn = function checkLuhn(serialNumber) {
  var totalSum = 0;
  var isSecond = false;

  for (var i = serialNumber.length - 1; i >= 0; i--) {
    if (isSecond) {
      var double = Number(serialNumber[i]) * 2;
      var indivialSum = void 0;

      if (double > 9) {
        indivialSum = Number(double.toString()[0]) + Number(double.toString()[1]);
      } else {
        indivialSum = double;
      }

      totalSum += indivialSum;
      console.log(indivialSum);
    } else {
      totalSum = totalSum + Number(serialNumber[i]);
    }

    isSecond = !isSecond;
  }

  return totalSum % 10;
};

var createContainedButton = function createContainedButton(icon, label) {
  var button = createElement('button', {
    className: 'mdc-button mdc-button--raised'
  });
  button.innerHTML = "<div class=\"mdc-button__ripple\"></div>\n    <span class=\"mdc-button__label\">".concat(label, "</span>\n    <i class=\"material-icons mdc-button__icon\" aria-hidden=\"true\">").concat(icon, "</i>");
  new mdc.ripple.MDCRipple(button);
  return button;
};

var createRadio = function createRadio(id, labelText) {
  var frag = document.createDocumentFragment();
  var radio = createElement('div', {
    className: 'mdc-radio'
  });
  radio.innerHTML = "<input class=\"mdc-radio__native-control\" type=\"radio\" id=\"".concat(id, "\" name=\"radios\">\n    <div class=\"mdc-radio__background\">\n      <div class=\"mdc-radio__outer-circle\"></div>\n      <div class=\"mdc-radio__inner-circle\"></div>\n    </div>\n    <div class=\"mdc-radio__ripple\"></div>");
  frag.appendChild(radio);
  var label = createElement('label', {
    textContent: labelText,
    className: 'full-width'
  });
  label.setAttribute('for', id);
  frag.appendChild(label);
  return frag;
};

var createDialogSelect = function createDialogSelect(id, data) {
  var select = createElement('div', {
    className: 'mdc-select mdc-select--outlined mdc-select--no-label mdc-select--required',
    id: id
  });
  select.innerHTML = "<div class=\"mdc-select__anchor\" aria-required=\"true\">\n    <span class=\"mdc-notched-outline\">\n        <span class=\"mdc-notched-outline__leading\"></span>\n        <span class=\"mdc-notched-outline__trailing\"></span>\n    </span>\n    <span class=\"mdc-select__selected-text\">Choose an option</span>\n    <span class=\"mdc-select__dropdown-icon\">\n        <svg\n            class=\"mdc-select__dropdown-icon-graphic\"\n            viewBox=\"7 10 10 5\" focusable=\"false\">\n        <polygon\n            class=\"mdc-select__dropdown-icon-inactive\"\n            stroke=\"none\"\n            fill-rule=\"evenodd\"\n            points=\"7 10 12 15 17 10\">\n        </polygon>\n        <polygon\n            class=\"mdc-select__dropdown-icon-active\"\n            stroke=\"none\"\n            fill-rule=\"evenodd\"\n            points=\"7 15 12 10 17 15\">\n        </polygon>\n        </svg>\n    </span>\n</div>";
  var selectMenu = createElement('div', {
    className: 'mdc-select__menu mdc-menu mdc-menu-surface mdc-menu-surface--fullwidth hidden'
  });
  var ul = createElement('ul', {
    className: 'mdc-list'
  });
  var defaultOption = createElement('li', {
    className: 'mdc-list-item mdc-list-item--disabled mdc-list-item--selected',
    attrs: {
      'aria-selected': 'true'
    }
  });
  defaultOption.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n    <span class=\"mdc-list-item__text\">Choose an option</span>\n    ";
  defaultOption.dataset.value = "Choose an option";
  ul.appendChild(defaultOption);
  Object.keys(data).forEach(function (item) {
    var li = createElement('li', {
      className: 'mdc-list-item'
    });
    li.dataset.value = data[item];
    li.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n        <span class=\"mdc-list-item__text\">".concat(item, "</span>\n        ");
    ul.appendChild(li);
  });
  selectMenu.appendChild(ul);
  select.appendChild(selectMenu);
  return select;
};
/**
 * Check if office request body has any changes
 * @param {object} savedData 
 * @param {object} officeData 
 * @returns {Boolean} match
 */


var shouldProcessRequest = function shouldProcessRequest(savedData, officeData) {
  var match = false;
  Object.keys(officeData).forEach(function (key) {
    if (officeData[key] !== savedData[key]) {
      match = true;
    }
  });
  return match;
};

var createImage = function createImage(base64, inputFile, companyLogo) {
  var imageCont = createElement('div', {
    className: 'image-cont'
  });
  imageCont.style.backgroundImage = "url(\"".concat(base64, "\")");
  var removeImage = createElement('i', {
    className: 'material-icons remove',
    textContent: 'delete'
  }); //remove image

  removeImage.addEventListener('click', function () {
    //reset logo
    inputFile.value = ''; //remove image container;

    imageCont.remove(); //reset companyLogo variable

    companyLogo = null;
  });
  imageCont.appendChild(removeImage);
  return imageCont;
};
/**
 * creates request for creating/updating an office
 * @param {object} officeData 
 * @returns {object} req
 */


var createRequestBodyForOffice = function createRequestBodyForOffice(officeData) {
  var url = "".concat(appKeys.getBaseUrl(), "/api/services/office");
  var savedData = onboarding_data_save.get();
  var req = {
    endpoint: url,
    data: '',
    method: 'POST'
  };

  if (onboarding_data_save.get().name === officeData.name) {
    url = "".concat(appKeys.getBaseUrl(), "/api/activities/update");
    var template = {
      schedule: [{
        endTime: 0,
        startTime: 0,
        name: 'Membership'
      }],
      venue: [],
      template: 'office',
      attachment: {
        'Company Logo': {
          type: 'base64',
          value: officeData.companyLogo
        },
        'Description': {
          type: 'string',
          value: officeData.description
        },
        'First Contact': {
          type: 'phoneNumber',
          value: savedData.firstContact.phoneNumber
        },
        'Name': {
          type: 'string',
          value: officeData.name
        },
        'Registered Office Address': {
          type: 'string',
          value: officeData.registeredOfficeAddress
        },
        'Pincode': {
          type: 'string',
          value: officeData.pincode
        },
        'Year Of Establishment': {
          type: 'string',
          value: officeData.yearOfEstablishment
        },
        'Category': {
          type: 'string',
          value: officeData.category
        }
      },
      office: officeData.name,
      activityId: savedData.officeId
    };
    template.geopoint = {
      latitude: 0,
      longitude: 0
    };
    req.endpoint = url;
    req.data = template;
    req.method = 'PUT';
    return req;
  }

  ;
  officeData.firstContact = savedData.firstContact;
  req.data = officeData;
  return req;
};
/**
 * Checks for a valid PIN code. should be 6 digits number only
 * @param {string} pincode 
 * @returns {Boolean} 
 */
// const isValidPincode = (pincode) => {
//     return /^[1-9][0-9]{5}$/.test(Number(pincode))
// }

/**
 * Checks if year is valid . should be number only
 * @param {string} pincode 
 * @returns {Boolean} 
 */


var isValidYear = function isValidYear(year) {
  if (!/^\d+$/.test(year)) return;
  if (year > new Date().getFullYear() || year < 1800) return;
  return true;
};

var handleOfficeDescription = function handleOfficeDescription(category) {
  var nameEl = document.querySelector('#company-name input');
  var year = document.querySelector('#year input');
  var address = document.querySelector('#address');
  var description = document.querySelector('#description');
  new mdc.textField.MDCTextField(description.parentNode.parentNode);
  if (!nameEl.value) return;
  if (description.dataset.typed === "yes") return;
  var string = "".concat(nameEl.value, " is ").concat(prefixForVowel(category), " ").concat(category, " company").concat(address.value ? ", based out of ".concat(address.value) : '').concat(year.value > 0 ? ". They have been in business since ".concat(year.value) : '');
  description.value = string;
};
/**
 *  returns a/an if a string first character is a vowel
 * @param {string} string
 * @returns {string} a/an
 */


var prefixForVowel = function prefixForVowel(string) {
  var firstChar = string.charAt(0); //vowel regex test

  if (!/A|a|E|e|I|i|O|o|U|u/i.test(firstChar)) {
    return 'a';
  }

  return 'an';
};

var start = function start() {
  // 2. Initialize the JavaScript client library.
  gapi.client.init({
    'apiKey': appKeys.getKeys().apiKey,
    // clientId and scope are optional if auth is not required.
    'clientId': appKeys.getGoogleClientId(),
    'discoveryDocs': ["https://www.googleapis.com/discovery/v1/apis/people/v1/rest"],
    'scope': 'https://www.googleapis.com/auth/contacts.readonly'
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus); // Handle the initial sign-in state.

    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  }, function (error) {
    var el = document.getElementById('authorize-error');

    if (error.details === "Cookies are not enabled in current environment.") {
      el.innerHTML = 'Google contacts will not work when cookies are disabled. If you are in incognito , Please leave it.';
      return;
    }

    el.innerHTML = error.details;
  });
};

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    document.getElementById('authorize_button').remove();
    document.getElementById('onboarding-headline-contacts').remove();

    if (new URLSearchParams(window.location.search).get('new_user')) {
      listConnectionNames();
      return;
    }

    http('GET', "".concat(appKeys.getBaseUrl(), "/api/myGrowthfile?office=").concat(onboarding_data_save.get().name, "&field=roles")).then(function (response) {
      var phoneNumbers = {};
      var admin = response.roles.admin || [];
      var subs = response.roles.subscription || [];
      var employees = response.roles.employees || [];
      var usersData = [].concat(_toConsumableArray(admin), _toConsumableArray(subs), _toConsumableArray(employees));
      usersData.forEach(function (data) {
        phoneNumbers[data.attachment['Phone Number'].value] = {
          phoneNumber: data.attachment['Phone Number'].value,
          displayName: '',
          photo: '',
          isAdmin: data.template === "admin" ? true : false
        };
      });
      listConnectionNames(phoneNumbers);
    }).catch(function (err) {
      listConnectionNames();
    });
  } else {
    //   authorizeButton.style.display = 'block';
    //   signoutButton.style.display = 'none';
    console.log("logged out");
  }
}

var getAllContacts = function getAllContacts(pageToken, result, currentEmployees) {
  return new Promise(function (resolve, reject) {
    // if (localStorage.getItem('contacts')) {
    //     return resolve(JSON.parse(localStorage.getItem('contacts')))
    // }
    gapi.client.people.people.connections.list({
      'resourceName': 'people/me',
      'pageSize': 100,
      'personFields': 'names,emailAddresses,phoneNumbers,photos',
      pageToken: pageToken || ''
    }).then(function (response) {
      var connections = response.result.connections;
      if (!connections.length) return resolve(result);
      connections.forEach(function (person) {
        if (person.names && person.names.length > 0 && person.phoneNumbers && person.phoneNumbers.length > 0 && person.phoneNumbers[0].canonicalForm) {
          if (currentEmployees && currentEmployees[person.phoneNumbers[0].canonicalForm]) return;
          var key = "".concat(person.phoneNumbers[0].canonicalForm).concat(person.names[0].displayName.toLowerCase());
          result.data[key] = {
            displayName: person.names[0].displayName,
            phoneNumber: person.phoneNumbers[0].canonicalForm,
            photoURL: person.photos[0].url || './img/person.png'
          };
          result.indexes.push(key);
        }
      });

      if (response.result.nextPageToken) {
        return getAllContacts(response.result.nextPageToken, result, currentEmployees).then(resolve);
      }

      ;
      return resolve(result);
    });
  });
};

function listConnectionNames(currentEmployees) {
  var ul = document.getElementById("contacts-list");
  var ulInit = new mdc.list.MDCList(ul);
  var importedNumber = document.querySelector('.imported-number');
  var contactLabel = document.querySelector('.contact-list--label');
  var searchContainer = document.querySelector('.search-bar--container');
  var selectedPeople = document.querySelector('.selected-people');
  var selected = {};
  getAllContacts(null, {
    data: {},
    indexes: []
  }, currentEmployees).then(function (contactData) {
    // localStorage.setItem('contacts', JSON.stringify(contactData));
    var length = contactData.indexes.length;

    if (!length) {
      document.getElementById('authorize-error').innerHTML = 'No Contacts found !. Use share link to invite your employees';
      return;
    }

    ;

    if (importedNumber) {
      importedNumber.innerHTML = "Imported ".concat(length, " contacts");
    }

    if (contactLabel) {
      contactLabel.innerHTML = 'Manager';
    }

    if (length >= 10) {
      var searchBar = new mdc.textField.MDCTextField(textFieldOutlined({
        label: 'Search your contacts'
      }));
      searchBar.input_.addEventListener('input', function () {
        searchDebounce(function () {
          var value = searchBar.value.toLowerCase();
          var matchFound = 0;
          var frag = document.createDocumentFragment();
          contactData.indexes.forEach(function (item, index) {
            if (item.indexOf(value) > -1) {
              matchFound++;

              if (matchFound < 10) {
                var li = userList(contactData.data[item], index);
                var switchControl = new mdc.switchControl.MDCSwitch(li.querySelector('.mdc-switch'));

                if (selected[item]) {
                  li.querySelector('.mdc-checkbox__native-control').checked = true;
                  li.setAttribute('aria-checked', "true");
                  li.setAttribute('tabindex', "0");
                  switchControl.checked = true;
                }

                frag.appendChild(li);
                li.querySelector('span:nth-child(3)').innerHTML = "<img src='".concat(contactData.data[item].photoURL, "' data-name=\"").concat(contactData.data[item].displayName, "\" class='contact-photo' onerror=\"contactImageError(this);\"></img>");
              }

              ;
            }
          });
          ul.innerHTML = '';
          ul.appendChild(frag);
        }, 1000);
      });

      if (searchContainer) {
        searchContainer.appendChild(searchBar.root);
      }
    }

    ;
    ulInit.foundation.isCheckboxList_ = true;

    for (var i = 0; i < 5; i++) {
      var element = contactData.indexes[i];

      if (element) {
        var li = userList(contactData.data[element], i);
        var switchControl = new mdc.switchControl.MDCSwitch(li.querySelector('.mdc-switch'));
        switchControl.disabled = true;
        ul.appendChild(li);
        li.querySelector('span:nth-child(3)').innerHTML = "<img src='".concat(contactData.data[element].photoURL, "' data-name=\"").concat(contactData.data[element].displayName, "\" class='contact-photo' onerror=\"contactImageError(this);\"></img>");
      }
    }

    ulInit.listen('MDCList:action', function (ev) {
      var el = ulInit.listElements[ev.detail.index];
      var switchControl = new mdc.switchControl.MDCSwitch(el.querySelector('.mdc-switch'));

      if (ulInit.selectedIndex.indexOf(ev.detail.index) == -1) {
        switchControl.disabled = true;
        switchControl.checked = false;
        delete selected[el.dataset.name];

        if (selectedPeople) {
          selectedPeople.innerHTML = "".concat(Object.keys(selected).length == 0 ? '' : "".concat(Object.keys(selected).length, " Contacts selected"));
        }
      } else {
        switchControl.disabled = false;
        var selectedContact = JSON.parse(el.dataset.value);
        selectedContact.isAdmin = switchControl.checked;
        selected[el.dataset.name] = selectedContact;

        if (selectedPeople) {
          selectedPeople.innerHTML = "".concat(Object.keys(selected).length, " Contacts selected");
        }
      }

      onboarding_data_save.set({
        users: selected
      });
    });
  });
}

var timerId;

var searchDebounce = function searchDebounce(func, delay) {
  clearTimeout(timerId);
  timerId = setTimeout(func, delay);
};

function contactImageError(image) {
  var tag = createElement('span');
  tag.dataset.letters = image.dataset.name.charAt(0);
  image.parentNode.replaceChild(tag, image);
  image.onerror = "";
  image.remove();
  return true;
}

var userList = function userList(contact, index) {
  var li = createElement('li', {
    className: 'mdc-list-item'
  });
  li.dataset.name = "".concat(contact.phoneNumber).concat(contact.displayName.toLowerCase());
  li.dataset.value = JSON.stringify(contact);
  li.setAttribute('role', 'checkbox');
  li.setAttribute('tabindex', "-1");
  li.setAttribute('aria-checked', "false");
  li.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n      <span class=\"mdc-list-item__graphic\">\n        <div class=\"mdc-checkbox\">\n            <input type=\"checkbox\"\n                    class=\"mdc-checkbox__native-control\"\n                    id=\"contact-list-checkbox-item-".concat(index, "\"  />\n            <div class=\"mdc-checkbox__background\">\n                <svg class=\"mdc-checkbox__checkmark\"\n                        viewBox=\"0 0 24 24\">\n                    <path class=\"mdc-checkbox__checkmark-path\"\n                        fill=\"none\"\n                        d=\"M1.73,12.91 8.1,19.28 22.79,4.59\"/>\n                </svg>\n                <div class=\"mdc-checkbox__mixedmark\"></div>\n            </div>\n        </div>\n    </span>\n\n    <span class=\"mdc-list-item__graphic\">\n     \n    </span>\n    <label class=\"mdc-list-item__text\" for=\"contact-list-checkbox-item-").concat(index, "\">\n        <span class=\"mdc-list-item__primary-text\">").concat(contact.displayName, "</span>\n        <span class=\"mdc-list-item__secondary-text\">").concat(contact.phoneNumber, "</span>\n    </label>\n    <span class='mdc-list-item__meta'>\n        <div class=\"mdc-switch\">\n            <div class=\"mdc-switch__track\"></div>\n            <div class=\"mdc-switch__thumb-underlay\">\n                <div class=\"mdc-switch__thumb\"></div>\n                <input type=\"checkbox\" id=\"basic-switch-").concat(index, "\" class=\"mdc-switch__native-control\" role=\"switch\" aria-checked=\"false\">\n            </div>\n        </div>\n    </span>\n      ");
  return li;
};

function addEmployeesFlow() {
  journeyHeadline.innerHTML = 'Add employees by using any one of these methods'; // 1. Load the JavaScript client library.

  gapi.load('client', start);
  var secondaryTextContacts = createElement('div', {
    className: 'onboarding-headline--secondary',
    id: 'onboarding-headline-contacts',
    textContent: 'Import from Google contacts'
  });
  var authorizeContainer = createElement('div', {
    className: 'import-cont'
  });
  var text = createElement('h2');
  text.innerHTML = "<span  class=\"line-center\">Or</span>";
  var authorize = createElement('button', {
    className: 'mdc-button mdc-button--raised',
    id: 'authorize_button',
    textContent: 'Import from Google contacts'
  });
  var authorizeError = createElement('div', {
    className: 'mdc-theme--error authorize-failed',
    id: 'authorize-error'
  });
  authorize.addEventListener('click', function () {
    gapi.auth2.getAuthInstance().signIn();
  });
  authorizeContainer.appendChild(secondaryTextContacts);
  authorizeContainer.appendChild(authorize);
  authorizeContainer.appendChild(authorizeError);
  var employeesContainer = createElement('div', {
    className: 'employees-container'
  });
  var selectionContainer = createElement('div', {
    className: 'user-selection'
  });
  var importedText = createElement('div', {
    className: 'imported-number'
  });
  var selectedPeople = createElement('div', {
    className: 'selected-people mdc-typography--headline5'
  });
  var searchCont = createElement('div', {
    className: 'search-bar--container'
  });
  var contactListLabel = createElement('div', {
    className: 'contact-list--label mdc-typography--headline6'
  });
  var ul = createElement('ul', {
    className: 'mdc-list mdc-list--two-line mdc-list--avatar-list',
    id: 'contacts-list'
  });
  ul.setAttribute('aria-label', 'List with checkbox items');
  ul.setAttribute('role', 'group');
  selectionContainer.appendChild(selectedPeople);
  selectionContainer.appendChild(searchCont);
  selectionContainer.appendChild(contactListLabel);
  selectionContainer.appendChild(ul);
  selectionContainer.appendChild(importedText);
  var shareContainer = createElement('div', {
    className: 'share-container'
  });
  var officeName = onboarding_data_save.get().name;
  var loader = createElement('div', {
    className: 'straight-loader'
  });
  shareContainer.appendChild(loader);
  var shareLink;
  waitTillCustomClaimsUpdate(officeName, function () {
    getShareLink(onboarding_data_save.get().name).then(function (response) {
      var secondaryTextShareLink = createElement('div', {
        className: 'onboarding-headline--secondary',
        textContent: 'Invite employees by sharing this download link with them.'
      });
      shareLink = response.shortLink;
      loader.remove();
      shareContainer.appendChild(text);
      shareContainer.appendChild(secondaryTextShareLink);
      shareContainer.appendChild(shareWidget(shareLink));
    }).catch(console.error);
  });
  employeesContainer.appendChild(selectionContainer);
  employeesContainer.appendChild(authorizeContainer);
  employeesContainer.appendChild(shareContainer);
  journeyContainer.innerHTML = '';
  journeyContainer.appendChild(employeesContainer);
  var nxtButton = nextButton();
  nxtButton.element.addEventListener('click', function () {
    var selectedUsers = onboarding_data_save.get().users;

    if (selectedUsers && Object.keys(selectedUsers).length > 0) {
      nxtButton.setLoader();
      var array = [];
      Object.keys(selectedUsers).forEach(function (user) {
        array.push(selectedUsers[user]);
      });
      http('POST', "".concat(appKeys.getBaseUrl(), "/api/services/addUsers"), {
        office: onboarding_data_save.get().name,
        users: array
      }).then(function (res) {
        nxtButton.removeLoader();
        history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#completed"));
        incrementProgress();
        onboardingSucccess(shareLink);
      }).catch(function (err) {
        nxtButton.removeLoader();
      });
      return;
    }

    history.pushState(history.state, null, basePathName + "".concat(window.location.search, "#completed"));
    onboardingSucccess(shareLink);
  });
  actionsContainer.appendChild(nxtButton.element);
}

var onboardingSucccess = function onboardingSucccess(shareLink) {
  var isNewUser = new URLSearchParams(window.location.search).get('new_user');
  journeyHeadline.innerHTML = isNewUser ? 'Account creation successful!' : 'Account updated successful';
  localStorage.setItem("completed", "true");
  journeyContainer.innerHTML = "\n    <div class='completion-container'>\n    <h1 class='onboarding-headline--secondary mt-0 mb-0'>Congratulations you can now start tracking your employees</h1>\n\n    <svg class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 52 52\"><circle class=\"checkmark__circle\" cx=\"26\" cy=\"26\" r=\"25\" fill=\"none\"/><path class=\"checkmark__check\" fill=\"none\" d=\"M14.1 27.2l7.1 7.2 16.7-16.8\"/></svg>\n    <a type=\"button\" class=\"mdc-button mdc-dialog__button mdc-button--raised\" data-mdc-dialog-action=\"close\" href=\"/admin/?new_user=1\" style=\"    width: 200px;\n    margin: 0 auto;\n    display: flex;\n    text-align: center;\n    margin-top: 20px;\n    margin-bottom: 20px;\n    height: 48px;\n    font-size: 21px;\">\n        <div class=\"mdc-button__ripple\"></div>\n        <span class=\"mdc-button__label\">Continue</span>\n    </a>\n        <p class='mdc-typography--headline5 text-center mb-0 mt-0' style='padding-top:10px;border-top:1px solid #ccc'>Download the app and try it</p>\n        <div class=\"full-width\">\n          <div style=\"width: 300px;display: block;margin: 0 auto;\">\n            <div style=\"width: 100%;display: inline-flex;align-items: center;\">\n              <div class=\"play-store\">\n                <a\n                  href=\"https://play.google.com/store/apps/details?id=com.growthfile.growthfileNew&amp;pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1\"><img\n                    alt=\"Get it on Google Play\"\n                    src=\"https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png\"></a>\n              </div>\n              <div class=\"app-store full-width\">\n                <a href=\"https://apps.apple.com/in/app/growthfile-gps-attendance-app/id1441388774?mt=8\"\n                  style=\"display:inline-block;overflow:hidden;background:url(https://linkmaker.itunes.apple.com/en-gb/badge-lrg.svg?releaseDate=2018-12-06&amp;kind=iossoftware&amp;bubble=ios_apps) no-repeat;width:135px;height:40px;\"></a>\n              </div>\n            </div>\n          </div>\n      </div>\n      ".concat(shareLink ? " <div class='share-container'>\n          <h2><span class=\"line-center\">Or</span></h2>\n          <p class='mt-10 mb-0 mdc-typography--headline6 text-center'>Invite employees by sharing this download link with them.</p>\n            ".concat(shareWidget(shareLink).outerHTML, "\n      </div>") : '', "\n    </div>");
  actionsContainer.innerHTML = '';
  fbq('trackCustom', 'Onboarding Completed');
};

var onboarding_data_save = function () {
  return {
    init: function init() {
      localStorage.setItem('onboarding_data', JSON.stringify({}));
    },
    get: function get() {
      return JSON.parse(localStorage.getItem('onboarding_data'));
    },
    set: function set(data) {
      var storedData = this.get();

      _extends(storedData, data);

      localStorage.setItem('onboarding_data', JSON.stringify(storedData));
    },
    clear: function clear() {
      localStorage.removeItem('onboarding_data');
    }
  };
}();
/**
 *  Returns base mdc text field component without init
 * @param {object} attr 
 * @returns HTMLElement
 */


var textField = function textField(attr) {
  var label = createElement('label', {
    className: 'mdc-text-field'
  });
  label.innerHTML = "<span class=\"mdc-text-field__ripple\"></span>\n    <input class=\"mdc-text-field__input\" type=\"".concat(attr.type || 'text', "\" autocomplete=").concat(attr.autocomplete ? attr.autocomplete : 'off', " ").concat(attr.required ? 'required' : '', "  ").concat(attr.disabled ? 'disabled' : '', " ").concat(attr.readonly ? 'readonly' : '', ">\n    <span class=\"mdc-floating-label\">").concat(attr.label, "</span>\n    <span class=\"mdc-line-ripple\"></span>");
  return label;
};
/**
 * creates MDCTextFielled filled
 * @param {object} attr 
 * @returns {MDCTextField} 
 */


var textFieldFilled = function textFieldFilled(attr) {
  var tf = textField(attr);
  tf.classList.add('mdc-text-field--filled');
  return tf;
};
/**
 * creates MDCTextFielled outlined with label
 * @param {object} attr 
 * @returns {MDCTextField} 
 */


var textFieldOutlined = function textFieldOutlined(attrs) {
  var label = createElement('label', {
    className: 'mdc-text-field mdc-text-field--outlined',
    id: attrs.id || ''
  });

  if (attrs.value) {
    label.classList.add('mdc-text-field--label-floating');
  }

  var input = createElement('input', {
    className: 'mdc-text-field__input',
    value: attrs.value || '',
    placeholder: attrs.placeholder || ''
  });
  Object.keys(attrs).forEach(function (attr) {
    if (attr === 'label' || attr === 'id') return;

    if (attr === 'required' || attr === 'disabled') {
      input[attr] = attrs[attr];
      return;
    }

    input.setAttribute(attr, attrs[attr]);
  });
  label.innerHTML = "".concat(input.outerHTML, "\n    <span class=\"mdc-notched-outline\">\n      <span class=\"mdc-notched-outline__leading\"></span>\n      <span class=\"mdc-notched-outline__notch\">\n        <span class=\"mdc-floating-label ").concat(attrs.value ? 'mdc-floating-label--float-above' : '', "\">").concat(attrs.label, "</span>\n      </span>\n      <span class=\"mdc-notched-outline__trailing\"></span>\n    </span>");
  return label;
};
/**
 * creates MDCTextFielled outlined without label
 * @param {object} attr 
 * @returns {MDCTextField} 
 */


var textFieldOutlinedWithoutLabel = function textFieldOutlinedWithoutLabel(attr) {
  var outlinedField = textFieldOutlined(attr);
  outlinedField.querySelector('.mdc-notched-outline__notch').remove();
  outlinedField.classList.add('mdc-text-field--no-label');
  return outlinedField;
};

var textAreaOutlined = function textAreaOutlined(attr) {
  var label = createElement('label', {
    className: 'mdc-text-field mdc-text-field--outlined mdc-text-field--textarea'
  });

  if (attr.value) {
    label.classList.add('mdc-text-field--label-floating');
  }

  label.innerHTML = "<span class=\"mdc-notched-outline\">\n    <span class=\"mdc-notched-outline__leading\"></span>\n    <span class=\"mdc-notched-outline__notch\">\n      <span class=\"mdc-floating-label ".concat(attr.value ? 'mdc-floating-label--float-above' : '', "\">").concat(attr.label, "</span>\n    </span>\n    <span class=\"mdc-notched-outline__trailing\"></span>\n</span>\n<span class=\"mdc-text-field__resizer\">\n    <textarea class=\"mdc-text-field__input\" rows=\"").concat(attr.rows, "\" cols=\"").concat(attr.cols, "\" aria-label=\"Label\" id=\"").concat(attr.id || '', "\" ").concat(attr.required ? 'required' : '', " ").concat(attr.autocomplete ? "autocomplete = ".concat(attr.autocomplete) : '', ">").concat(attr.value || '', "</textarea>\n</span>");
  return label;
};
/**
 * creates hellper text for textfield
 * @returns {HTMLElement}
 */


var textFieldHelper = function textFieldHelper(message) {
  var div = createElement('div', {
    className: 'mdc-text-field-helper-line'
  });
  div.innerHTML = "<div class=\"mdc-text-field-helper-text mdc-text-field-helper-text--validation-msg\" aria-hidden=\"true\">".concat(message || '', "</div>");
  return div;
};

var getTimeZone = function getTimeZone() {
  return new Promise(function (resolve, reject) {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return resolve(tz);
    lazyLoadScript('../admin/js/moment.min.js').then(function () {
      return lazyLoadScript('./js/moment-timezone-with-data-2030.min.js');
    }).then(function () {
      return resolve(moment.tz.guess());
    }).catch(reject);
  });
};

var lazyLoadScript = function lazyLoadScript(path) {
  return new Promise(function (resolve, reject) {
    var script = createElement('script', {
      src: path
    });

    script.onload = function () {
      return resolve(true);
    };

    script.onerror = function (e) {
      return reject(e);
    };

    document.body.appendChild(script);
  });
};