var placeService;
var placeResult;
var searchPlaceMarkers = [];
var placeSearchField;
var map;


function chooseAlternativePhoneNumber(alternatePhoneNumbers, geopoint) {
    const auth = firebase.auth().currentUser;
    const appEl = document.getElementById('app-current-panel');
    appEl.innerHTML = `<div class='phone-number-choose ${alternatePhoneNumbers.length == 1 ? 'slider' :''}'>
            <div class='phone-number-choose-cont ${alternatePhoneNumbers.length == 1 ? 'slider-container' :''}''>
                <h1 class='mdc-typography--headline5 mb-0'>
                    Hello, ${auth.displayName}
                </h1>

                ${alternatePhoneNumbers.length == 1 ? `<p class='mdc-typography--body1 pl-20 pr-20'>
                We found another number <span class='mdc-theme--primary'><b>${alternatePhoneNumbers[0].phoneNumber}</b></span> you used with this device for Company <span class='mdc-theme--primary'><b>${alternatePhoneNumbers[0].office}</b></span>. Login with this phone number to proceed
                </p>`:`<p class='mdc-typography--body1'>We found other numbers you used with this device . Login with any of these phone numbers to proceed</p>

                <ul class='mdc-list  mdc-list--two-line' id='phone-list'>                   
                    ${alternatePhoneNumbers.map(function(data,index){
                        return `<li class='mdc-list-item'>
                        <span class="mdc-list-item__text">
                          <span class="mdc-list-item__primary-text">${data.phoneNumber}</span>
                          <span class="mdc-list-item__secondary-text mdc-theme--primary">Company : ${data.office}</span>
                      </span>
                      </li>`
                    }).join("")}
                </ul>`}
              
            </div>
    </div>
    ${actionButton('RE-LOGIN', 'confirm-phone-btn').outerHTML}
    `

    const confirmBtn = document.getElementById("confirm-phone-btn");
    if (!confirmBtn) return;
    new mdc.ripple.MDCRipple(confirmBtn);
    confirmBtn.addEventListener('click', revokeSession);
    const list = document.getElementById('phone-list');
    if (!list) return;


}

function searchOffice(geopoint = history.state[1]) {

    const appEl = document.getElementById('home-login');
    appEl.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
    })
    appEl.innerHTML = `<div class='search-map-cont'>
     <div class='search-container'>
     
        ${textField({
            id: 'search-address',
            label: 'Search for your company location',
            leadingIcon:'search',
           
            autocomplete:'organization'
        })}
      <div class='search-result-container'>
        
        
         <ul class='mdc-list mdc-list--two-line mdc-list--avatar-list' id='place-query-ul'>
         </ul>
      </div>
     </div>
    <div id='map-search'></div>
     
    </div>`;



    const center = {
        lat: geopoint.latitude,
        lng: geopoint.longitude
    }

    map = new google.maps.Map(document.getElementById('map-search'), {
        zoom: 15,
        center: center,
        disableDefaultUI: true
    });

    var marker = new google.maps.Marker({
        position: center,
        icon: './img/bluecircle.png',
        map: map
    });

    var radiusCircle = new google.maps.Circle({
        strokeColor: '#89273E',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#89273E',
        fillOpacity: 0.35,
        map: map,
        center: center,
        radius: geopoint.accuracy < 100 ? geopoint.accuracy * 2 : geopoint.accuracy
    });

    placeSearchField = new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field'));
    placeSearchField.focus();
    // placeSearchField.trailingIcon_.root_.addEventListener('click', function () {
    //     placeSearchField.value = ''
    //     placeSearchField.trailingIcon_.root_.classList.add('hidden')
    //     document.getElementById('place-query-ul').innerHTML = ''
    //     placeSearchField.focus();
    //     map.setCenter(center)
    //     clearPlaceMarkers();
    //     clearPlaceCustomControl();
    // });

    // placeSearchField.trailingIcon_.root_.classList.add('hidden')
    const placeRequesParam = {
        query: '',
        fields: ['name', 'geometry', 'place_id', 'formatted_address', 'types']
    }

    placeSearchField.input_.addEventListener('input', function (event) {
        if (!event.target.value.trim()) return
        // placeSearchField.trailingIcon_.root_.classList.remove('hidden')
        var searchEvent = new CustomEvent('searchPlaces', {
            detail: {
                value: event.target.value,
                placeRequesParam: placeRequesParam,
                geopoint: geopoint
            }
        });
        window.dispatchEvent(searchEvent);
    });
}

