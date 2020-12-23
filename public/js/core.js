/** Minor URLSeach params polyfill */
(function (w) {
    w.URLSearchParams = w.URLSearchParams || function (searchString) {
        var self = this;
        self.searchString = searchString;
        self.get = function (name) {
            var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(self.searchString);
            if (results == null) {
                return null;
            } else {
                return decodeURI(results[1]) || 0;
            }
        };
    }

})(window)

/**For each polyfill for Node list IE  */
if (typeof NodeList !== "undefined" && NodeList.prototype && !NodeList.prototype.forEach) {
    // Yes, there's really no need for `Object.defineProperty` here
    NodeList.prototype.forEach = Array.prototype.forEach;
}

/** session & local storage polyfill https://gist.github.com/remy/350433 */
if (typeof window.localStorage == 'undefined' || typeof window.sessionStorage == 'undefined')(function () {
    var Storage = function Storage(type) {
        function createCookie(name, value, days) {
            var date, expires;

            if (days) {
                date = new Date();
                date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
                expires = "; expires=" + date.toGMTString();
            } else {
                expires = "";
            }

            document.cookie = name + "=" + value + expires + "; path=/";
        }

        function readCookie(name) {
            var nameEQ = name + "=",
                ca = document.cookie.split(';'),
                i,
                c;

            for (i = 0; i < ca.length; i++) {
                c = ca[i];

                while (c.charAt(0) == ' ') {
                    c = c.substring(1, c.length);
                }

                if (c.indexOf(nameEQ) == 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }

            return null;
        }

        function setData(data) {
            data = JSON.stringify(data);

            if (type == 'session') {
                window.name = data;
            } else {
                createCookie('localStorage', data, 365);
            }
        }

        function clearData() {
            if (type == 'session') {
                window.name = '';
            } else {
                createCookie('localStorage', '', 365);
            }
        }

        function getData() {
            var data = type == 'session' ? window.name : readCookie('localStorage');
            return data ? JSON.parse(data) : {};
        } // initialise if there's already data


        var data = getData();
        return {
            length: 0,
            clear: function clear() {
                data = {};
                this.length = 0;
                clearData();
            },
            getItem: function getItem(key) {
                return data[key] === undefined ? null : data[key];
            },
            key: function key(i) {
                // not perfect, but works
                var ctr = 0;

                for (var k in data) {
                    if (ctr == i) return k;
                    else ctr++;
                }

                return null;
            },
            removeItem: function removeItem(key) {
                delete data[key];
                this.length--;
                setData(data);
            },
            setItem: function setItem(key, value) {
                data[key] = value + ''; // forces the value to a string

                this.length++;
                setData(data);
            }
        };
    };

    if (typeof window.localStorage == 'undefined') window.localStorage = new Storage('local');
    if (typeof window.sessionStorage == 'undefined') window.sessionStorage = new Storage('session');
})();


/**
 * creates HTML element 
 * @param {string} tagName 
 * @param {object} props 
 * @returns {HTMLElement}
 */

const createElement = (tagName, props) => {
    const el = document.createElement(tagName)
    if (props) {
        Object.keys(props).forEach(function (prop) {
            if (prop === 'attrs') {
                Object.keys(props[prop]).forEach(attr => {
                    el.setAttribute(attr, props[prop][attr])
                })
            } else {
                el[prop] = props[prop]

            }
        })
    }
    return el;
}

window.commonDom = {}
/**
 *  captures uncaught and sytax error globally. Once error is captured sendErrorLog then handles the error
 * @param {string} message 
 * @param {string} source 
 * @param {number} lineno 
 * @param {number} colno 
 * @param {string} error 
 */
window.onerror = function (message, source, lineno, colno, error) {
    var string = message.toLowerCase();
    var substring = "script error";
    if (string.indexOf(substring) > -1) return;
    let stack = '-'
    if (error) {
        stack = error.stack;
    }
    const errorBody = {
        source: source,
        lineno: lineno,
        colno: colno,
        message: message,
        stack: stack
    }
    sendErrorLog(errorBody)
};
/**
 * listens for unhandledrejection in Promises. Once event is captured sendErrorLog then handles the error
 */

window.addEventListener("unhandledrejection", event => {
    console.log(event.reason);
    sendErrorLog({
        message: event.reason.message,
        stack: event.reason.stack
    })
    event.preventDefault();
});


/**
 * if User is authenticated and no previous occurance of error exists in localStorage,
 *  then log the error to /services/logs Api & 
 * property flushed is set to true and update in localStorage
 * @param {object} errorBody 
 */
const sendErrorLog = (errorBody) => {
    // const stack = errorBody.stack || '-'
    const storedError = JSON.parse(sessionStorage.getItem('error')) || {};

    if (typeof errorBody !== "object") return;
    if (!Object.keys(errorBody).length) return;
    if (!errorBody.message) return;

    if (storedError.hasOwnProperty(`${errorBody.message}:${errorBody.source||''}`)) return;
    storedError[`${errorBody.message}:${errorBody.source||''}`] = errorBody;
    sessionStorage.setItem('error', JSON.stringify(storedError));

    if (window.firebase && window.firebase.auth().currentUser) {
        http('POST', `${appKeys.getBaseUrl()}/api/services/logs`, {
            message: errorBody.message || 'Error message',
            body: errorBody
        }).then(function () {
            storedError[`${errorBody.message}:${errorBody.source||''}`].flushed = true;
            sessionStorage.setItem('error', JSON.stringify(storedError));
        })
    };
}

/**
 * log all non flushed errors stored in localStorage to services/logs . 
 * flushed property is set to true when each error is logged and updated in localStorage
 */
const flushStoredErrors = () => {

    const storedError = JSON.parse(sessionStorage.getItem('error'));
    if (!storedError) return;

    Object.keys(storedError).forEach(function (key) {
        const errorBody = storedError[key]
        if (key.startsWith('undefined')) {
            delete storedError[key];
            sessionStorage.setItem('error', JSON.stringify(storedError));
            return
        }
        if (typeof errorBody !== "object") return;
        if (!Object.keys(errorBody).length) return;
        if (!errorBody.message) return;

        if (!errorBody.flushed) {
            http('POST', `${appKeys.getBaseUrl()}/api/services/logs`, {
                message: errorBody.message,
                body: errorBody
            }).then(function () {
                storedError[key].flushed = true;
                sessionStorage.setItem('error', JSON.stringify(storedError));
            })
        }
    })
}


/**
 * Check if user had super user permissions. Admin or support.
 * If admin or support Promise resovle with true else false
 */
const isElevatedUser = () => {
    return new Promise((resolve, reject) => {
        firebase.auth().currentUser.getIdTokenResult().then((idTokenResult) => {
            if (idTokenResult.claims.support) return resolve(true);
            return resolve(idTokenResult.claims.admin && Array.isArray(idTokenResult.claims.admin) && idTokenResult.claims.admin.length > 0)

        }).catch(reject)
    })
}



/**
 *  Inserts a logout button in header. Clicking this button will  signout user. 
 */
const addLogoutBtn = () => {
    const el = document.getElementById('app-bar-login');
    if (!el) return;
    document.getElementById('app-bar-signup').classList.add('hidden')
    el.textContent = 'Log out';
    el.removeAttribute('href');
    el.addEventListener('click', function () {
        firebase.auth().signOut().then(function () {
            redirect('')
        })
    })
}

const handleAuthUpdate = (authProps) => {

    return new Promise((resolve, reject) => {

        const auth = firebase.auth().currentUser;
        const nameProm = auth.displayName === authProps.displayName ? Promise.resolve() : auth.updateProfile({
            displayName: authProps.displayName
        })
        nameProm
            .then(function () {
                console.log('name updated')
                if (auth.email === authProps.email) return Promise.resolve()
                console.log('adding email...')
                return firebase.auth().currentUser.updateEmail(authProps.email)
            }).then(function () {

                if (auth.emailVerified) return Promise.resolve();
                console.log('sending verification email...')
                return firebase.auth().currentUser.sendEmailVerification()
            })
            .then(resolve)
            .catch(function (authError) {
                console.log(authError);
                authError.type = 'auth'
                // if (authError.code === 'auth/requires-recent-login') return reject()
                reject(authError)
            })
    })
}


const getEmailErrorMessage = (error) => {
    if (error.code === 'auth/requires-recent-login') {
        return 'auth/requires-recent-login'
    };
    if (error.code === 'auth/email-already-in-use') {
        return 'Email address is already in use. Add a different email address'
    };
    if (error.code === 'auth/invalid-email') {
        return 'Enter a correct email address'
    }
    return 'There was a problem with this email';
}


/**
 * Uses navigator.geolocation to get device location.
 */
const getLocation = () => {
    return new Promise((resolve, reject) => {
        const storedGeopoint = sessionStorage.getItem('geopoint')

        if (storedGeopoint) return resolve(JSON.parse(storedGeopoint))

        if (!"geolocation" in navigator) return reject("Your browser doesn't support geolocation.Please Use A different Browser")

        navigator.geolocation.getCurrentPosition(position => {
            const geopoint = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                provider: "HTML5"
            }
            sessionStorage.setItem('geopoint', JSON.stringify(geopoint))
            return resolve(geopoint);
        }, error => {
            error.type === 'geolocation'
            return reject(error)
        }, {
            enableHighAccuracy: false,
            timeout: 8000,
        })
    })
}

