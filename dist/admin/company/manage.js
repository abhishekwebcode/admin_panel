var heading = document.getElementById('form-heading');
var companyName = document.getElementById('company-name');
var yearInput = document.getElementById('year-of-estd');
var address = document.getElementById('address');
var description = document.getElementById('description');
var pincode = document.getElementById('pincode');
var form = document.getElementById('manage-form');
var logoCont = document.getElementById('company-logo');
var uploadLogo = document.getElementById('upload-logo');
var removeLogo = document.getElementById('remove-logo');

var init = function init(office, officeId) {
  var tx = window.database.transaction("activities");
  var store = tx.objectStore("activities");

  store.get(officeId).onsuccess = function (evt) {
    var record = evt.target.result;
    if (!record) return;
    updateForm(record);
  };
};

var updateForm = function updateForm(record) {
  heading.textContent = "Manage ".concat(record.office);
  companyName.value = record.office;
  yearInput.value = record.attachment['Year Of Establishment'].value;
  address.value = record.attachment['Registered Office Address'].value;
  description.value = record.attachment['Description'].value;
  pincode.value = record.attachment['Pincode'].value;
  var category = new mdc.select.MDCSelect(document.getElementById('category-select'));
  category.value = record.attachment['Category'].value;

  if (record.attachment['Company Logo'].value) {
    logoCont.style.backgroundImage = "url(\"".concat(record.attachment['Company Logo'].value, "\")");
    logoCont.classList.remove('hidden');
  }

  uploadLogo.addEventListener('change', function (ev) {
    getImageBase64(ev).then(function (base64) {
      logoCont.classList.remove('hidden');
      logoCont.style.backgroundImage = "url(\"".concat(base64, "\")");
      removeLogo.addEventListener('click', function () {
        uploadLogo.value = '';
        logoCont.style.backgroundImage = '';
        logoCont.classList.add('hidden');
      });
    });
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    ev.submitter.classList.add('active');
    var clone = JSON.parse(JSON.stringify(record));
    clone.attachment['Year Of Establishment'].value = yearInput.value;
    clone.attachment['Registered Office Address'].value = address.value;
    clone.attachment['Description'].value = description.value;
    clone.attachment['Pincode'].value = pincode.value;
    clone.attachment['Category'].value = category.value;
    clone.attachment['Company Logo'].value = logoCont.style.backgroundImage.substring(5, logoCont.style.backgroundImage.length - 2);
    clone.geopoint = {
      latitude: 0,
      longitude: 0
    };
    http('PUT', "".concat(appKeys.getBaseUrl(), "/api/activities/update"), clone).then(function (res) {
      var tx = window.database.transaction("activities", 'readwrite');
      var store = tx.objectStore("activities");
      delete clone.geopoint;
      store.put(clone);

      tx.oncomplete = function () {
        handleFormButtonSubmit(ev.submitter, 'Company info updated');
        setTimeout(function () {
          history.back();
        }, 1000);
      };
    }).catch(function (err) {
      handleFormButtonSubmit(ev.submitter, err.message);
    });
    return;
  });
};