var searchDebounde = debounce(function (event) {

    const placeRequesParam = event.detail.placeRequesParam;
    const value = event.detail.value;
    const geopoint = event.detail.geopoint
    placeRequesParam.query = value;
    const ulEl = document.getElementById('place-query-ul');
    let ul;
    if (ulEl) {
        ul = new mdc.list.MDCList(ulEl)
    }
    var infowindow = new google.maps.InfoWindow();
    // progressBar.open();

    placeService = new google.maps.places.PlacesService(map)
    placeService.findPlaceFromQuery(placeRequesParam, function (results, status) {
        if (ul) {
            ul.root_.innerHTML = ''
        }
        // progressBar.close();
        if (status === google.maps.places.PlacesServiceStatus.OK) {

            if (results.length == 1) {
                placeResult = results[0]
                createPlaceMarker(infowindow);
                showPlaceBox(geopoint);
                return;
            }

            results.forEach(function (resultVal) {

                const li = searchPlaceResultList(resultVal.name, resultVal.formatted_address);
                li.addEventListener('click', function () {
                    placeResult = resultVal
                    if (ul) {
                        ul.root_.innerHTML = ''
                    }
                    placeSearchField.value = placeResult.name
                    showPlaceBox(geopoint);
                    createPlaceMarker(infowindow)

                });
                if (ul) {
                    ul.root_.appendChild(li);

                }
            });

            return;
        }

        clearPlaceCustomControl();
        clearPlaceMarkers()
        map.setCenter({
            lat: geopoint.latitude,
            lng: geopoint.longitude
        });
        if (ul) {

            ul.root_.appendChild(createLi(`No result found for "${value}"`));
        }
    })
}, 1000, false)

window.addEventListener('searchPlaces', searchDebounde)

function CenterControl(controlDiv) {

    var controlUI = createElement('div', {
        className: 'mdc-card place-box mdc-elevation--z24'
    });
    controlUI.innerHTML = `
    <div class='mdc-card__primary-action'>
      <div class='demo-card__primary'>
      <ul class='mdc-list'>
        <li class='mdc-list-item pl-0 pr-0'>
          <h2 class='demo-card__title mdc-typography mdc-typography--headline6'>${placeResult.name}</h2>
          <span class='mdc-list-item__meta material-icons'>keyboard_arrow_up</span
        </li>
      </ul>  
        <div class='mdc-typography mdc-typography--body2 pb-20'>
            ${placeResult.formatted_address}
        </div>
      </div>
    </div>`

    controlDiv.appendChild(controlUI);
}

