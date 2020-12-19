function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var init = function init(office, officeId) {
  var form = document.getElementById('manage-form');
  var auth = firebase.auth().currentUser;
  var nameField = new mdc.textField.MDCTextField(document.getElementById('account-name'));
  var emailField = new mdc.textField.MDCTextField(document.getElementById('account-email'));
  var imageField = document.querySelector('.account-photo');
  var imageUpload = document.getElementById('image-upload');
  var submitBtn = form.querySelector('.form-submit[type="submit"]');
  var base64Image = auth.photoURL;
  nameField.value = auth.displayName || '';
  emailField.value = auth.email || '';

  if (auth.photoURL) {
    imageField.style.backgroundImage = "url(\"".concat(auth.photoURL, "\")");
  }

  ;
  imageUpload.addEventListener('change', function (ev) {
    getImageBase64(ev).then(function (base64) {
      base64Image = base64;
      imageField.style.backgroundImage = "url(\"".concat(base64, "\")");
    });
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    submitBtn.classList.add('active');
    var imageProm;

    if (auth.photoURL !== base64Image) {
      imageProm = http('POST', "".concat(appKeys.getBaseUrl(), "/api/services/images"), {
        imageBase64: base64Image
      });
    } else {
      imageProm = Promise.resolve();
    }

    imageProm.then(function () {
      return handleAuthUpdate({
        displayName: nameField.value,
        email: emailField.value
      });
    }).then(function () {
      auth.reload();
      submitBtn.classList.remove('active');
    }).catch(function (err) {
      submitBtn.classList.remove('active');
      var message = getEmailErrorMessage(err);

      if (message) {
        setHelperInvalid(emailField, message);
        return;
      }

      handleFormButtonSubmit(submitBtn, message);
    });
  });
  var renewNow = document.getElementById('renew-now');
  var changePlan = document.getElementById('change-plan');
  getOfficeActivity(officeId).then(function (activity) {
    var endTime = activity.schedule[0].endTime;
    console.log("end Time", new Date(endTime));
    console.log("start Time", new Date(activity.schedule[0].startTime)); // console.log(moment.duration(moment(endTime).diff(moment(),'months',true),'months'))

    document.getElementById('start-date').textContent = activity.schedule[0].startTime ? moment(activity.schedule[0].startTime).format('DD MMM YYYY') : '-';
    document.getElementById('end-date').textContent = endTime ? moment(endTime).format('DD MMM YYYY') : '-';
    document.getElementById('days-left').textContent = endTime ? getMemberShipEnd(endTime, Date.now()) : '-';
    document.getElementById('status').innerHTML = isOfficeActive(activity) ? "<span class='mdc-theme--success inline-flex'><i class='material-icons mr-10'>check_circle</i> Active</span>" : "<span class='mdc-theme--error inline-flex'><i class='material-icons mr-10'>cancel</i> Inactive</span>";
    var tableBody = document.getElementById('payments-table-body');
    var progressBar = document.getElementById('data-table-progress-bar').MDCLinearProgress;
    progressBar.open();
    getMemberShipDetails(officeId).then(function (response) {
      console.log(response); // clearError();

      var subscriptions = response.results;

      if (!subscriptions.length) {
        progressBar.close();
        tableBody.innerHTML = "<span class='mdc-theme--error'>No pamynets found</span>";
      }

      ;
      tableBody.appendChild(getRow(subscriptions));
      progressBar.close();
      var downgradeDialog = document.getElementById('downgrade-plan').MDCDialog;
      var upgradeDialog = document.getElementById('upgrade-plan').MDCDialog;
      var choosePlanDialog = document.getElementById('choose-plan').MDCDialog;
      renewNow.addEventListener('click', function () {
        if (subscriptions.length && subscriptions[0].attachment.Amount.value == 2999 && subscriptions[0].status === "CONFIRMED") {
          redirect("/join.html?renew=1&office=".concat(encodeURIComponent(office), "&plan=2999"));
          return;
        }

        upgradeDialog.open();
      });
      changePlan.addEventListener('click', function () {
        if (subscriptions.length && subscriptions[0].attachment.Amount.value == 2999 && subscriptions[0].status === "CONFIRMED") {
          downgradeDialog.open();
          return;
        }

        upgradeDialog.open();
      });

      _toConsumableArray(document.querySelectorAll('.confirmation-button')).forEach(function (el) {
        el.addEventListener('click', function () {
          downgradeDialog.close();
          upgradeDialog.close();
          choosePlanDialog.open();
        });
      });

      document.getElementById('pay-now').addEventListener('click', function () {
        if (!auth.displayName) {
          setHelperInvalid(nameField, 'Please set your name');
          return;
        }

        if (!auth.email) {
          setHelperInvalid(emailField, 'Please set your email');
          return;
        }

        var endTime = activity.schedule[0].endTime;
        var plans = [2999, 999];
        var ul = document.getElementById('choose-plan-list').MDCList;
        var amount = plans[ul.selectedIndex];
        redirect("/join.html?renew=1&office=".concat(encodeURIComponent(office), "&plan=").concat(amount));
      });
    });
  }).catch(function (err) {
    console.error(err);
    document.querySelector('#subscription-cont .details').innerHTML = "<p class='mdc-theme--error text-center mdc-typography--headline6'>Try again later</p>";
  });
};

