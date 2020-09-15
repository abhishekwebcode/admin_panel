function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

var branchName = document.getElementById('name');
var primaryPhoneNumber = document.getElementById('primary-phonenumber');
var secondaryPhoneNumber = document.getElementById('secondary-phonenumber');
var address = document.getElementById('address');
var weeklyOff = document.getElementById('weekly-off');
var weekdayStartTime = document.getElementById('weekday-start-time');
var weekdayEndTime = document.getElementById('weekday-end-time');
var form = document.getElementById('manage-form');

var init = function init(office, officeId) {
  // check if we have activity id in url. 
  // if activity id is  found, then udpate the form else create
  var formId = getFormId();
  var requestParams = getFormRequestParams();
  var primaryPhoneNumberMdc = new mdc.textField.MDCTextField(document.getElementById('phone-field-mdc-primary'));
  var secondaryPhoneNumberMdc = new mdc.textField.MDCTextField(document.getElementById('phone-field-mdc-secondary'));
  var primaryIti = phoneFieldInit(primaryPhoneNumberMdc);
  var secondaryIti = phoneFieldInit(secondaryPhoneNumberMdc); // make weekday end time file min value equal to start time value

  weekdayStartTime.addEventListener('change', function (evt) {
    weekdayEndTime.value = evt.target.value;
    weekdayEndTime.min = evt.target.value;
  });

  if (formId) {
    document.getElementById('form-heading').innerHTML = 'Update ' + new URLSearchParams(window.location.search).get('name');
    getActivity(formId).then(function (activity) {
      if (activity) {
        updateBranchFields(activity);
      }

      http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/activity/").concat(formId, "/")).then(function (res) {
        putActivity(res).then(updateBranchFields);
      });
    });
  } else {
    var hours = new Date().getHours();
    var minutes = new Date().getMinutes();
    weekdayStartTime.value = "".concat(hours < 10 ? '0' : '').concat(hours, ":").concat(minutes < 10 ? '0' : '').concat(minutes);
  }

  weekdayStartTime.dispatchEvent(new Event('change', {
    'bubbles': true
  }));
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var primaryContactValidation = validatePhonNumber(primaryIti);

    if (!primaryContactValidation.isValid) {
      setHelperInvalid(primaryPhoneNumberMdc, primaryContactValidation.message);
      return;
    }

    var secondaryContactValidation = validatePhonNumber(secondaryIti);

    if (secondaryPhoneNumberMdc.value && !secondaryContactValidation.isValid) {
      setHelperInvalid(secondaryPhoneNumberMdc, secondaryContactValidation.message);
      return;
    }

    setHelperValid(primaryPhoneNumberMdc);
    setHelperValid(secondaryPhoneNumberMdc);
    ev.submitter.classList.add('active');
    var activityBody = createActivityBody();
    activityBody.setOffice(office);
    activityBody.setActivityId(formId);
    activityBody.setTemplate('branch');
    activityBody.setSchedule(Array.apply(null, Array(15)).map(function (x, y) {
      return {
        'name': 'Holiday ' + (y + 1),
        'startTime': '',
        'endTime': ''
      };
    }));
    activityBody.setVenue([{
      location: address.value,
      address: address.value,
      venueDescriptor: 'Branch Office',
      geopoint: {
        latitude: 0,
        longitude: 0
      }
    }]);
    activityBody.setAttachment('Name', branchName.value, 'string');
    activityBody.setAttachment('First Contact', primaryIti.getNumber(), 'phoneNumber');
    activityBody.setAttachment('Second Contact', secondaryIti.getNumber(), 'phoneNumber');
    activityBody.setAttachment('Weekday Start Time', weekdayStartTime.value, 'HH:MM');
    activityBody.setAttachment('Weekday End Time', weekdayEndTime.value, 'HH:MM');
    activityBody.setAttachment('Weekly Off', weeklyOff.value, 'weekdat');
    var requestBody = activityBody.get();
    http(requestParams.method, requestParams.url, requestBody).then(function (res) {
      var message = 'New Branch added';

      if (requestParams.method === 'PUT') {
        message = 'Branch updated';
        putActivity(requestBody).then(function () {
          handleFormButtonSubmitSuccess(ev.submitter, message);
        });
        return;
      }

      handleFormButtonSubmitSuccess(ev.submitter, message);
    }).catch(function (err) {
      if (err.message === "branch '".concat(requestBody.attachment.Name.value, "' already exists")) {
        setHelperInvalid(new mdc.textField.MDCTextField(document.getElementById('name-field-mdc')), err.message);
        handleFormButtonSubmit(ev.submitter);
        return;
      }

      if (err.message === "No subscription found for the template: 'branch' with the office '".concat(office, "'")) {
        createSubscription(office, 'branch').then(function () {
          form.submit();
        });
        return;
      }

      handleFormButtonSubmit(ev.submitter, err.message);
    });
  });
};

var updateBranchFields = function updateBranchFields(activity) {
  branchName.value = activity.attachment['Name'].value;
  primaryPhoneNumber.value = activity.attachment['First Contact'].value;
  secondaryPhoneNumber.value = activity.attachment['Second Contact'].value;
  weeklyOff.value = activity.attachment['Weekly Off'].value;
  weekdayStartTime = (_readOnlyError("weekdayStartTime"), ctivity.attachment['Weekday Start Time'].value);
  weekdayEndTime = (_readOnlyError("weekdayEndTime"), ctivity.attachment['Weekday End Time'].value);
  address.value = activity.venue[0].address;
};