/**
 * Get user idToken to be used as bearer token for performing http requests
 */

const getIdToken = () => {
    return new Promise((resolve, reject) => {
        firebase.auth().currentUser.getIdToken().then(resolve).catch(reject);
    })
}

/**
 * Formats endpoint depending user privilege and endpoint
 * @param {string} endPoint 
 */
const formatEndPoint = (endPoint) => {
    //default prefix
    let prefix = '&';
    // return endpoint as it is for /shareLink , /logs , /profile & admin user.
    if (!window.isSupport || endPoint.indexOf('/shareLink') > -1 || endPoint.indexOf('/logs') > -1 || endPoint.indexOf('/profile/') > -1) return endPoint;

    //if user is support prefix with '?'
    if (endPoint.indexOf('/activities/') > -1 || endPoint.indexOf('/update-auth') > -1 || endPoint.indexOf('/batch') > -1 || endPoint.indexOf('/admin/bulk') > -1) {
        prefix = '?'
    }

    return `${endPoint}${prefix}support=true`
}

/**
 * Performs http requests with idToken
 * If fetch is not available then fallback to XMLHttpRequest.
 * @param {string} method 
 * @param {string} endPoint 
 * @param {object} postData 
 */
const http = (method, endPoint, postData) => {

    return new Promise((resolve, reject) => {
        return getIdToken().then(idToken => {
            if (!window.fetch) {
                return fallbackHttpRequest(method, endPoint, postData, idToken).then(resolve).catch(reject);
            }

            return fetch(formatEndPoint(endPoint), {
                method: method,
                body: postData ? createPostData(postData) : null,
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            }).then(response => {
                if (!response.status || response.status >= 226 || !response.ok) {
                    throw response
                }
                return response.json();
            }).then(function (res) {

                if (res.hasOwnProperty('success') && !res.success) {
                    reject(res);
                    return;
                }
                resolve(res)

            }).catch(function (err) {
                if (typeof err.text === "function") {
                    err.text().then(errorMessage => {
                        reject(JSON.parse(errorMessage))
                    })
                }
            })
        }).catch(reject)
    })

}