function expandPlaceBox(userGeopoint) {

    placeService.getDetails({
        placeId: placeResult.place_id,
        fields: ['international_phone_number', 'photos']
    }, function (placeDetail, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            placeResult.international_phone_number = placeDetail.international_phone_number || ''
            placeResult.photos = placeDetail.photos || []
        }
        console.log(placeDetail)
        const parentEl = document.getElementById('home-login');

        const backIcon = `<a class='mdc-top-app-bar__navigation-icon material-icons'>arrow_back</a>
        <span class="mdc-top-app-bar__title">${placeResult.name}</span>
        `
        const clearIcon = `<button class="material-icons mdc-top-app-bar__action-item mdc-icon-button" aria-label="remove" id='close-placebox'>clear</button>`
        const header = createHeader(backIcon, clearIcon);

        parentEl.innerHTML = `
        ${header.root_.innerHTML}
        <div class='expand-box up'>
        <div class='mdc-card'>
            <div class='mdc-card__primary-action'>
               <div class='mdc-card__media mdc-card__media--16-9' style='max-height: 200px;background-image:url("${placeResult.photos.length ? placeResult.photos[0].getUrl() : './img/business.svg'}")'>
                ${placeResult.photos.length > 1 ? ` <span class="prev material-icons" id='prev-image'>navigate_before</span>
                <span class="next material-icons" id='next-image'>navigate_next</span>` :'' }
            </div>
                
                <div class='demo-card__primary'>
                  <h2 class='demo-card__title mdc-typography mdc-typography--headline6'>${placeResult.name}</h2>
                </div>
                <div class="mdc-chip-set" role="grid"> 
                  ${placeResult.types.map(function(type){
                    return `<div class="mdc-chip" role="row">
                    <div class="mdc-chip__ripple"></div>
                    <span role="gridcell">
                      <span role="button" tabindex="0" class="mdc-chip__text">${type}</span>
                    </span>
                  </div>`
                  }).join("")} 
                </div>
                <li class='mdc-list-item address-list'>
                  <span class="mdc-list-item__graphic material-icons" aria-hidden="true">room</span>
                  ${placeResult.formatted_address}
                </li>
                
                <ul class='mdc-list'>
                  ${placeResult.international_phone_number ? ` <li class='mdc-list-item'>
                    <span class="mdc-list-item__graphic material-icons" aria-hidden="true">phone</span>
                      ${placeResult.international_phone_number}
                    </li>` : ''}
                </ul>
                 
                  </div>
                  </div>
                  ${createExtendedFab('check','CONFIRM','confirm-btn',true).outerHTML}
      </div>`

        document.getElementById('close-placebox').addEventListener('click', function () {
            document.querySelector('.expand-box').classList.add('down')
            document.querySelector('.expand-box').classList.remove('up')
            setTimeout(function () {
                searchOffice(userGeopoint)
            }, 500)
        })

        const confirmFab = document.getElementById('confirm-btn');
        new mdc.ripple.MDCRipple(confirmFab);

        confirmFab.addEventListener('click', function () {

            confirmFab.classList.add('mdc-fab--exited')
            http('GET', `${appKeys.getBaseUrl()}/api/services/search?q=${placeResult.place_id}`).then(function (searchResponse) {
                let match = false;
                searchResponse.forEach(item=>{
                    if(item.name === placeResult.name) {
                        match = true
                    }
                })
                if(!match) {
                    createOfficeInit(confirmFab);
                    return
                }
                showSnacksApiResponse('This company already exists');
                return;

            }).catch(function (error) {
                console.log(error)
                confirmFab.classList.remove('mdc-fab--exited')
            })
        })

        const nextImageEl = document.getElementById('next-image')
        const prevImageEl = document.getElementById('prev-image');
        if (nextImageEl && prevImageEl) {
            let index = 0;
            nextImageEl.addEventListener('click', function () {
                index++
                if (index >= placeResult.photos.length) {
                    index = 0
                }
                loadImageInPlaceBox(placeResult.photos[index].getUrl())
            })
            prevImageEl.addEventListener('click', function () {
                index--
                if (index < 0) {
                    index = placeResult.photos.length - 1
                }
                loadImageInPlaceBox(placeResult.photos[index].getUrl())
            })
        };
    });
}


function isAdmin(idTokenResult) {
    if (!idTokenResult.claims.hasOwnProperty('admin')) return;
    if (!Array.isArray(idTokenResult.claims.admin)) return;
    if (!idTokenResult.claims.admin.length) return;
    return true;
}


function createOfficeInit(confirmFab) {
    const content = `
    <p>Are you sure you want to  create a new company ?</p>
    <p>Before continuing please agree to Growthfile's privacy policy & terms or use</p>
    <div class='terms-cont'>
        ${createCheckBox('office-checkbox')}
    </div>`
    var dialog = new Dialog(`${placeResult.name} not found`, content).create();
    dialog.buttons_[0].textContent = 'cancel'
    dialog.buttons_[1].textContent = 'create new company';
    dialog.buttons_[1].setAttribute('disabled', 'true')
    dialog.open();

    const form = new mdc.formField.MDCFormField(dialog.content_.querySelector('.mdc-form-field'))
    const chckBox = new mdc.checkbox.MDCCheckbox(dialog.content_.querySelector('.mdc-checkbox'))
    form.input = chckBox;
    form.label_.innerHTML = `I agree to <a href='https://www.growthfile.com/legal.html#privacy-policy'>Privacy Policy</a> &
    <a href='https://www.growthfile.com/legal.html#terms-of-use-user'>Terms of use</a>`

    chckBox.listen('change', function () {
        if (chckBox.checked) {
            dialog.buttons_[1].removeAttribute('disabled')
        } else {
            dialog.buttons_[1].setAttribute('disabled', 'true')
        }
    })

    dialog.listen('MDCDialog:closed', function (dialogEvent) {
        if (dialogEvent.detail.action !== 'accept') {
            confirmFab.classList.remove('mdc-fab--exited')
            return;
        }

        const template = {
            'template': 'office',
            'firstContact': '',
            'secondContact': '',
            'name': placeResult.name,
            'placeId': placeResult.place_id,
            'registeredOfficeAddress': placeResult.formatted_address,
            canEdit:true
        }
        history.pushState(['addView'], null, null);
        addView(document.getElementById('home-login'), template);
    })
}



