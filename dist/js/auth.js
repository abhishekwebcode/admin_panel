var authSuccess = function authSuccess(authResult) {
  sendAcqusition().then(function () {
    handleLoggedIn(authResult);
  }).catch(function (error) {
    handleLoggedIn(authResult);
  });
};

var initFirebaseUI = function initFirebaseUI() {
  var loader = document.getElementById('login-loader');
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  ui.start('#firebaseui-auth-container', {
    callbacks: {
      signInSuccessWithAuthResult: function signInSuccessWithAuthResult(authResult, redirectUrl) {
        console.log(authResult);
        authSuccess(authResult);
        return;
      },
      uiShown: function uiShown() {
        loader.style.display = 'none';
      }
    },
    signInOptions: [{
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      recaptchaParameters: {
        type: 'image',
        size: 'invisible',
        badge: 'bottomright'
      },
      defaultCountry: 'IN'
    }],
    signInFlow: 'popup',
    tosUrl: 'https://growthfile.com/legal#terms-of-use-user',
    privacyPolicyUrl: 'https://growthfile.com/legal#privacy-policy'
  });
};

(function () {
  var searchParams = new URLSearchParams(window.location.search);
  document.getElementById('auth-header').textContent = searchParams.has('signup') ? 'Sign up' : 'Log In';
  var authListener = firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      authListener();
      return initFirebaseUI();
    }

    authSuccess();
  });
})();