var fallbackHttpRequest = function fallbackHttpRequest(method, endpoint, postData, idToken) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, endpoint, true);
        if (idToken) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Authorization', "Bearer ".concat(idToken));
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (!xhr.status || xhr.status > 226) {
                    if (!xhr.response) return;
                    var errorObject = JSON.parse(xhr.response);
                    var apiFailBody = {
                        message: errorObject.message,
                        code: errorObject.code
                    };
                    return reject(apiFailBody);
                }

                xhr.responseText ? resolve(JSON.parse(xhr.responseText)) : resolve('success');
            }
        };

        xhr.send(postData ? createPostData(postData) : null);
    });
};

/**
 * sets timestamp to postData body
 * @param {object} postData 
 * @returns stringified json 
 */
const createPostData = (postData) => {
    postData.timestamp = Date.now();
    return JSON.stringify(postData);
}

/**
 * performs logout operation
 */
const signOut = () => {
    firebase.auth().signOut().then(() => {
        sessionStorage.removeItem('office')
        sessionStorage.removeItem('officeId')
    }).catch(console.log)
}

/**
 * redirects users to pathname 
 * @param {string} pathname 
 */
const redirect = (pathname) => {

    window.location = window.location.origin + pathname + (pathname.includes('.html') ? '' : '.html');
}

