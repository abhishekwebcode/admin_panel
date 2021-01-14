const getUserList = (props, onSuccess, onError) => {
    const limit = props.query_limit_size;
    const start = props.start;
    const officeId = props.officeId
    let count = 0;
    const records = []
    let advanced = false
    const tx = window.database.transaction("users");
    tx.objectStore("users")
        .index('timestamp')
        .openCursor(null, 'prev')
        .onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if(officeId !== cursor.value.officeId) {
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
                    users: records,
                    totalCheckedinUsers: e.target.result.totalCheckedinUsers,
                    totalSize: e.target.result.totalUsersSize,
                    fresh: false
                })
            }
        }
        getUsersDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/user?limit=${limit}&start=${start}`).then(response => {
            onSuccess({
                users: response.results,
                totalCheckedinUsers: response.totalCheckedinUsers,
                totalSize: response.size,
                fresh: true
            })
        }).catch(console.error)
    }
}

const getUsersDetails = (url) => {
    return new Promise((resolve, reject) => {


        http('GET', url).then(response => {

            const tx = window.database
                .transaction(["users", "meta"], "readwrite");
            for (let index = 0; index < response.results.length; index++) {
                const result = response.results[index];
                result['search_key'] = result.displayName ? result.displayName.toLowerCase() : null;

                const usersStore = tx.objectStore("users")
                usersStore.put(result)
            }
            const metaStore = tx.objectStore("meta");
            metaStore.get("meta").onsuccess = function (e) {
                const metaData = e.target.result;
                metaData.totalUsersSize = response.size;
                metaData.totalCheckedinUsers = response.totalCheckedinUsers
                metaStore.put(metaData);
            }
            tx.oncomplete = function () {
                resolve(response);
            }
        }).catch(reject);
    })
}




const userAdditionComponent = (props) => {
    const {officeId,input} = props;
    const anchor = input.parentNode.nextElementSibling;
    const menuEl = anchor.children[0];
    const menu = new mdc.menu.MDCMenu(menuEl);
    const chipSetEl = anchor.nextElementSibling;
    let chipSet;
    if(chipSetEl) {
         chipSet = new mdc.chips.MDCChipSet(chipSetEl);

    }

    initializeSearch(input, (value) => {
        if (!value) return;
        let query;
        if (Number(value)) {
            query = 'phoneNumber=' + encodeURIComponent(value)
        } else {
            query = 'employeeName=' + encodeURIComponent(value)
        }

        getUsersDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/user?${query}&limit=5`).then(res => {
            menu.list_.root.innerHTML = ''
            const filteredResults = res.results.filter(user => menu.list_.root.querySelector(`.mdc-chip[data-number="${user.phoneNumber}"]`) ? null : user)
            filteredResults.forEach(user => {
                const li = userMenuLi(user);
                li.dataset.user = JSON.stringify(user);
                menu.list_.root.appendChild(li);
            });
            if (filteredResults.length > 0) {
                // open menu and trasition to increase container height;
                menu.open = true
                anchor.style.height = ((filteredResults.length * 56)+16)+'px'
            }
        })
    }, 500);

    /** listens for menu selection event and sends a custom event to handle dataset
     * on search input and appends a chip to the chip set 
     */
    menu.listen('MDCMenu:selected', function (menuEv) {
        const user = JSON.parse(menuEv.detail.item.dataset.user);
        input.dispatchEvent(new CustomEvent('selected', {
            detail: {
                index: menuEv.detail.index,
                item: menuEv.detail.item,
                user,
            },
        }))
        // menu.open = false;
        if(!chipSet) return;
    
        const chip = createUserChip(user)
        chipSetEl.appendChild(chip);
        chipSet.addChip(chip);
    });
    //set heigh to auto when menu is closed
    menu.listen('MDCMenuSurface:closed',(ev)=>{
        anchor.style.height = 'auto'
    })
    /** listens for chip removal event and sends a custom event to handle dataset
     *  on search input
     */
    if(!chipSet) return
    chipSet.listen('MDCChip:trailingIconInteraction', (ev) => {
        const el  = document.getElementById(ev.detail.chipId);
        input.dispatchEvent(new CustomEvent('removed', {
            detail: {
                user:{
                    employeeName : el.dataset.name,
                    phoneNumber : el.dataset.number
                }
            },
        }))
     
    })
}

