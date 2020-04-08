function initializeLogIn(el, shouldRedirect = true, profileInfo) {
  var appKeys = new AppKeys();
  firebase.auth().onAuthStateChanged(user => {
    console.log(user)

    if (!user) {
      document.body.classList.remove('hidden')
      if (shouldRedirect) {
        redirect('');
        return;
      }
      login(el, profileInfo);
      return;
    };

    addLogoutBtn();

    const param = parseURL()
    user.getIdTokenResult().then((idTokenResult) => {
      if (idTokenResult.claims.admin || idTokenResult.claims.support) {
        if (user.email && user.displayName) {
          if (window.location.pathname === '/app') {
            getLocation().then(initializer).catch(err => {
              initializer();
            })
            return
          }
          redirect(`/app${window.location.search}`);
          return;
        }
        updateAuth(el, user, profileInfo);
        return
      }
      http('GET', `${appKeys.getBaseUrl()}/api/services/subscription/checkIn`).then(response => {
        if (response.hasCheckInSubscription) {
          setFirebaseAnalyticsUserProperty("hasCheckin", "true");
          signOut()
          showSnacksApiResponse('Please use Growthfile app on your mobile to continue');
          setTimeout(function () {
            window.location.href = 'https://growthfile.page.link/naxz';
          }, 2000)
          return;
        }
        if (window.location.pathname === '/signup') {
          getLocation().then(createOfficeInit).catch(console.error)
          return;
        }
        if (param && param.get('action') === 'get-started') {
          redirect('/signup?action=get-started');
          return
        }
        redirect('/signup');
      })
    });
  });
}

const addLogoutBtn = () => {
  const el = document.getElementById('app-bar-login');
  if (!el) return;
  el.textContent = 'Log out';
  el.removeAttribute('href');
  el.addEventListener('click', function () {
    firebase.auth().signOut().then(function () {
      redirect('')
    })
  })
}