/**
 *  opens the MDCSnackBar to show user message
 * @param {string} text 
 * @param {string} buttonText 
 */
function showSnacksApiResponse(text, buttonText) {
    const sb = snackBar(text, buttonText);
    sb.open();
}

const snackBar = (labelText, buttonText) => {

    const container = createElement('div', {
        className: 'mdc-snackbar'
    })
    const surface = createElement('div', {
        className: 'mdc-snackbar__surface'
    })
    const label = createElement('div', {
        className: 'mdc-snackbar__label',
        role: 'status',
        'aria-live': 'polite',
        textContent: labelText
    })
    surface.appendChild(label)
    if (buttonText) {
        const actions = createElement('div', {
            className: 'mdc-snackbar__actions'
        })
        const button = createElement('button', {
            type: 'button',
            className: 'mdc-button mdc-snackbar__action',
            textContent: buttonText
        })
        actions.appendChild(button)
        surface.appendChild(actions)
    }

    container.appendChild(surface);
    if (document.querySelector('.mdc-snackbar')) {
        document.querySelector('.mdc-snackbar').remove();
    }
    document.body.appendChild(container)
    const sb = new mdc.snackbar.MDCSnackbar(container);
    return sb;

}

/**
 * If getLocation method rejects then map the error code to message.
 *  this message is then shown via showSnacksApiResponse()
 * @param {object} error 
 */
const handleLocationError = (error) => {

    let messageString = title = '';

    switch (error.code) {
        case 1:
            title = 'Location permission'
            messageString = 'Growthfile does not have permission to use your location.'
            break;
        case 2:
            title = 'Location failure'
            messageString = 'Failed to detect your location. Please try again or refresh your browser'
            break;
        case 3:
            title = 'Location failure',
                messageString = 'Failed to detect your location. Please try again or refresh your browser'
            break;
        default:
            break;
    }
    //show message to user
    showSnacksApiResponse(messageString);

}

function isAdmin(idTokenResult) {
    if (!idTokenResult.claims.hasOwnProperty('admin')) return;
    if (!Array.isArray(idTokenResult.claims.admin)) return;
    if (!idTokenResult.claims.admin.length) return;
    return true;
}



