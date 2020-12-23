(function () {
    const loader = document.getElementById('login-loader');

    const ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                sendAcqusition().then(() => {
                    handleLoggedIn(authResult);
                }).catch(error => {
                    handleLoggedIn(authResult);
                });
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
}());



window.addEventListener('load', () => {
    // const searchParams = new URLSearchParams(window.location.search);
    // const box = document.getElementById('home-login')
    // box.classList.remove('hidden')
    // if (!searchParams.has('signup')) {
    //     initializeLogIn(box)
    //     return
    // }
    // const authListener = firebase.auth().onAuthStateChanged(function (user) {
    //     if (!user) {
    //         authListener()
    //         return initAuthBox();
    //     }
    //     flushStoredErrors();
    //     sendAcqusition().then(handleLoggedIn).catch(err => {
    //         redirect('/admin/index.html')
    //     })
    // });
})
