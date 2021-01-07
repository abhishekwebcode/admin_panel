/** callback is used because activity returned by this function needs to update dom 2 times */
const getCompanyDetails = (officeId, onSuccess, onError) => {
    getActivity(officeId).then(record => {
        if (record) {
            onSuccess(record);
        };
        http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/activity/${officeId}/`).then(officeActivity => {
            putActivity(officeActivity).then(onSuccess);
        }).catch(onError)
    })
}


const getActivity = (activityId) => {
    return new Promise((resolve, reject) => {
        const tx = window.database.transaction("activities");
        const store = tx.objectStore("activities");
        store.get(activityId).onsuccess = function (e) {
            return resolve(e.target.result)
        }
    })
}


const putActivity = (activity) => {
    return new Promise((resolve, reject) => {
        const tx = window.database.transaction("activities", "readwrite");
        const store = tx.objectStore("activities");
        store.put(activity).onsuccess = function () {
            return resolve(activity)
        }
    })
}
const getOfficeActivity = (officeId) => {
    return new Promise((resolve, reject) => {
        getActivity(officeId).then(record => {
            
            // if()

            // if (record && officeHasMembership(record.schedule) && !isOfficeMembershipExpired(record.schedule)) {
            //     return resolve(record);
            // }
            
            http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/activity/${officeId}/`).then(officeActivity => {
                putActivity(officeActivity).then(resolve)
            }).catch(reject)
        })
    })
}

const handleProfileDetails = (officeId) => {
    getCompanyDetails(officeId, updateCompanyProfile, console.error)
}

const updateCompanyProfile = (activity) => {
    const companyLogo = document.getElementById('company-logo')
    const companyName = document.getElementById('company-name')
    const companyAddress = document.getElementById('company-address');

    const companyDescription = document.getElementById('company-description');
    const companyCategory = document.getElementById('company-category');
    if (activity.attachment['Company Logo'].value) {
        companyLogo.src = activity.attachment['Company Logo'].value;
    }
    companyName.textContent = activity.attachment['Name'].value;
    companyAddress.textContent = activity.attachment['Registered Office Address'] ? activity.attachment['Registered Office Address'].value : '';
    companyDescription.textContent = activity.attachment['Description'].value;
    companyCategory.textContent = activity.attachment['Category'] ? activity.attachment['Category'].value : '';


}



/**
 * format string to INR 
 * @param {string} money 
 * @returns {string} 
 */
const formatMoney = (money) => {
    const number = Number(money.split(',').join(''))
    return number.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
    })
}




const emptyCard = (text) => {
    const div = createElement('div', {
        className: 'mdc-card mdc-card--outlined  empty-card'
    })

    div.innerHTML = `<span class='text-cont'>
    <i class='material-icons'>info</i>
    ${text}
    </span>`
    return div;
}



const handleFormButtonSubmit = (button, text) => {
    button.classList.remove('active');
    if (text) {
        showSnacksApiResponse(text);
    }
}

const handleFormButtonSubmitSuccess = (button, text) => {
    handleFormButtonSubmit(button, text);
    setTimeout(() => {
        window.history.back();
    }, 1000)
}


const getFormId = () => {
    const search = new URLSearchParams(window.location.search);
    return search.get('id');
}


const getFormRequestParams = () => {
    const id = getFormId();
    return {
        method: id ? 'PUT' : 'POST',
        url: id ? `${appKeys.getBaseUrl()}/api/activities/update` : `${appKeys.getBaseUrl()}/api/activities/create`
    }
}


/** Debouncing utils */

let timerId = null;
const debounce = (func, delay, value) => {
    clearTimeout(timerId);
    timerId = setTimeout(function () {
        func(value);
    }, delay);
}

const initializeSearch = (input, callback, delay) => {
    input.addEventListener('input', (ev) => {
        const value = ev.currentTarget.value.trim().toLowerCase();
        debounce(callback, delay, value)
    })
}


const validatePhonNumber = (iti) => {
    var error = iti.getValidationError();
    const result = {
        message: '',
        isValid: false
    }
    if (error !== 0) {
        result.message = getPhoneFieldErrorMessage(error)
        return result
    }
    if (!iti.isValidNumber()) {
        result.message = 'Invalid number. Please check again';
        return result
    };
    result.isValid = true;
    return result;
}