function shareLinkField(attr) {
    return `<div class="mdc-text-field mdc-text-field--outlined ${attr.label ? '' :'mdc-text-field--no-label'} full-width ${attr.leadingIcon ? 'mdc-text-field--with-leading-icon' :''} ${attr.trailingIcon ? 'mdc-text-field--with-trailing-icon' :''} ${attr.disabled ? 'mdc-text-field--disabled' :''}" id='${attr.id}'>
    ${attr.leadingIcon ? `<i class="material-icons mdc-text-field__icon mdc-text-field__icon--leading" tabindex="0" role="button">${attr.leadingIcon}</i>`:''}
    ${attr.trailingIcon ? `<i class="material-icons mdc-text-field__icon mdc-text-field__icon--trailing" tabindex="0" role="button" >${attr.trailingIcon}</i>` :''}
    <input autocomplete=${attr.autocomplete ? attr.autocomplete : 'off'} type="${attr.type || 'text'}" class="mdc-text-field__input" value="${attr.value || ''}"  ${attr.required ? 'required':''}  ${attr.disabled ? 'disabled':''} ${attr.readonly ? 'readonly':''}>
    
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      ${attr.label ? `<div class="mdc-notched-outline__notch">
      <label  class="mdc-floating-label">${attr.label}</label>
    </div>` :''}
      
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>`
}

const getShareLink = (office) => {
    return new Promise((resolve, reject) => {
        http('POST', `${appKeys.getBaseUrl()}/api/services/shareLink`, {
            office: office
        }).then(resolve).catch(reject)
    })
}

const shareWidget = (link, office) => {


    const el = createElement('div', {
        className: 'share-widget'
    })
    const grid = createElement('div', {
        className: 'mdc-layout-grid',
        style: 'padding-top:0px'
    })


    const linkManager = createElement('div', {
        className: 'link-manager'
    });


    linkManager.innerHTML = shareLinkField({
        value: link,
        trailingIcon: navigator.share ? 'share' : 'file_copy',
        readonly: true,
    })


    const field = new mdc.textField.MDCTextField(linkManager.querySelector('.mdc-text-field'))

    field.trailingIcon_.root.onclick = function () {
        field.focus()
        const shareText = `I want you to use OnDuty at work daily to mark attendance and keep track of work. Click here to download the app and start now.`

        if (navigator.share) {
            const shareData = {
                title: 'Share link',
                text: shareText,
                url: link
            }
            navigator.share(shareData).then(function (e) {

            }).catch(console.error)
            return
        }

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + link).then(function () {
                showSnacksApiResponse('Link copied')
            }).catch(function (error) {
                copyRegionToClipboard(link, shareText)
            })
            return
        }
        copyRegionToClipboard(link, shareText)
    }

    grid.appendChild(linkManager)
    if (!navigator.share) {
        const socialContainer = createElement("div", {
            className: 'social-container  pt-10 pb-10 mt-20 mdc-layout-grid__inner'
        });
        const desktopBrowserShareText = `Hi,%0A%0A${encodeURIComponent(`I want you to use Growthfile at work daily to avoid payment disputes and Get Paid in Full. `)}%0A%0A${encodeURIComponent('Click here to download the app and start now.')}%0A${encodeURIComponent(link)}`
        socialContainer.appendChild(createWhatsAppShareWidget(desktopBrowserShareText))
        socialContainer.appendChild(createMailShareWidget(desktopBrowserShareText))
        // socialContainer.appendChild(createTwitterShareWidget(link, `${shareText}`));
        // socialContainer.appendChild(createFacebookShareWidget(encodeURIComponent(link), `${shareText}`))

        grid.appendChild(socialContainer)
    }

    el.appendChild(grid)
    return el;
}



const copyRegionToClipboard = (url, shareText) => {
    const tempInput = createElement('input', {
        value: shareText + url + ` , Any issues do contact +918595422858`,
        id: 'copy-input'
    })
    document.body.appendChild(tempInput)
    const input = document.getElementById('copy-input')
    console.log(input.value)
    input.select();
    input.setSelectionRange(0, 9999);
    document.execCommand("copy")
    showSnacksApiResponse('Link copied')
    input.remove();

}