const userMenuLi = (user) => {
    const li = createElement('li', {
        className: 'mdc-list-item',
        attrs: {
            role: 'menuitem'
        }
    })

    const img = createElement('img', {
        className: 'mdc-list-item__graphic',
        src: user.photoURL
    })
    const span = createElement('span', {
        textContent: user.employeeName || user.displayName || user.phoneNumber,
        className: 'mdc-list-item__text'
    })
    li.appendChild(img)
    li.appendChild(span)
    new mdc.ripple.MDCRipple(li);
    return li
}

const createUserChip = (user,isNonEditable) => {
    const chip = createElement('div', {
        className: 'mdc-chip',
        attrs: {
            role: 'row'
        },
    })
    
    chip.dataset.number = user.phoneNumber;
    chip.dataset.name = user.employeeName || user.displayName

    chip.innerHTML = `<div class="mdc-chip__ripple"></div>
    <img class="mdc-chip__icon mdc-chip__icon--leading" src="${user.photoURL || '../../img/person.png'}">
    <span role="gridcell">
      <span role="button" tabindex="0" class="mdc-chip__primary-action">
        <span class="mdc-chip__text">${user.employeeName  || user.displayName ||  user.phoneNumber}</span>
      </span>
    </span>
    ${isNonEditable ? '' :`<span role="gridcell">
    <i class="material-icons mdc-chip-trailing-action mdc-chip__icon mdc-chip__icon--trailing" tabindex="-1" role="button">cancel</i>
  </span>`} 
   
    `
    return chip;
}

const updateUsersList = (users, start, fresh) => {
    let freshCount = start;
    const ul = document.getElementById('employees-list');
    users.forEach(user => {
        if (ul.querySelector(`[data-number="${user.phoneNumber}"]`)) {
            ul.querySelector(`[data-number="${user.phoneNumber}"]`).remove();
        }
        const li = createUserli(user);
        if (!fresh) {
            ul.appendChild(li);
        } else {
            ul.insertBefore(li, ul.children[freshCount])
            freshCount++
        }
    })
}

const createUserli = (user) => {

    const li = createElement('li', {
        className: 'mdc-list-item user-list',

    });
    const activeUser = isUserActive(user);

    li.dataset.number = user.phoneNumber
    if (user.latestCheckIn.location) {
        li.classList.add('user-list--location')
    }
    if(!activeUser) {
        li.classList.add('user-list--cancelled');
    }


    li.innerHTML = `<span class="mdc-list-item__ripple"></span>
    <img class='mdc-list-item__graphic' src="${user.photoURL || '../../img/person.png'}">
    <span class="mdc-list-item__text">
      <span class="mdc-list-item__primary-text">${user.employeeName ||  user.displayName || user.phoneNumber}</span>
      ${user.latestCheckIn.location ? ` <span class="mdc-list-item__secondary-text">${user.latestCheckIn.location}</span>` :''}
      ${!activeUser ? "<span class='status mdc-list-item__secondary-text'><span class='dot'></span>Removed</span>":''}
    </span>
    <span class='mdc-list-item__meta list-time'>${formatCreatedTime(user.latestCheckIn.timestamp)}</span>`

    new mdc.ripple.MDCRipple(li);
    /** temporary use case until query by employee id is possible */
    li.addEventListener('click', (ev) => {
        if(!activeUser) return;
        localStorage.setItem('selected_user', JSON.stringify(user));
        redirect(`/admin/employees/checkins.html?employeeId=${user.employeeId}`);
    })
    return li;
}
