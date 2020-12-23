const authSuccess = (authResult) => {
    sendAcqusition().then(() => {
        handleLoggedIn(authResult);
    }).catch(error => {
        handleLoggedIn(authResult);
    });
}

const initFirebaseUI = () => {
    const loader = document.getElementById('login-loader');
    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                console.log(authResult)
                debugger;
                authSuccess(authResult)
                return;
            },
            uiShown: function () {
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
            defaultCountry: 'IN',
        }],

        signInFlow: 'popup',
        tosUrl: 'https://growthfile.com/legal#terms-of-use-user',
        privacyPolicyUrl: 'https://growthfile.com/legal#privacy-policy'
    })

}

(function () {
    const searchParams = new URLSearchParams(window.location.search);
    document.getElementById('auth-header').textContent = searchParams.has('signup') ? 'Sign up' : 'Log In';
    const authListener = firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            authListener()
            return initFirebaseUI();
        }
        authSuccess();
    })
}());