const parseURL = () => {
    const search = window.location.search;
    const param = new URLSearchParams(search);
    if (search && (param.get('utm_source') || param.get('utm_medium') || param.get('utm_campaign') || param.get('campaignId'))) return param;
    if (!firebase.auth().currentUser) return;

    const metadata = firebase.auth().currentUser.metadata
    if (metadata.creationTime === metadata.lastSignInTime) return new URLSearchParams('?utm_source=organic');
    return;
}

const createFacebookShareWidget = (url, text) => {
    const div = createElement('div', {
        className: 'social mdc-layout-grid__cell--span-2 social mdc-layout-grid__cell mdc-layout-grid__cell--span-3-desktop facebook'
    })
    const frame = createElement('iframe', {
        src: `https://www.facebook.com/plugins/share_button.php?href=${url}&layout=button&size=large&appId=425454438063638&width=110&height=28`,
        width: "110",
        height: "110",
        style: "border:none;overflow:hidden",
        scrolling: "no",
        frameborder: "0",
        allowTransparency: "true",
        allow: "encrypted-media"
    })
    frame.addEventListener('click', function () {

    })
    div.appendChild(frame)
    return div
}
const createTwitterShareWidget = (url, text) => {
    const div = createElement('div', {
        className: 'social mdc-layout-grid__cell--span-2 social mdc-layout-grid__cell--span-3-desktop twitter'
    })
    const a = createElement('a', {
        href: 'https://twitter.com/share?ref_src=twsrc%5Etfw',
        className: 'twitter-share-button',
        width: '100%'
    })

    a.dataset.url = url;
    a.dataset.text = text
    a.dataset.size = 'large'
    a.dataset.related = "growthfile",

        a.addEventListener('click', function () {

        })
    const script = createElement('script', {
        src: 'https://platform.twitter.com/widgets.js'
    })
    script.setAttribute('async', 'true');
    script.setAttribute('charset', 'utf-8')
    div.appendChild(a)
    div.appendChild(script)
    return div;

}

