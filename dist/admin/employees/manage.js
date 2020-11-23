var employeeName = document.getElementById('name');
var phonenumber = document.getElementById('phonenumber');
var designation = document.getElementById('designation');
var code = document.getElementById('code');
var supervisorInput = document.getElementById('supervisor');
var supervisorChipSetEl = document.getElementById('supervisor-chipset');
var supervisorMenu = document.getElementById('supervisor-menu');
var form = document.getElementById('manage-form');
var submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]');
var employeeStatusButton = document.getElementById('employee-status-btn');
var employeeActivity;

var init = function init(office, officeId) {
  // check if we have activity id in url. 
  // if activity id is  found, then udpate the form else create
  var formId = getFormId();
  var requestParams = getFormRequestParams();
  var employeePhoneNumberMdc = new mdc.textField.MDCTextField(document.getElementById('phone-field-mdc'));
  var iti = phoneFieldInit(employeePhoneNumberMdc);

  if (formId) {
    document.getElementById('form-heading').innerHTML = 'Update ' + new URLSearchParams(window.location.search).get('name');
    getActivity(formId).then(function (activity) {
      if (activity) {
        employeeActivity = activity;
        updateEmployeeFields(officeId, activity);
      }

      http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/activity/").concat(formId, "/")).then(function (res) {
        employeeActivity = res;
        putActivity(res).then(function (res) {
          updateEmployeeFields(officeId, res);
        });
      });
    });
  }

  userAdditionComponent({
    officeId: officeId,
    input: supervisorInput
  });
  supervisorInput.addEventListener('selected', function (ev) {
    var user = ev.detail.user;
    supervisorInput.value = user.employeeName || user.displayName || user.phoneNumber;
    supervisorInput.dataset.number = user.phoneNumber;
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var error = iti.getValidationError();

    if (error !== 0) {
      var message = getPhoneFieldErrorMessage(error);
      setHelperInvalid(employeePhoneNumberMdc, message);
      return;
    }

    if (!iti.isValidNumber()) {
      setHelperInvalid(employeePhoneNumberMdc, 'Invalid number. Please check again');
      return;
    }

    ;
    setHelperValid(employeePhoneNumberMdc);
    submitBtn.classList.add('active');
    var activityBody = createActivityBody();
    activityBody.setOffice(office);
    activityBody.setActivityId(formId);
    activityBody.setTemplate('employee');
    activityBody.setAttachment('Name', employeeName.value, 'string');
    activityBody.setAttachment('Phone Number', iti.getNumber(), 'phoneNumber');
    activityBody.setAttachment('Designation', designation.value, 'string');
    activityBody.setAttachment('Employee Code', code.value, 'string');
    activityBody.setAttachment('First Supervisor', supervisorInput.dataset.number, 'phoneNumber');
    var requestBody = activityBody.get();
    getUser(firebase.auth().currentUser.phoneNumber).then(function (userRecord) {
      createEmployee(requestParams, requestBody, hasEmployeeSubscription(userRecord));
    });
  });
};

var hasEmployeeSubscription = function hasEmployeeSubscription(userRecord) {
  if (userRecord.subscriptions.some(function (sub) {
    return sub.name === 'employee';
  })) return true;
  if (userRecord.subscriptions.filter(function (sub) {
    return sub.name === "subscription" || sub.name === "employee";
  }).length >= 2) return true;
  if (userRecord.subscriptions.some(function (sub) {
    return sub.name === 'subscription';
  })) return false;
};

var createEmployee = function createEmployee(requestParams, requestBody, hasEmployeeSubscription) {
  var count = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
  var employeeSubscriptionPromise = Promise.resolve();

  if (!hasEmployeeSubscription) {
    employeeSubscriptionPromise = createSubscription(requestBody.office, 'employee');
  }

  ;
  employeeSubscriptionPromise.then(function (subResponse) {
    if (!subResponse) return http(requestParams.method, requestParams.url, requestBody);
    return delay(3000, http(requestParams.method, requestParams.url, requestBody));
  }).then(function (res) {
    var message = 'New employee added';

    if (requestParams.method === 'PUT') {
      message = 'Employee updated';
      putActivity(requestBody).then(function () {
        handleFormButtonSubmitSuccess(submitBtn, message);
      });
      return;
    }

    ;
    handleFormButtonSubmitSuccess(submitBtn, message);
  }).catch(function (err) {
    if (err.message === "employee '".concat(requestBody.attachment.Name.value, "' already exists")) {
      setHelperInvalid(new mdc.textField.MDCTextField(document.getElementById('name-field-mdc')), err.message);
      handleFormButtonSubmit(submitBtn);
      return;
    }

    if (err.message === "No subscription found for the template: 'employee' with the office '".concat(requestBody.office, "'")) {
      if (count == 2) {
        handleFormButtonSubmit(submitBtn, 'Try again later');
        return;
      }

      count++;
      createEmployee(requestParams, requestBody, true, count);
      return;
    }

    handleFormButtonSubmit(submitBtn, err.message);
  });
};