function loadImageInPlaceBox(src) {
    const el = document.querySelector('.expand-box .mdc-card__media');
    if (el) {
        el.style.backgroundImage = `url("${src}")`
    }
}

function clearPlaceCustomControl() {
    if (map.controls[google.maps.ControlPosition.BOTTOM_CENTER].length) {
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].clear();
    }
}


function showPlaceBox(userGeopoint) {
    console.log(placeResult)
    clearPlaceCustomControl()
    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, placeResult);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
    placeSearchField.input_.blur()
    centerControlDiv.addEventListener('click', function () {
        history.pushState(['expandPlaceBox'], null, null);
        expandPlaceBox(userGeopoint);

    })
    swipe(centerControlDiv, function (swipeEvent) {
        console.log(swipeEvent)
        if (swipeEvent.direction === 'up') {
            history.pushState(['expandPlaceBox'], null, null);
            expandPlaceBox(userGeopoint);
            removeSwipe()
        }
    });
}

function searchPlaceResultList(primaryText, secondaryText, icon) {
    const li = createElement('li', {
        className: 'mdc-list-item'
    });
    li.innerHTML = `<span class='mdc-list-item__graphic material-icons'>${icon ? icon :'location_on'}</span>
      <span class='mdc-list-item__text'>
          <span class='mdc-list-item__primary-text'>${primaryText}</span>
          <span class='mdc-list-item__secondary-text'>${secondaryText}</span>
      </span>`
    return li;

}

function clearPlaceMarkers() {
    searchPlaceMarkers.forEach(function (oldMarker) {
        oldMarker.setMap(null);
    });
    searchPlaceMarkers = [];
}

function createPlaceMarker(infowindow) {
    clearPlaceMarkers()
    var marker = new google.maps.Marker({
        map: map,
        position: placeResult.geometry.location
    });

    map.setCenter(new google.maps.LatLng(placeResult.geometry.location.lat(), placeResult.geometry.location.lng()))
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(placeResult.name);
        infowindow.open(map, this);
    });
    searchPlaceMarkers.push(marker);
}


function sendOfficeData(requestBody) {
    const myNumber = firebase.auth().currentUser.phoneNumber
    getLocation().then(function (geopoint) {
        requestBody.geopoint = geopoint
        http('POST', `${appKeys.getBaseUrl()}/api/services/office`, requestBody).then(function () {
            const fc = requestBody['firstContact'].phoneNumber;
            const sc = requestBody['secondContact'].phoneNumber;
            if(fc === myNumber || sc === myNumber) {
                window.location.reload();
                return;
            }
            try {
                document.getElementById('home-login').innerHTML = `<h3 class='mdc-typography--headline4 mdc-theme--primary'>${requestBody.name} Created</p>`;

            }catch(e){

            }
        }).catch(function(error){
            showSnacksApiResponse(error.message);
        })
    }).catch(handleLocationError);
}

function sendUsersData(formData) {
    getLocation().then(function (geopoint) {
        requestCreator('checkIns', formData, geopoint).then(function (response) {}).catch(console.error);
    }).catch(handleLocationError);
}

function sendSubscriptionData(formData) {
    getLocation().then(function (geopoint) {
        formData.geopoint = geopoint
        http('POST', `${appKeys.getBaseUrl()}/api/services/subscription`, formData).then(function (response) {
            window.location.reload(true)
        }).catch(console.error)
    }).catch(handleLocationError);
}