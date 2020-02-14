window.commonDom = {}

const statusChange = (activityId, status) => {
    return new Promise((resolve, reject) => {
        getLocation().then(geopoint => {
            http('PATCH', `${appKeys.getBaseUrl()}/api/activities/change-status`, {
                activityId: activityId,
                status: status,
                geopoint: geopoint
            }).then(statusChangeResponse => {
                showSnacksApiResponse(`Success`)
                resolve(statusChangeResponse)
            }).catch(function (err) {
                showSnacksApiResponse(err.message)
                reject(err.message)
            })
        }).catch(handleLocationError)
    });
}

const share = (activityId, phoneNumbers) => {
    return new Promise((resolve, reject) => {

        getLocation().then(geopoint => {
            http('PATCH', `${appKeys.getBaseUrl()}/api/activities/share/`, {
                activityId: activityId,
                share: phoneNumbers,
                geopoint: geopoint
            }).then(function (response) {

                console.log(response)
                showSnacksApiResponse(`Updated`)
                resolve(response)
            }).catch(function (err) {
                showSnacksApiResponse(err.message)
                reject(err)
            })
        }).catch(handleLocationError);
    })
}

const sortByLatest = (data) => {
    return data.slice(0).sort((a, b) => {
        return b.lastModifiedDate - a.lastModifiedDate;
    })
}

function sendFormToParent(formData) {
    getLocation().then(function (geopoint) {
        formData.geopoint = geopoint
        const url = `${appKeys.getBaseUrl()}/api/activities/${formData.isCreate ? 'create':'update'}`;
        const method = formData.isCreate ? 'POST' : 'PATCH'
        http(method, url, formData).then(function () {
            showSnacksApiResponse('success');

        }).catch(function (err) {
            showSnacksApiResponse(err.message)
        })
    }).catch(handleLocationError);
}

const updateState = (...args) => {
    console.log(args)
    const state = args[0]
    history.pushState({
        view: state.view,
        office: state.office
    }, state.view, `/?view=${state.name}`);
    updateBreadCrumb(state.name);
    args.shift()
    window[state.view](...args)

}

const back = () => {
    history.back()
}

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
            return reject(error)
        }, {
            enableHighAccuracy: false,
            timeout: 8000,
        })
    })
}


const getIdToken = () => {
    return new Promise((resolve, reject) => {
        firebase.auth().currentUser.getIdToken().then(resolve).catch(reject);
    })
}



const http = (method, endPoint, postData) => {
    if (commonDom.progressBar) {
        commonDom.progressBar.open();
    }
    return new Promise((resolve, reject) => {
        getIdToken().then(idToken => {
            fetch(window.commonDom.support ? `${endPoint}&support=true` : endPoint, {
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
                if (commonDom.progressBar) {
                    commonDom.progressBar.close();
                }

                if (res.hasOwnProperty('success') && !res.success) {
                    reject(res);
                    return;
                }
                resolve(res)

            }).catch(function (err) {
                if (commonDom.progressBar) {
                    commonDom.progressBar.close();
                }
                err.text().then(errorMessage => {
                    reject(JSON.parse(errorMessage))
                })
            })
        }).catch(error => {
            if (commonDom.progressBar) {
                commonDom.progressBar.close();
            }
            return reject(error)
        })
    })

}


const createPostData = (postData) => {
    console.log(postData)
    postData.timestamp = offsetTime();
    return JSON.stringify(postData);
}


const offsetTime = () => {
    return Date.now();
    //  return Date.now() + Number(sessionStorage.getItem('serverTime'))
}

const signOut = (topAppBar, drawer) => {
    firebase.auth().signOut().then(function () {
        if (topAppBar && drawer) {
            document.getElementById('app').classList.remove('mdc-top-app-bar--fixed-adjust')
            drawer.root_.classList.add('mdc-drawer--modal');
            hideTopAppBar(topAppBar)
            drawer.root_.classList.add("hidden")
            drawer.open = false;
            closeProfile();
        }
    }).catch(console.log)
}

const redirect = (pathname) => {
    window.location = window.location.origin + pathname;
}

function showSnacksApiResponse(text, buttonText = 'Okay') {

    const sb = snackBar(text, buttonText);
    sb.open();

}
const handleLocationError = (error) => {

    console.log(error)
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
    const sb = snackBar(messageString, 'Okay');
    sb.open();


}

const removeChildren = (parent) => {
    let childrenNodes = parent.childNodes.length;
    while (childrenNodes--) {
        parent.removeChild(parent.lastChild);
    }
}


const getConfirmedActivitiesCount = (activityObject) => {
    let count = 0;
    Object.keys(activityObject).forEach(key => {
        if (activityObject[key].status === 'CONFIRMED') {
            count++
        }
    })
    return count;
}

