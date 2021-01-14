const getLocationList = (props, onSuccess, onError) => {
    const limit = props.query_limit_size;
    const start = props.start;
    const officeId = props.officeId
    let count = 0;
    const records = []
    let advanced = false
    const tx = window.database.transaction("locations");
    tx.objectStore("locations")
        .index('timestamp')
        .openCursor(null, 'prev')
        .onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (officeId !== cursor.value.officeId) {
                cursor.continue();
                return;
            };
            if (count >= limit) return;
            if (advanced == false && start) {
                advanced = true;
                cursor.advance(start);
            } else {
                count++
                records.push(cursor.value)
                cursor.continue();
            }
        }
    tx.oncomplete = function () {
        if (records.length) {
            window.database.transaction("meta").objectStore("meta").get("meta").onsuccess = function (e) {
                onSuccess({
                    locations: records,
                    totalActiveLocations: e.target.result.totalActiveLocations,
                    totalSize: e.target.result.size,
                    fresh: false
                })
            }
        }
        getLocationsDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/location?limit=${limit}&start=${start}`).then(response => {
            onSuccess({
                locations: response.results,
                totalActiveLocations: response.totalActiveLocations,
                totalSize: response.size,
                fresh: true
            })
        }).catch(onError);
    }
}

const getLocationsDetails = (url) => {
    return new Promise((resolve, reject) => {

        http('GET', url).then(response => {
            const tx = window.database
                .transaction(["locations", "meta"], "readwrite");

            const locationsArray = response.results.filter(r => r.id && r.location);
            response.results = locationsArray;

            for (let index = 0; index < locationsArray.length; index++) {
                const result = locationsArray[index];
                result['search_key'] = result.location ? result.location.toLowerCase() : null;
                const locationStore = tx.objectStore("locations")
                locationStore.put(result)
            }
            const metaStore = tx.objectStore("meta");
            metaStore.get("meta").onsuccess = function (e) {
                const metaData = e.target.result;
                metaData.totalSize = response.size;
                metaData.totalActiveLocations = response.totalActiveLocations
                metaStore.put(metaData);
            }
            tx.oncomplete = function () {
                resolve(response)
            }
        }).catch(reject)
    })
}

const locationAdditionComponent = (props) => {
    const {
        officeId,
        input
    } = props;


    const anchor = input.parentNode.nextElementSibling;
    const menuEl = anchor.children[0];
    const menu = new mdc.menu.MDCMenu(menuEl);

    initializeSearch(input, (value) => {
        if (!value) return;
        getLocationsDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/location?location=${encodeURIComponent(value)}&limit=5`).then(res => {
            menu.list_.root.innerHTML = ''
            const filteredResults = res.results.filter(result => menu.list_.root.querySelector(`.mdc-chip[data-location="${result.location}"]`) ? null : result)
            filteredResults.forEach(result => {
                const li = locationMenuLi(result);
                li.dataset.location = result.location
                menu.list_.root.appendChild(li);
            });
            if (filteredResults.length > 0) {
                menu.open = true;
                anchor.style.height = ((filteredResults.length * 48) + 16) + 'px'
            }
        })
    }, 500);

    /** listens for menu selection event and sends a custom event to handle dataset
     * on search input and appends a chip to the chip set 
     */
    menu.listen('MDCMenu:selected', function (menuEv) {

        const locationName = menuEv.detail.item.dataset.location;
        input.dispatchEvent(new CustomEvent('selected', {
            detail: {
                index: menuEv.detail.index,
                item: menuEv.detail.item,
                locationName,
            },
        }))

    });

    //set heigh to auto when menu is closed
    menu.listen('MDCMenuSurface:closed', (ev) => {
        anchor.style.height = 'auto'
    })
}

const locationMenuLi = (locationObject) => {
    const li = createElement('li', {
        className: 'mdc-list-item',
        attrs: {
            role: 'menuitem'
        }
    })
    const span = createElement('span', {
        textContent: locationObject['location'],
        className: 'mdc-list-item__text'
    })
    li.appendChild(span)
    new mdc.ripple.MDCRipple(li);
    return li
}

// const createLocationChip = (locationName) => {
//     const chip = createElement('div', {
//         className: 'mdc-chip',
//         attrs: {
//             role: 'row'
//         },
//     })

//     chip.dataset.location = locationName

//     chip.innerHTML = `<div class="mdc-chip__ripple"></div>
//     <span role="gridcell">
//       <span role="button" tabindex="0" class="mdc-chip__primary-action">
//         <span class="mdc-chip__text">${locationName}</span>
//       </span>
//     </span>

//     <span role="gridcell">
//       <i class="material-icons mdc-chip-trailing-action mdc-chip__icon mdc-chip__icon--trailing" tabindex="-1" role="button">cancel</i>
//     </span>
//     `
//     return chip;
// }


const updateLocationList = (locations, start, fresh) => {
    let freshCount = start;
    const ul = document.getElementById('locations-list');
    locations.forEach(location => {
        if (ul.querySelector(`[data-id="${location.id}"]`)) {
            ul.querySelector(`[data-id="${location.id}"]`).remove();
        }
        const li = createLocationLi(location);
        if (!fresh) {
            ul.appendChild(li);
        } else {
            ul.insertBefore(li, ul.children[freshCount])
            freshCount++
        }
    })
    if (!locations.length) {
        ul.appendChild(emptyCard('No locations found'))
    }
}

const createLocationLi = (location) => {
    const li = createElement('a', {
        className: 'mdc-list-item user-list',
        href: location['location'] && location.id ?  `/admin/duties/index.html?id=${location.id}&canEdit=${location.canEdit}&location=${encodeURIComponent(location['location'])}` : '#'
    });
    li.dataset.id = location.id
    li.innerHTML = `<span class="mdc-list-item__ripple"></span>
    <span class="mdc-list-item__text">
      <span class="mdc-list-item__primary-text">${location['location']}</span>
      <span class="mdc-list-item__secondary-text">${location['address']}</span>
    </span>
    <span class='mdc-list-item__meta list-time'>${formatCreatedTime(location.timestamp)}</span>`
    new mdc.ripple.MDCRipple(li);
    return li;
}