const createWhatsAppShareWidget = (shareText) => {

    const div = createElement('div', {
        className: 'social  mdc-layout-grid__cell--span-4 mdc-layout-grid__cell--span-6-desktop'
    })
    const button = createElement('a', {
        className: 'mdc-button whatsapp-button full-width',
        href: `https://api.whatsapp.com/send?text=${shareText}`,
        target: '_blank'
    })
    button.innerHTML = ` <div class="mdc-button__ripple"></div>
    <svg class="mdc-button__icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2489" height="2500" viewBox="0 0 1219.547 1225.016"><path fill="#E0E0E0" d="M1041.858 178.02C927.206 63.289 774.753.07 612.325 0 277.617 0 5.232 272.298 5.098 606.991c-.039 106.986 27.915 211.42 81.048 303.476L0 1225.016l321.898-84.406c88.689 48.368 188.547 73.855 290.166 73.896h.258.003c334.654 0 607.08-272.346 607.222-607.023.056-162.208-63.052-314.724-177.689-429.463zm-429.533 933.963h-.197c-90.578-.048-179.402-24.366-256.878-70.339l-18.438-10.93-191.021 50.083 51-186.176-12.013-19.087c-50.525-80.336-77.198-173.175-77.16-268.504.111-278.186 226.507-504.503 504.898-504.503 134.812.056 261.519 52.604 356.814 147.965 95.289 95.36 147.728 222.128 147.688 356.948-.118 278.195-226.522 504.543-504.693 504.543z"></path><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="609.77" y1="1190.114" x2="609.77" y2="21.084"><stop offset="0" stop-color="#20b038"></stop><stop offset="1" stop-color="#60d66a"></stop></linearGradient><path fill="url(#a)" d="M27.875 1190.114l82.211-300.18c-50.719-87.852-77.391-187.523-77.359-289.602.133-319.398 260.078-579.25 579.469-579.25 155.016.07 300.508 60.398 409.898 169.891 109.414 109.492 169.633 255.031 169.57 409.812-.133 319.406-260.094 579.281-579.445 579.281-.023 0 .016 0 0 0h-.258c-96.977-.031-192.266-24.375-276.898-70.5l-307.188 80.548z"></path><image overflow="visible" opacity=".08" width="682" height="639"  transform="translate(270.984 291.372)"></image><path fill-rule="evenodd" clip-rule="evenodd" fill="#FFF" d="M462.273 349.294c-11.234-24.977-23.062-25.477-33.75-25.914-8.742-.375-18.75-.352-28.742-.352-10 0-26.25 3.758-39.992 18.766-13.75 15.008-52.5 51.289-52.5 125.078 0 73.797 53.75 145.102 61.242 155.117 7.5 10 103.758 166.266 256.203 226.383 126.695 49.961 152.477 40.023 179.977 37.523s88.734-36.273 101.234-71.297c12.5-35.016 12.5-65.031 8.75-71.305-3.75-6.25-13.75-10-28.75-17.5s-88.734-43.789-102.484-48.789-23.75-7.5-33.75 7.516c-10 15-38.727 48.773-47.477 58.773-8.75 10.023-17.5 11.273-32.5 3.773-15-7.523-63.305-23.344-120.609-74.438-44.586-39.75-74.688-88.844-83.438-103.859-8.75-15-.938-23.125 6.586-30.602 6.734-6.719 15-17.508 22.5-26.266 7.484-8.758 9.984-15.008 14.984-25.008 5-10.016 2.5-18.773-1.25-26.273s-32.898-81.67-46.234-111.326z"></path><path fill="#FFF" d="M1036.898 176.091C923.562 62.677 772.859.185 612.297.114 281.43.114 12.172 269.286 12.039 600.137 12 705.896 39.633 809.13 92.156 900.13L7 1211.067l318.203-83.438c87.672 47.812 186.383 73.008 286.836 73.047h.255.003c330.812 0 600.109-269.219 600.25-600.055.055-160.343-62.328-311.108-175.649-424.53zm-424.601 923.242h-.195c-89.539-.047-177.344-24.086-253.93-69.531l-18.227-10.805-188.828 49.508 50.414-184.039-11.875-18.867c-49.945-79.414-76.312-171.188-76.273-265.422.109-274.992 223.906-498.711 499.102-498.711 133.266.055 258.516 52 352.719 146.266 94.195 94.266 146.031 219.578 145.992 352.852-.118 274.999-223.923 498.749-498.899 498.749z"></path></svg>
    <span class="mdc-button__label">Send</span>`
    div.appendChild(button)
    return div
}

const createMailShareWidget = (shareText) => {
    const div = createElement('div', {
        className: 'social  mdc-layout-grid__cell--span-4 mdc-layout-grid__cell--span-6-desktop'
    })
    const button = createElement('a', {
        className: 'mdc-button mail-button mdc-button--outlined full-width',
        href: `mailto:?Subject=${encodeURIComponent('Welcome to Growthfile - Here’s your link to download the app')}&body=${shareText}`,
        target: '_blank'
    })
    button.innerHTML = ` <div class="mdc-button__ripple"></div>
    <i class="material-icons mdc-button__icon" aria-hidden="true">mail  </i>

    <span class="mdc-button__label">Send</span>`
    div.appendChild(button)
    return div
}

const handleRecaptcha = (buttonId) => {
    //localize the reCAPTCHA to user's local launguage preference
    firebase.auth().useDeviceLanguage();

    return new firebase.auth.RecaptchaVerifier(buttonId, {
        'size': 'invisible',
        'callback': function (response) {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': function () {
            // Response expired. Ask user to solve reCAPTCHA again.
            // ...
        }
    });
}




