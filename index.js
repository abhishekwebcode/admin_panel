import firebase from "firebase/app";
import "firebase/auth";
import {
    appKeys
} from './env-config';
import {
    login,
    updateAuth
} from './js/login';
import {
    home
} from './js/home';

window.addEventListener('load', function () {
    firebase.initializeApp(appKeys.getKeys());
    firebase.auth().onAuthStateChanged(function (auth) {

        console.log(auth);
        
        if (!auth) {
            if (parseRedirect('redirect_to') === 'LOGIN') {
                login();              
                return;
            };
            if(parseRedirect('redirect_to') === 'SIGNUP'){
                return  redirect('/signup.html');
            }

            return redirect('/static/home.html');           
        }

        // redirect('/static/home.html');           
        return redirect('/signup.html');   

        // if (auth.email && auth.emailVerified && auth.displayName) {
        //     auth.getIdTokenResult().then((idTokenResult) => {
        //         // redirect('/signup.html');
        //         // if (idTokenResult.claims.hasOwnProperty('admin') && idTokenResult.claims.admin.length) return home(auth)
        //     });
        //     return;
        // };

        // updateAuth(auth);
    });
});

const parseRedirect = (type) => {
    const param = new URLSearchParams(document.location.search.substring(1));
    return param.get(type);
}

const redirect = (pathname) => {
    window.location = window.location.origin + pathname;
}