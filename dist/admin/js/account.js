var init = function init(office, officeId) {
  var form = document.getElementById('manage-form');
  var auth = firebase.auth().currentUser;
  var nameField = new mdc.textField.MDCTextField(document.getElementById('account-name'));
  var emailField = new mdc.textField.MDCTextField(document.getElementById('account-email'));
  var imageField = document.querySelector('.account-photo');
  var imageUpload = document.getElementById('image-upload');
  var submitBtn = form.querySelector('.form-submit[type="submit"]');
  var base64Image = auth.photoURL;
  nameField.value = auth.displayName;
  emailField.value = auth.email;

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
      handleFormButtonSubmitSuccess(submitBtn, 'Account updated');
    }).catch(function (err) {
      submitBtn.classList.remove('active');
      var message = getEmailErrorMessage(err);

      if (message) {
        setHelperInvalid(emailField, message);
        return;
      }

      handleFormButtonSubmit(submitBtn, message);
    });
  }); // getMemberShipDetails(officeId, 1, 0).then(response => {
  //     clearError();
  //     const subscriptions = response.results
  //     if (!subscriptions.length) {
  //         document.getElementById('details').innerHTML = '<span>No pamynets found</span>'
  //         return
  //     };
  //     handleSubscriptions(subscriptions,office)
  //     document.getElementById('show-previous').addEventListener('click', function(){
  //         clearError()
  //         getMemberShipDetails(officeId, response.size, 1).then(res => {
  //             this.remove()
  //             handleSubscriptions(res.results,office);
  //         }).catch(handleSubscriptionError);
  //     })
  // }).catch(handleSubscriptionError)
};

var getMemberShipDetails = function getMemberShipDetails(officeId, limit, start) {
  return new Promise(function (resolve, reject) {
    http('GET', "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/payment?type=membership").concat(start ? "&start=".concat(start) : '').concat(limit ? "&limit=".concat(limit) : '')).then(resolve).catch(reject);
  });
};

var handleSubscriptions = function handleSubscriptions(subscriptions, office) {
  subscriptions.forEach(function (subscription) {
    document.getElementById('details').appendChild(createSubscriptionCard(subscription, office));
  });
};

var handleSubscriptionError = function handleSubscriptionError(error) {
  document.getElementById('error').textContent = error.message;
};

var clearError = function clearError() {
  document.getElementById('error').textContent = '';
};

var createSubscriptionCard = function createSubscriptionCard(subscription, office) {
  var duration = subscription.attachment.Amount.value == 0 ? '3 Days' : getPlanDuration(subscription.schedule[0].startTime, subscription.schedule[0].endTime);
  var hasExpired = subscription.schedule[0].endTime < Date.now();
  var isActive = Date.now() >= subscription.schedule[0].startTime && Date.now() <= subscription.schedule[0].endTime;
  console.log(duration);
  var card = createElement('div', {
    className: 'subscription-card mdc-layout-grid__inner'
  });
  var paymentLog = getConfirmedPayment(subscription.attachment.Logs.value);
  card.innerHTML = "\n            <div class='mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone'>\n                <div class='plan inline-flex'>Plan: ".concat(formatMoney(String(subscription.attachment.Amount.value)), " / ").concat(duration, " ").concat(isActive ? "<div class='inline-flex mdc-theme--primary ml-10 change-plan'>\n                <a class=\"mdc-button\" href=\"../join.html?#payment?office=".concat(office, "&extend=1\">\n                    <div class=\"mdc-button__ripple\"></div>\n                    <i class=\"material-icons mdc-button__icon\" aria-hidden=\"true\">change_circle</i>\n                    <span class=\"mdc-button__label\">Change plan</span>\n                </a>\n                </div>") : '', "</div>\n            </div>\n            <div class='mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone'>\n                <div class='expiry-end'>Your ").concat(duration, " subscription period ").concat(hasExpired ? '' : ' will', " ").concat(hasExpired ? 'expired' : 'expire', " on ").concat(moment(subscription.schedule[0].endTime).format("DD MMM YYYY"), "</div>\n            </div>\n            <div class='mdc-layout-grid__cell mdc-layout-grid__cell--align-middle'>\n                Date : ").concat(subscription.attachment['Payment Initiation Date'].value, "\n            </div>  \n            <div class='mdc-layout-grid__cell mdc-layout-grid__cell--align-middle'>\n                ").concat(paymentLog ? "Mode of payment : ".concat(paymentLog.paymentMode) : '', "\n            </div>  \n            <div class='mdc-layout-grid__cell mdc-layout-grid__cell--align-middle'>\n               \n            </div>  \n        ");
  return card;
};

{
  /* <button class="mdc-button download-report-btn">
  <div class="mdc-button__ripple"></div>
  <i class="material-icons mdc-button__icon" aria-hidden="true">download</i>
  <div class='straight-loader'></div>
  <span class="mdc-button__label">Download Receipt</span>
  </button> */
}

var getPlanDuration = function getPlanDuration(startDate, endDate) {
  var start = new Date(startDate);
  var end = new Date(endDate);
  return "".concat(moment([end.getFullYear(), end.getMonth(), end.getDate()]).diff(moment([start.getFullYear(), start.getMonth(), start.getDate()]), "months", true), " months");
};

var getConfirmedPayment = function getConfirmedPayment(logs) {
  var paymentLogs = JSON.parse(logs);
  var keys = Object.keys(paymentLogs);
  if (!keys.length) return null;
  var successKey = keys.filter(function (key) {
    return paymentLogs[key].txStatus === "SUCCESS";
  });
  return paymentLogs[successKey];
};