const createSubscription = (office, subscriptionName) => {
    const requestBody = {
        attachment: {
            'Phone Number': {
                type: 'phoneNumber',
                value: firebase.auth().currentUser.phoneNumber
            },
            'Template': {
                type: 'string',
                value: subscriptionName
            }
        },
        office: office,
        share: [],
        venue: [],
        schedule: [],
        geopoint: {
            latitude: 0,
            longitude: 0
        },
        template: 'subscription'
    }
    return http('POST', `${appKeys.getBaseUrl()}/api/activities/create`, requestBody)
}

const formatCreatedTime = (timestamp) => {
    if (!timestamp) return ''
    return moment(timestamp).calendar(null, {
        sameDay: 'hh:mm A',
        lastDay: '[Yesterday]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastWeek: 'DD/MM/YY',
        sameElse: 'DD/MM/YY'
    })
}

const formatDutyTime = (timestamp) => {
    return moment(timestamp).calendar(null, {
        sameDay: 'hh:mm A',
        lastDay: '[Yesterday] hh:mm A',
        nextDay: '[Tomorrow] hh:mm A',
        nextWeek: 'dddd',
        lastWeek: 'DD/MM/YY',
        sameElse: 'DD/MM/YY'
    })
}



const createActivityBody = () => {
    const object = {
        attachment: {},
        venue: [],
        schedule: [],
        office: '',
        activityId: '',
        template: '',
        share: [],
        geopoint: {
            latitude: 0,
            longitude: 0
        }
    }
    return {
        setAttachment: (name, value, type) => {
            object.attachment[name] = {
                value,
                type
            }
        },

        setVenue: (venue) => {
            object.venue = venue
        },
        setSchedule: (schedule) => {
            object.schedule = schedule
        },
        setOffice: (office) => {
            object.office = office
        },
        setTemplate: (template) => {
            object.template = template
        },
        setActivityId: (activityId) => {
            object.activityId = activityId
        },
        setShare: (share) => {
            object.share = share
        },
        get: function () {
            return object;
        }
    }
}


const toggleFabList = (parentButton) => {
    parentButton.querySelector('.mdc-fab__icon').classList.toggle('is-active');
    if (document.getElementById('drawer-scrim')) {
        document.getElementById('drawer-scrim').classList.toggle('block')
    }
    document.querySelectorAll('.fabs .fab').forEach(el => {
        el.classList.toggle('is-visible');
    })
}

const appLoader = function() {
    return {
        show : () => {
            const div = createElement('div', {
                className: 'initializing-box mdc-elevation--z4'
            })
            div.innerHTML = ` <div class="straight-loader"></div>
        <p>Please wait...</p>`
            document.getElementById('app-loader').innerHTML = div.outerHTML;
            document.querySelector('.mdc-drawer-app-content').classList.add('initializing-db');
            document.querySelector('.mdc-drawer').classList.add('hidden')
        },
        remove : () => {
            document.getElementById('app-loader').innerHTML = ''
            document.querySelector('.mdc-drawer-app-content').classList.remove('initializing-db');
            document.querySelector('.mdc-drawer').classList.remove('hidden')

        }
    }
}();



const userStatusChange = (userActivity) => {
    return new Promise((resolve,reject)=>{
        http('POST', `${appKeys.getBaseUrl()}/api/services/changeUserStatus`, {
            phoneNumber: userActivity.attachment['Phone Number'].value,
            office: userActivity.office
        }).then(() => {
            if(!userActivity.activityId) return Promise.resolve();

            userActivity.status === 'CANCELLED';
            return putActivity(userActivity)
        }).then(() => {
            return updateUser(userActivity.attachment['Phone Number'].value, {
                employeeStatus: userActivity.activityId ? 'CANCELLED' : null
            })
        }).then(() => {
            localStorage.removeItem('selected_user');
            setTimeout(()=>{
                return resolve()
            },4000)
        })
        .catch(reject)
    })
}

const updateUser = (phonenumber, attr) => {
    return new Promise(resolve => {
        const tx = window.database.transaction('users', 'readwrite');
        const store = tx.objectStore('users')
        store.get(phonenumber).onsuccess = function (e) {
            const record = e.target.result;
            const updatedRec = Object.assign(record, attr);
            store.put(updatedRec).onsuccess = function () {
                resolve(true)
            }
        }
    })
}



const isUserActive = (user) => {
    if(!user) return;
    if(user.employeeStatus === 'CANCELLED') return;
    return !(
        !user.employeeId &&
        !user.adminId &&
        !user.subscriptions.length);

}
