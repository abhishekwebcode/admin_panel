import * as firebase from "firebase/app";
import "firebase/auth";
import {
    appKeys
} from './env-config';
import {
    login,
    updateAuth
} from "./js/login";
import {
    home
} from "./js/home";


window.addEventListener('load', function () {

    firebase.initializeApp(appKeys.getKeys());
    firebase.auth().onAuthStateChanged(function (auth) {
        console.log(auth);

        if (!auth) {
           
            login();
            return;
        };

        if (parseEmailRedirect()) {
            home(auth);
            return;
        }
        if (auth.email && auth.emailVerified && auth.displayName) {
            home(auth);
            return;
        };
        updateAuth(auth)
    });
})

const parseEmailRedirect = () => {
    const param = new URLSearchParams(document.location.search.substring(1));
    const email = param.get('email');

    return email
}