var getMemberShipEnd = function getMemberShipEnd(endTime, startTime) {
  if (startTime > endTime) return '-';
  console.log(moment.preciseDiff(endTime, startTime, true));
  var diff = moment.preciseDiff(endTime, startTime, true);
  return "".concat(diff.years ? "".concat(diff.years, " years") : '', " ").concat(diff.months ? "".concat(diff.months, " months") : '', " ").concat(diff.days ? "".concat(diff.days, " days") : '', " ").concat(diff.hours ? "".concat(diff.hours, " hours") : '', " ").concat(diff.minutes ? "".concat(diff.minutes, " minutes") : '');
};

var isOfficeActive = function isOfficeActive(activity) {
  var currentTs = Date.now();
  return activity.status === "CONFIRMED" && currentTs >= activity.schedule[0].startTime && currentTs <= activity.schedule[0].endTime;
};

var getMemberShipDetails = function getMemberShipDetails(officeId, limit, start) {
  return new Promise(function (resolve, reject) {
    http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/payment?type=membership").concat(start ? "&start=".concat(start) : '').concat(limit ? "&limit=".concat(limit) : '')).then(resolve).catch(reject);
  });
};

var getRow = function getRow(subscriptions) {
  var frag = document.createDocumentFragment();
  subscriptions.forEach(function (subscription) {
    if (subscription.attachment.Amount.value == 0) return;
    var logs = getPaymentLog(subscription.attachment.Logs.value);
    console.log(logs);
    var tr = createElement('tr', {
      className: 'mdc-data-table__row'
    });
    var date = createElement('th', {
      className: 'mdc-data-table__cell',
      attrs: {
        scope: "row"
      },
      textContent: subscription.attachment['Payment Initiation Date'].value
    });
    var duration = createElement('th', {
      className: 'mdc-data-table__cell',
      attrs: {
        scope: "row"
      },
      textContent: getMemberShipEnd(subscription.schedule[0].endTime, subscription.schedule[0].startTime)
    });
    var method = createElement('th', {
      className: 'mdc-data-table__cell',
      attrs: {
        scope: "row"
      },
      textContent: logs['paymentMode'] || '-'
    });
    var creator = createElement('th', {
      className: 'mdc-data-table__cell',
      attrs: {
        scope: "row"
      },
      textContent: subscription.creator.displayName
    });
    var amount = createElement('th', {
      className: 'mdc-data-table__cell',
      attrs: {
        scope: "row"
      },
      textContent: subscription.attachment.Amount.value ? formatMoney(String(subscription.attachment.Amount.value)) : 0
    });
    var status = createElement('th', {
      className: 'mdc-data-table__cell',
      attrs: {
        scope: "row"
      },
      innerHTML: logs.txStatus ? "<span class='mdc-theme--success inline-flex'><i class='material-icons mr-10'>check_circle</i> Success</span>" : "<span class='mdc-theme--error inline-flex'><i class='material-icons mr-10'>cancel</i> Failed</span>"
    });
    var receipt = createElement('th', {
      className: 'mdc-data-table__cell receipt-down',
      attrs: {
        scope: "row"
      },
      innerHTML: '<i class="material-icons">download</i>'
    });
    receipt.addEventListener('click', function () {
      document.getElementById('txn-status').textContent = logs.txStatus;
      document.getElementById('txn-order-id').textContent = logs.orderId;
      document.getElementById('txn-amount').textContent = logs.orderAmount;
      document.getElementById('txn-ref-id').textContent = logs.referenceId;
      document.getElementById('txn-mode').textContent = logs.paymentMode;
      document.getElementById('txn-msg').textContent = logs.txMsg;
      document.getElementById('txn-time').textContent = logs.txTime;
      createPDF(); // html2canvas(document.getElementById('payment-table'), {
      //     onrendered: function (canvas) {
      //         var data = canvas.toDataURL();
      //         console.log(data)
      //         var docDefinition = {
      //             content: [{
      //                 image: data,
      //                 width: 500
      //             }]
      //         };
      //         pdfMake.createPdf(docDefinition).download("Table.pdf");
      //     }
      // });
    });
    tr.appendChild(date);
    tr.appendChild(duration);
    tr.appendChild(method);
    tr.appendChild(creator);
    tr.appendChild(amount);
    tr.appendChild(status);
    tr.appendChild(receipt);
    frag.appendChild(tr);
  });
  return frag;
};

var handleSubscriptionError = function handleSubscriptionError(error) {
  document.getElementById('error').textContent = error.message;
};

var clearError = function clearError() {
  document.getElementById('error').textContent = '';
};

function createPDF() {
  var sTable = document.getElementById('payment-table').innerHTML; // CREATE A WINDOW OBJECT.

  var win = window.open('', '', 'height=700,width=700');
  win.document.write('<html><head>');
  win.document.write("<link rel='stylesheet' href='https://unpkg.com/material-components-web@7.0.0/dist/material-components-web.min.css'>");
  win.document.write('</head>');
  win.document.write('<body>');
  win.document.write(sTable); // THE TABLE CONTENTS INSIDE THE BODY TAG.

  win.document.write('</body></html>');
  win.document.close(); // CLOSE THE CURRENT WINDOW.

  win.print(); // PRINT THE CONTENTS.
}

var getPlanDuration = function getPlanDuration(startDate, endDate) {
  var start = new Date(startDate);
  var end = new Date(endDate);
  return "".concat(moment([end.getFullYear(), end.getMonth(), end.getDate()]).diff(moment([start.getFullYear(), start.getMonth(), start.getDate()]), "months", true), " months");
};

var getPaymentLog = function getPaymentLog(logs) {
  var log = JSON.parse(logs) || {};
  return log[Object.keys(log)[0]] || {};
};