const uploadSheet = (event, template) => {

    event.preventDefault();
    getBinaryFile(event.target.files[0]).then(function (file) {
        console.log(file)
        getLocation().then((geopoint) => {
            http('POST', `${appKeys.getBaseUrl()}/api/admin/bulk`, {
                office: history.state.office,
                data: file,
                template: template,
                geopoint: geopoint
            }).then(function () {
                showSnacksApiResponse('Please check your email');
            }).catch(function (error) {
                showSnacksApiResponse(error.message);
            })
        })
    })
}

const getBinaryFile = (file) => {
    return new Promise(resolve => {
        const fReader = new FileReader();
        fReader.onloadend = function (event) {
            return resolve(event.target.result);
        }
        fReader.readAsBinaryString(file);
    })
}


const downloadSample = (template) => {
    http('GET', `/json?action=view-templates&name=${template}`).then(template => {
        const keys = Object.keys(template);

        createExcelSheet(template[keys[0]]);
    }).catch(function (err) {
        console.error(err)
        showSnacksApiResponse('Try again later');
    })
}


function createExcelSheet(rawTemplate) {
    var wb = XLSX.utils.book_new();
    wb.props = {
        Title: rawTemplate.name,
        Subject: `${rawTemplate.name} sheet`,
        Author: 'Growthfile',
        CreatedDate: new Date()
    }

    const data = [];

    if (rawTemplate.name === 'customer' ||
        rawTemplate.name === 'branch') {
        data.push(['address', 'location'])
    } else {
        const allKeys = Object.keys(rawTemplate.attachment);

        rawTemplate
            .schedule
            .forEach(function (name) {
                allKeys.push(name);
            });
        rawTemplate
            .venue
            .forEach(function (venueDescriptor) {
                allKeys.push(venueDescriptor);
            });

        data.push(allKeys);

    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    console.log(ws)
    XLSX.utils.book_append_sheet(wb, ws, "Sheet");
    XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'binary'
    });
    XLSX.writeFile(wb, rawTemplate.name + '.xlsx');

}

function debounce(func, wait, immeditate) {
    var timeout;
    return function () {
        var context = this;
        var args = arguments;
        var later = function () {
            timeout = null;
            if (!immeditate) func.apply(context, args)
        }
        var callNow = immeditate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    }
}

function originMatch(origin) {
    const origins = ['https://growthfile-207204.firebaseapp.com', 'https://growthfile.com', 'https://growthfile-testing.firebaseapp.com', 'http://localhost:5000', 'http://localhost', 'https://growthfilev2-0.firebaseapp.com']
    return origins.indexOf(origin) > -1;
}

window.addEventListener('message', function (event) {
    console.log(event)
    if (!originMatch(event.origin)) return;
    this.console.log(event.data);
    window[event.data.name](event.data.body);
})


function resizeFrame(height) {

    const iframe = document.getElementById('form-iframe');
    if (height) {
        iframe.style.height = height;
    } else {
        iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
    }
}

const addView = (el, sub, body) => {
    const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
    <span class="mdc-top-app-bar__title">${sub.template === 'subscription' ? 'Add other contacts' : sub.template === 'users' ? 'Add people' : sub.template}</span>
    `
    const header = createHeader(backIcon, '');
    header.root_.classList.remove('hidden');

    el.classList.remove("mdc-layout-grid", 'pl-0', 'pr-0');
    el.innerHTML = `
    ${sub.template === 'office' || sub.template === 'subscription' || sub.template ==='users' ? header.root_.innerHTML : ''}
    <iframe class='' id='form-iframe' src='https://growthfile-207204.firebaseapp.com/v2/forms/${sub.template}/edit.html'></iframe>`;
    document.getElementById('form-iframe').addEventListener("load", ev => {
        const frame = document.getElementById('form-iframe');
        if (!frame) return;
        frame.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
        frame.contentWindow.postMessage({
            name: 'init',
            template: sub,
            body: body,
            deviceType: ''
        }, 'https://growthfile-207204.firebaseapp.com');
        if (!sub.canEdit) {
            frame.contentWindow.postMessage({
                name: 'toggleSubmit',
                template: '',
                body: '',
                deviceType: ''
            }, 'https://growthfile-207204.firebaseapp.com')
        }
    })
}



const  createDynamiclink  = (urlParam,logo) => {
    return new Promise((resolve, reject) => {
        const param = new URLSearchParams(urlParam);
        let office;
        if(param.get('office')){
            office = decodeURI(param.get('office'))
        }
        const storedLinks = JSON.parse(localStorage.getItem('storedLinks'));
        if (storedLinks && storedLinks[office]) {
             return resolve(storedLinks[office])
        }

        fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${appKeys.getMapKey()}`, {
            method: 'POST',
            body: JSON.stringify({
                "dynamicLinkInfo": {
                    "domainUriPrefix": "https://growthfile.page.link",
                    "link": `https://growthfile-207204.firebaseapp.com/v2/${urlParam}`,
                    "androidInfo": {
                        "androidPackageName": "com.growthfile.growthfileNew",
                        "androidMinPackageVersionCode": "15",
                    },
                    "navigationInfo": {
                        "enableForcedRedirect": true,
                      },
                    "iosInfo": {
                        "iosBundleId": "com.Growthfile.GrowthfileNewApp",
                        "iosAppStoreId": "1441388774",
                    },
                    "desktopInfo":{
                        "desktopFallbackLink": "https://www.growthfile.com/welcome.html"
                    },
                    "socialMetaTagInfo": {
                        "socialTitle": `${office} @Growthfile`,
                        "socialDescription":"No More Conflicts On Attendance & Leaves. Record Them Automatically!",
                        "socialImageLink": logo
                    },
                },
                "suffix": {
                    "option": "UNGUESSABLE"
                }
            }),
            headers: {
                'Content-type': 'application/json',
            }
        }).then(response => {
            return response.json()
        }).then(function (url) {
            const linkObject = {}
            linkObject[param.get('office')] = url.shortLink;

            localStorage.setItem('storedLinks', JSON.stringify(linkObject));

            resolve(url.shortLink)

        })
    });
}

