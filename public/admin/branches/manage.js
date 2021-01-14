const branchName = document.getElementById('name');
const primaryPhoneNumber = document.getElementById('primary-phonenumber');
const secondaryPhoneNumber = document.getElementById('secondary-phonenumber');
const address = document.getElementById('address');
let weeklyOff = document.getElementById('weekly-off');
const weekdayStartTime = document.getElementById('weekday-start-time')
const weekdayEndTime = document.getElementById('weekday-end-time')


const form = document.getElementById('manage-form');
const submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]')

const init = (office, officeId) => {
    // check if we have activity id in url. 
    // if activity id is  found, then udpate the form else create
    weeklyOff = weeklyOff.MDCSelect;
    const formId = getFormId();
    const requestParams = getFormRequestParams();
    // const canEdit = new URLSearchParams(window.location.search).get('canEdit') === "true"

    const primaryPhoneNumberMdc = new mdc.textField.MDCTextField(document.getElementById('phone-field-mdc-primary'))
    const secondaryPhoneNumberMdc = new mdc.textField.MDCTextField(document.getElementById('phone-field-mdc-secondary'))

    const primaryIti = phoneFieldInit(primaryPhoneNumberMdc);
    const secondaryIti = phoneFieldInit(secondaryPhoneNumberMdc);

    // make weekday end time file min value equal to start time value
    weekdayStartTime.addEventListener('change', (evt) => {
        weekdayEndTime.value = evt.target.value;
        weekdayEndTime.min = evt.target.value;
    });

    if (formId) {
        // if(canEdit) {
        //     document.getElementById('form-heading').innerHTML = 'Update ' + new URLSearchParams(window.location.search).get('name')
        // }
        // else {
        //     branchName.setAttribute('disabled','true')
        //     primaryPhoneNumber.setAttribute('disabled','true')
        //     secondaryPhoneNumber.setAttribute('disabled','true')
        //     address.setAttribute('disabled','true')
        //     weeklyOff.disabled = true
        //     weekdayStartTime.setAttribute('disabled','true')
        //     weekdayEndTime.setAttribute('disabled','true')
        //     submitBtn.remove()
        // }
        getActivity(formId).then(activity => {
            if (activity) {
                updateBranchFields(activity)
            }
            http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/activity/${formId}/`).then(res => {
                putActivity(res).then(updateBranchFields);
            })
        });

    }
    else {
        const hours = new Date().getHours();
        const minutes = new Date().getMinutes();
        weekdayStartTime.value = `${hours < 10 ? '0':''}${hours}:${minutes < 10 ? '0' :''}${minutes}`
    }
    weekdayStartTime.dispatchEvent(new Event('change', { 'bubbles': true }))




    form.addEventListener('submit', (ev) => {

        ev.preventDefault();
        const primaryContactValidation = validatePhonNumber(primaryIti)
        if (!primaryContactValidation.isValid) {
            setHelperInvalid(primaryPhoneNumberMdc, primaryContactValidation.message);
            return;
        }

        const secondaryContactValidation = validatePhonNumber(secondaryIti);
        if (secondaryPhoneNumberMdc.value && !secondaryContactValidation.isValid) {
            setHelperInvalid(secondaryPhoneNumberMdc, secondaryContactValidation.message);
            return;
        }

        setHelperValid(primaryPhoneNumberMdc);
        setHelperValid(secondaryPhoneNumberMdc);

        submitBtn.classList.add('active')

        const activityBody = createActivityBody();
        activityBody.setOffice(office)
        activityBody.setActivityId(formId)
        activityBody.setTemplate('branch')
        activityBody.setSchedule(Array.apply(null, Array(15)).map((x, y) => {
            return {
                'name': 'Holiday ' + (y + 1),
                'startTime': '',
                'endTime': ''
            }
        }))
        activityBody.setVenue([{
            location: address.value,
            address: address.value,
            venueDescriptor: 'Branch Office',
            geopoint: {
                latitude: 0,
                longitude: 0
            }
        }])
        activityBody.setAttachment('Name',branchName.value,'string');
        activityBody.setAttachment('First Contact',primaryIti.getNumber(),'phoneNumber');
        activityBody.setAttachment('Second Contact',secondaryIti.getNumber(),'phoneNumber');
        activityBody.setAttachment('Weekday Start Time',weekdayStartTime.value,'HH:MM')
        activityBody.setAttachment('Weekday End Time',weekdayEndTime.value,'HH:MM')
        activityBody.setAttachment('Weekly Off',weeklyOff.value,'weekday')
        const requestBody = activityBody.get();
   


        
        http(requestParams.method, requestParams.url, requestBody).then(res => {
            let message = 'New Branch added';
            if (requestParams.method === 'PUT') {
                message = 'Branch updated'
                putActivity(requestBody).then(function () {
                    handleFormButtonSubmitSuccess(submitBtn,message);
                })
                return
            }
            handleFormButtonSubmitSuccess(submitBtn, message);
        }).catch(err => {
            if (err.message === `branch '${requestBody.attachment.Name.value}' already exists`) {
                setHelperInvalid(new mdc.textField.MDCTextField(document.getElementById('name-field-mdc')), err.message);
                handleFormButtonSubmit(submitBtn);
                return
            }
            if (err.message === `No subscription found for the template: 'branch' with the office '${office}'`) {
                createSubscription(office, 'branch').then(() => {
                    form.dispatchEvent(new Event('submit',{
                        cancelable:true,
                        bubbles:true
                    }))
                })
                return
            }
            handleFormButtonSubmit(submitBtn, err.message)
        })
    })
}

const updateBranchFields = (activity) => {
    branchName.value = activity.attachment['Name'].value;
    primaryPhoneNumber.value = activity.attachment['First Contact'].value;
    secondaryPhoneNumber.value = activity.attachment['Second Contact'].value;
    weeklyOff.value = activity.attachment['Weekly Off'].value
    weekdayStartTime.value = activity.attachment['Weekday Start Time'].value
    weekdayEndTime.value = activity.attachment['Weekday End Time'].value
    address.value = activity.attachment.Address ? activity.attachment.Address.value : ''
}