const handleAuthAnalytics = (authResult, tokenResult) => {
    // if (!result) {
    //     fbq('trackCustom', 'login');
    //     return
    // }

    // if (result && !result.additionalUserInfo) return;
    console.log(authResult);
    if (!window.fbq) return;
    if (authResult.additionalUserInfo.isNewUser) {

        // firebase.auth().currentUser.getIdTokenResult().then(function (tokenResult) {
        if (isAdmin(tokenResult)) {
            fbq('trackCustom', 'Sign Up Admin');
            return
        }
        fbq('trackCustom', 'Sign Up');
        // })
        return
    }
    fbq('trackCustom', 'login');
}



/**
 * convert image to base64
 * @param {Event} evt 
 * @param {Number} compressionFactor 
 */
const getImageBase64 = (evt, compressionFactor) => {
    return new Promise(function (resolve, reject) {
        const files = evt.target.files
        if (!files.length) return;
        const file = files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (fileLoadEvt) {
            const srcData = fileLoadEvt.target.result;
            const image = new Image();
            image.src = srcData;
            image.onload = function () {
                return resolve(resizeAndCompressImage(image, compressionFactor))
            }
        }
        fileReader.readAsDataURL(file);
    })
}

/**
 *  Compress  via loading it in canvas.
 *  image is converted to jpeg format
 * @param {Image} image 
 * @param {Number} compressionFactor 
 * @returns {Base64} newDataUrl // modified jpeg image data url
 */
const resizeAndCompressImage = (image, compressionFactor = 0.92) => {
    var canvas = document.createElement('canvas');
    canvas.width = image.width
    canvas.height = image.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    const newDataUrl = canvas.toDataURL('image/jpeg', compressionFactor);

    return newDataUrl;
}




const setHelperInvalid = (field, message) => {
    field.focus()
    field.foundation.setValid(false)
    field.foundation.adapter.shakeLabel(true);
    if (message) {
        field.helperTextContent = message;
    }
}

const setHelperValid = (field) => {
    field.focus();
    field.foundation.setValid(true);
    field.helperTextContent = '';
}

const hasValidSchedule = (schedule) => {
    if (!Array.isArray(schedule)) return false;
    return schedule.length;

}

const officeHasMembership = (schedule) => {
    if (!hasValidSchedule(schedule)) return false;
    const st = schedule[0].startTime;
    const et = schedule[0].endTime;
    if (st == et && st == 0) return;
    if (st == et && Math.abs(et - st) == 0) return;
    return true;
}

const isOfficeMembershipExpired = (schedule) => {
    return Date.now() > schedule[0].endTime
}

const getDateDiff = (schedule) => {
    const dateDiff = new Date(schedule[0].endTime).getDate() - new Date(schedule[0].startTime).getDate()
    return dateDiff
}

const isValidPincode = (pincode) => {
    return new Promise((resolve, reject) => {
        getPincode().then(pincodes => {
            if (pincodes[pincode]) return resolve(true)
            return resolve(false)
        }).catch(reject)
    })
}

const getPincode = () => {
    return new Promise((resolve, reject) => {
        if (window.fetch) {
            window.fetch('/pincodes.json').then(res => {
                return res.json()
            }).then(resolve).catch(reject)
            return
        }
        var request = new XMLHttpRequest();
        request.open('GET', '/pincodes.json');
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                resolve(JSON.parse(request.response))
                return
            }
            reject(request);
        };
        request.send();
    })
}



const phoneFieldInit = (numberField, dropEl) => {
    const input = numberField.input_;
    return intlTelInput(input, {
        initialCountry: "IN",
        formatOnDisplay: true,
        separateDialCode: true,
        dropdownContainer: dropEl || document.getElementById('country-dom')
    });
};


const getDuration = (amount, startTime) => {

    const d = startTime ? new Date(startTime) : new Date()
    switch (amount) {
        case 999:
            d.setMonth(d.getMonth() + 3);
            break;
        case 2999:
            d.setMonth(d.getMonth() + 12);
            break;
        case 0:
            d.setDate(d.getDate() + 3);
            break;
    }
    return Date.parse(d)
}