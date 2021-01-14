var heading = document.getElementById('form-heading');
var companyName = document.getElementById('company-name');
var yearInput = document.getElementById('year-of-estd');
var address = document.getElementById('address');
var description = document.getElementById('description');
var form = document.getElementById('manage-form');
var logoCont = document.getElementById('company-logo');
var uploadLogo = document.getElementById('upload-logo');
var imageErrorEl = document.getElementById('image-upload-error');
var removeLogo = document.getElementById('remove-logo');
var submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]');
var branchSelect;

var init = function init(office, officeId) {
  var tx = window.database.transaction("activities");
  var store = tx.objectStore("activities");
  branchSelect = new mdc.select.MDCSelect(document.getElementById('branch-select'));

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
  address.value = record.attachment['Registered Office Address'] ? record.attachment['Registered Office Address'].value : '';
  description.value = record.attachment['Description'].value;
  var category = new mdc.select.MDCSelect(document.getElementById('category-select'));
  category.value = record.attachment['Category'].value;

  if (record.attachment['Company Logo'].value) {
    logoCont.style.backgroundImage = "url(\"".concat(record.attachment['Company Logo'].value, "\")");
    logoCont.classList.remove('hidden');
  }

  uploadLogo.addEventListener('change', function (ev) {
    getImageBase64(ev, 0.5, parseInt(uploadLogo.dataset.maxFileSize)).then(function (base64) {
      imageErrorEl.innerHTML = '';
      logoCont.classList.remove('hidden');
      logoCont.style.backgroundImage = "url(\"".concat(base64, "\")");
      removeLogo.addEventListener('click', function () {
        uploadLogo.value = '';
        logoCont.style.backgroundImage = '';
        logoCont.classList.add('hidden');
      });
    }).catch(function (imageUploadErr) {
      switch (imageUploadErr.message) {
        case 'file-size-too-large':
          imageErrorEl.textContent = 'Image size should be less than 10MB';
          break;

        case 'file-not-exist':
          imageErrorEl.textContent = 'File does not exist';
          break;

        default:
          imageErrorEl.textContent = error.message;
      }
    });
  });
  var oldBranches = {};
  var newBranches = {};
  getTypeList({
    template: 'branch',
    officeId: record.officeId
  }, function (branches) {
    console.log('branches', branches);
    var ul = document.getElementById('branch-list');
    var oldBranchLength = Object.keys(oldBranches).length;
    branches.forEach(function (branch) {
      newBranches[branch.name] = branch;
    });

    if (!oldBranchLength) {
      oldBranches = newBranches;
    }

    removeOldBranches(oldBranches, newBranches);
    branches.forEach(function (branch) {
      if (!document.querySelector("[data-value=\"".concat(branch.name, "\"]"))) {
        var li = createElement('li', {
          className: 'mdc-list-item'
        });
        li.dataset.value = branch.name;
        li.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n                    <span class=\"mdc-list-item__text\">".concat(branch.name, "</span>");
        ul.appendChild(li);
      }
    });
    branchSelect.selectedIndex = 0;
  }, function (error) {
    console.error(error);
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    if (!branchSelect) {
      alert('Select a branch');
      return;
    }

    if (!branchSelect.value) {
      alert('Select a branch');
      return;
    }

    submitBtn.classList.add('active');
    var clone = JSON.parse(JSON.stringify(record));
    clone.attachment['Year Of Establishment'].value = yearInput.value;
    clone.attachment['Description'].value = description.value;
    clone.attachment['Category'].value = category.value;
    clone.attachment['Company Logo'].value = logoCont.style.backgroundImage.substring(5, logoCont.style.backgroundImage.length - 2);
    clone.attachment['Default Branch'].value = branchSelect.value;
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
        handleFormButtonSubmitSuccess(submitBtn, 'Company info updated');
      };
    }).catch(function (err) {
      handleFormButtonSubmit(submitBtn, err.message);
    });
    return;
  });
};