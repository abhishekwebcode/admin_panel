var sendAcqusition = function sendAcqusition() {
  var param = parseURL();
  if (!param) return Promise.resolve();
  return http('PUT', "".concat(appKeys.getBaseUrl(), "/api/profile/acquisition"), {
    source: param.get('utm_source'),
    medium: param.get('utm_medium'),
    campaign: param.get('utm_campaign'),
    campaignId: param.get('campaignId'),
    office: param.get('office')
  });
};
/**
 * Handles a logged in user.
 * @param {Boolean} isNewUser 
 */


function handleLoggedIn(authResult) {
  var param = parseURL();

  if (window.location.pathname === '/welcome' && param && param.get('action') === 'get-subscription') {
    handleWelcomePage();
    return;
  }

  ;
  handleAuthRedirect(authResult);
}
/**
 * If user is privileged then redirect them to /join page
 * else modify the page to reflect user successfull addition
 */


var handleWelcomePage = function handleWelcomePage() {
  var param = parseURL();
  firebase.auth().currentUser.getIdTokenResult().then(function (idTokenResult) {
    document.getElementById('campaign-heading').innerHTML = "Adding you to <span class='mdc-theme--primary'>".concat(param.get('office'), "</span>");
    sendAcqusition().then(function () {
      document.getElementById('home-login').remove();
      document.getElementById('campaign-heading').innerHTML = "You are added into <span class='mdc-theme--primary'>".concat(param.get('office'), "</span>");
    }).catch(console.error);
  });
};
/**
 * Handle redirect based on custom claims
 * @param {Boolean} isNewUser 
 */


var handleAuthRedirect = function handleAuthRedirect(authResult) {
  firebase.auth().currentUser.getIdTokenResult().then(function (idTokenResult) {
    handleAuthAnalytics(authResult, idTokenResult); // if (idTokenResult.claims.support) return redirect('/support');

    if (idTokenResult.claims.admin && idTokenResult.claims.admin.length > 0) return redirect('/admin/index.html');
    redirect('/join.html?new_user=1');
  });
};
/**
 * Recursively checks if users custom claims are updated with the office.
 * If office is found then clear interval and execute the callback;
 * @param {String} office 
 * @param {Function} callback 
 */


var waitTillCustomClaimsUpdate = function waitTillCustomClaimsUpdate(office, callback) {
  var interval = setInterval(function () {
    firebase.auth().currentUser.getIdToken(true).then(function () {
      firebase.auth().currentUser.getIdTokenResult().then(function (idTokenResult) {
        if (idTokenResult.claims.admin && idTokenResult.claims.admin.indexOf(office) > -1) {
          clearInterval(interval);
          callback();
        }
      });
    }).catch(console.error);
  }, 4000);
};