var delay = function delay(time, value) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time, value);
  });
};

var updateEmployeeFields = function updateEmployeeFields(officeId, activity) {
  if (activity.employeeStatus === 'CANCELLED') {
    redirect('/admin/employees/');
    return;
  }

  ;
  var empName = activity.attachment['Name'].value || '';
  employeeName.value = empName;
  phonenumber.value = activity.attachment['Phone Number'].value;
  designation.value = activity.attachment['Designation'].value;
  code.value = activity.attachment['Employee Code'].value;
  var supervisorNumber = activity.attachment['First Supervisor'].value;
  supervisorInput.value = supervisorNumber || '';
  supervisorInput.dataset.number = supervisorNumber;

  if (activity.assignees) {
    activity.assignees.forEach(function (assignee) {
      var chip = createUserChip(assignee);

      if (document.querySelector(".mdc-chip[data-number=\"".concat(assignee.phoneNumber, "\"]"))) {
        document.querySelector(".mdc-chip[data-number=\"".concat(assignee.phoneNumber, "\"]")).remove();
      }

      if (assignee.phoneNumber === supervisorNumber) {
        supervisorInput.value = assignee.displayName;
      }
    });
  }

  var employeeText = document.getElementById('employee-text');
  employeeText.textContent = "".concat(activity.attachment.Name.value, " is a registered employee");
  employeeStatusButton.querySelector('.mdc-button__label').textContent = "Remove ".concat(empName.split(" ")[0]);
  employeeStatusButton.removeEventListener('click', statusChange, true);
  employeeStatusButton.addEventListener('click', statusChange, true);
  var selfNumber = firebase.auth().currentUser.phoneNumber;
  var employeeNumber = activity.attachment['Phone Number'].value; // if employeee is self don't show employee status container

  if (employeeNumber === selfNumber) return;
  getActivity(officeId).then(function (officeActivity) {
    // if employee is owner of the office don't show
    if (employeeNumber === officeActivity.attachment['First Contact'].value) return;
    var isUserOwner = false;

    if (selfNumber === officeActivity.attachment['First Contact'].value) {
      isUserOwner = true;
    } //if user is owner of office then show


    if (isUserOwner) {
      document.querySelector('.employee-status').classList.remove('hidden');
      return;
    }

    getUser(employeeNumber).then(function (rec) {
      //if employee is another admin don't show
      if (rec.adminId) return; // emploeye is neither admin nor owner

      document.querySelector('.employee-status').classList.remove('hidden');
    });
  });
};
/**
 * 
 * @param {string} phonenumber 
 * @returns {object} e.target.result
 */


var getUser = function getUser(phonenumber) {
  return new Promise(function (resolve) {
    window.database.transaction('users').objectStore('users').get(phonenumber).onsuccess = function (e) {
      resolve(e.target.result);
    };
  });
};

var statusChange = function statusChange() {
  var removeDialog = new mdc.dialog.MDCDialog(document.getElementById('remove-employee-confirm-dialog'));
  removeDialog.content_.textContent = "Are you sure you want to remove ".concat(employeeActivity.attachment.Name.value || employeeActivity.attachment.PhoneNumber.value, " as an employee ?\n     If you change your mind you will have to add them again manually.");
  removeDialog.open();
  removeDialog.listen('MDCDialog:closed', function (ev) {
    if (ev.detail.action !== "accept") {
      return;
    }

    submitBtn.classList.add('active');
    employeeStatusButton.classList.add('in-progress');
    userStatusChange(employeeActivity).then(function () {
      handleFormButtonSubmitSuccess(submitBtn, 'User removed');
    }).catch(function (err) {
      showSnacksApiResponse('There was a problem changing employee status');
      submitBtn.classList.remove('active');
    });
  });
};