const shareWidget = (link, office) => {
    const auth = firebase.auth().currentUser;

    const shareText = `Hi ${auth.displayName} from ${office} wants you to use Growthfile to mark daily attendance, apply for leave and regularize attendance. To download please click.`

    const el = createElement('div', {
        className: 'share-widget'
    })
    el.appendChild(createElement('h1', {
        className: 'mdc-typography--headline6 mb-10 mt-0',
        textContent: 'Invite users to download'
    }))

    const linkManager = createElement('div', {
        className: 'link-manager'
    })
    const input = createElement('input', {
        className: 'link-manager-input',
        readOnly: true,
        type: 'text',
        value: link
    })

    const copyBtn = button('Copy link');
    linkManager.appendChild(input)
    linkManager.appendChild(copyBtn);

    const socialContainer = createElement("div", {
        className: 'social-container mdc-layout-grid__inner pt-10 pb-10'
    })
    const whatsapp = createElement('a', {
        className: 'social mdc-layout-grid__cell--span-1-phone mdc-layout-grid__cell--span-2-desktop mdc-layout-grid__cell--span-2-tablet social',
        href: `whatsapp://send?text=${encodeString(shareText)}%20${link}`
    })
    whatsapp.dataset.action = "share/whatsapp/share"
    whatsapp.appendChild(createElement('img', {
        src: '../img/whatsapp.png'
    }))
    const mail = createElement('a', {
        className: 'social mdc-layout-grid__cell--span-1-phone mdc-layout-grid__cell--span-2-desktop mdc-layout-grid__cell--span-2-tablet',
        href: `mailto:?Subject=Download%20Growthfile&cc=help%40growthfile.com&body=${encodeString(shareText)}%20${link}`
    })
    mail.appendChild(createElement('img', {
        src: '../img/mail.png'
    }))
    const sms = createElement('a', {
        className: 'social mdc-layout-grid__cell--span-1-phone mdc-layout-grid__cell--span-2-desktop mdc-layout-grid__cell--span-2-tablet',
        href: `sms:?&body=${encodeString(shareText)}%20${link}`
    })
    sms.appendChild(createElement('img', {
        src: '../img/sms.png'
    }))

    socialContainer.appendChild(whatsapp)
    socialContainer.appendChild(mail)
    socialContainer.appendChild(sms)

    socialContainer.appendChild(createTwitterShareWidget(link, `${shareText}`))

    el.appendChild(linkManager)
    el.appendChild(socialContainer)

    copyRegionToClipboard(input)
    copyBtn.addEventListener('click', function () {
        copyRegionToClipboard(input)
    })
    return el;
}

const copyRegionToClipboard = (el) => {
    el.select();
    el.setSelectionRange(0, 9999);
    document.execCommand("copy")
    showSnacksApiResponse('Link copied')
}

const parseURL = () => {
    const search = window.location.search;
    if (!search) return;
    const param = new URLSearchParams(search);
    return param;

}

const createTwitterShareWidget = (url, text) => {
    const div = createElement('div', {
        className: 'mdc-layout-grid__cell--span-1-phone mdc-layout-grid__cell--span-2-desktop mdc-layout-grid__cell--span-2-tablet mdc-layout-grid__cell--align-middle social'
    })

    const a = createElement('a', {
        href: 'https://twitter.com/share?ref_src=twsrc%5Etfw',
        className: 'twitter-share-button'
    })
    a.dataset.url = url;
    a.dataset.lang = 'en'
    a.dataset.showCount = 'false';
    a.dataset.text = text
    const script = createElement('script', {
        src: 'https://platform.twitter.com/widgets.js'
    })
    script.setAttribute('async', 'true');
    script.setAttribute('charset', 'utf-8')
    div.appendChild(a)
    div.appendChild(script)
    return div;

}


const encodeString = (string) => {
    return encodeURIComponent(string)
}