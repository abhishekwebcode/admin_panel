const formHeading = document.getElementById('form-heading');
const ul = document.getElementById('checkins-list');
const trackLocation = document.getElementById('track-live-location');
const editIcon = document.getElementById('edit-employee')
const init = (office, officeId) => {

    const user = JSON.parse(localStorage.getItem('selected_user'));
    if (!isUserActive(user)) {
        redirect('/admin/employees/');
        return;
    }

    if (!user.phoneNumber) {
        window.alert("No user found");
        return
    }

    formHeading.textContent = user.employeeName || user.displayName || user.phoneNumber;

    if (!user.employeeId) {
        editIcon.querySelector('.mdc-button__icon').textContent = 'delete';
        editIcon.querySelector('.mdc-button__label').textContent = 'Remove';
        ul.innerHTML = emptyCard('No checkins found').outerHTML;
        editIcon.classList.remove('hidden');
        editIcon.addEventListener('click',()=>{
            const removeDialog = new mdc.dialog.MDCDialog(document.getElementById('remove-employee-confirm-dialog'))
            removeDialog.content_.textContent = `Are you sure you want to remove ${user.displayName || user.phoneNumber} as a user ?
             If you change your mind you will have to add them again manually.`
            removeDialog.open()
            removeDialog.listen('MDCDialog:closed', (ev) => {
                if (ev.detail.action !== "accept") {
                    return
                }
                editIcon.classList.add('in-progress');

                userStatusChange({office,attachment:{
                    'Phone Number':{
                        type:'phoneNumber',
                        value:user.phoneNumber
                    }
                }}).then(()=>{
                   showSnacksApiResponse('User removed');
                   setTimeout(()=>{
                       window.history.back();
                   },3000)
                }).catch(err=>{
                    console.error(err)
                    showSnacksApiResponse('There was a problem changing employee status')
                })
            })
        })
        return
    }

    editIcon.href = `./manage.html?id=${user.employeeId}&name=${user.employeeName || user.displayName || user.phoneNumber}&canEdit=${user.canEdit}`
    editIcon.classList.remove('hidden');

    window.database
        .transaction("users")
        .objectStore("users")
        .get(user.phoneNumber)
        .onsuccess = function (event) {
            const record = event.target.result;
            const checkins = record.checkins || [];
            // sort checkins by timestamp in descinding order
            const sorted = checkins.sort((a, b) => b.timestamp - a.timestamp)
            updateCheckinList(sorted)


            http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/user?phoneNumber=${encodeURIComponent(user.phoneNumber)}`).then(res => {
                window
                    .database
                    .transaction("users", 'readwrite')
                    .objectStore("users").put(res.results[0]);
                const userCheckins = res.results[0].checkins || [];

                updateCheckinList(userCheckins.sort((a, b) => b.timestamp - a.timestamp))

            })
        }
}



const updateCheckinList = (checkins) => {
    if (!checkins.length) {
        ul.innerHTML = emptyCard('No checkins found').outerHTML;
        return
    }
    document.querySelector('.track-flex').classList.remove('hidden')
    const length = checkins.length;
    const origin = checkins[0].location;
    const destination = checkins[length - 1].location;
    let googleWayPointsUrl = new URLSearchParams(`?api=1&origin=${origin}&destination=${destination}&`)
    ul.innerHTML = ''
    checkins.forEach((checkin, index) => {
        ul.appendChild(checkinLi(checkin));
        ul.appendChild(createElement('li', {
            className: 'mdc-list-divider'
        }))
        if (index && index != length - 1) {
            googleWayPointsUrl.append('waypooints', checkin.location + encodeURIComponent('|'))

        }
    });
    trackLocation.href = `https://www.google.com/maps/dir/?${googleWayPointsUrl.toString()}`;

}

const checkinLi = (checkin) => {

    const a = createElement('a', {
        className: 'mdc-list-item checkin-list',
        href: `https://www.google.com/maps/search/?api=1&query=${checkin.location}`,
        target: '_blank'
    });
    a.innerHTML = `<span class="mdc-list-item__ripple"></span>
    <span class="mdc-list-item__text">
      <a class="mdc-list-item__primary-text" href="${checkin.photoURL ? checkin.photoURL : `https://www.google.com/maps/search/?api=1&query=${checkin.location}`}" target="_blank" >${checkin.photoURL ? 'Uploaded photo' : 'Checked-in'}</a>
      <span class="mdc-list-item__secondary-text">${checkin.location}</span>
    </span>
    <span class='mdc-list-item__meta list-time'>${formatCreatedTime(checkin.timestamp)}</span>`

    new mdc.ripple.MDCRipple(a);
    return a;
}