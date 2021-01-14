const employeeName = document.getElementById('name');
const phonenumber = document.getElementById('phonenumber');
const designation = document.getElementById('designation');
const code = document.getElementById('code');

const supervisorInput = document.getElementById('supervisor');
const supervisorChipSetEl = document.getElementById('supervisor-chipset');
const supervisorMenu = document.getElementById('supervisor-menu');

const form = document.getElementById('manage-form');
const submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]')
const employeeStatusButton = document.getElementById('employee-status-btn');

let employeeActivity;
let branchSelect;

const init = (office, officeId) => {
    // check if we have activity id in url. 
    // if activity id is  found, then udpate the form else create
    const formId = getFormId();
    const canEdit = new URLSearchParams(window.location.search).get('canEdit') === "true"

    const requestParams = getFormRequestParams();



    const employeePhoneNumberMdc = new mdc.textField.MDCTextField(document.getElementById('phone-field-mdc'))
    const iti = phoneFieldInit(employeePhoneNumberMdc);
    branchSelect = new mdc.select.MDCSelect(document.getElementById('branch-select'))

    if (formId) {
        if (canEdit) {
            document.getElementById('form-heading').innerHTML = 'Update ' + new URLSearchParams(window.location.search).get('name')
        }
        else {
            submitBtn.remove();
            employeeName.setAttribute('disabled')
            // phonenumber.setAttribute('disabled')
            designation.setAttribute('disabled')
            code.setAttribute('disabled')
            supervisorInput.setAttribute('disabled')
            branchSelect.disabled = true
            employeePhoneNumberMdc.disabled = true
        }
        
        getActivity(formId).then(activity => {
            if (activity) {
                employeeActivity = activity
                updateEmployeeFields(officeId, activity)
            }
            http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/activity/${formId}/`).then(res => {
                employeeActivity = res
                putActivity(res).then((res) => {
                    updateEmployeeFields(officeId, res)
                });
            })
        })
    }




    userAdditionComponent({
        officeId,
        input: supervisorInput
    });
    supervisorInput.addEventListener('selected', (ev) => {
        const user = ev.detail.user;
        supervisorInput.value = user.employeeName || user.displayName || user.phoneNumber;
        supervisorInput.dataset.number = user.phoneNumber;
    })


    // const branchSelect = document.getElementById('branch-select').MDCSelect;
    let oldBranches = {}
    const newBranches = {}

    getTypeList({
        template: 'branch',
        officeId
    }, (branches) => {
        console.log('branches', branches)

        const ul = document.getElementById('branch-list');

        const oldBranchLength = Object.keys(oldBranches).length
        branches.forEach(branch => {
            newBranches[branch.name] = branch;
        })
        if (!oldBranchLength) {
            oldBranches = newBranches
        }
        removeOldBranches(oldBranches, newBranches);


        branches.forEach(branch => {
            if (!document.querySelector(`[data-value="${branch.name}"]`)) {
                const li = createElement('li', {
                    className: 'mdc-list-item'
                })

                li.dataset.value = branch.name
                li.innerHTML = `<span class="mdc-list-item__ripple"></span>
                    <span class="mdc-list-item__text">${branch.name}</span>`
                ul.appendChild(li)
            }
        })



    }, (error) => {
        console.error(error)
    })


    form.addEventListener('submit', (ev) => {

        ev.preventDefault();

        var error = iti.getValidationError();

        if (error !== 0) {
            const message = getPhoneFieldErrorMessage(error);
            setHelperInvalid(employeePhoneNumberMdc, message);
            return
        }
        if (!iti.isValidNumber()) {
            setHelperInvalid(employeePhoneNumberMdc, 'Invalid number. Please check again');
            return;
        };

        if (!branchSelect && !branchSelect.value) {
            alert('Select a branch')
            return
        }

        setHelperValid(employeePhoneNumberMdc);
        submitBtn.classList.add('active')

        const activityBody = createActivityBody();
        activityBody.setOffice(office)
        activityBody.setActivityId(formId);
        activityBody.setTemplate('employee');
        activityBody.setAttachment('Name', employeeName.value, 'string')
        activityBody.setAttachment('Phone Number', iti.getNumber(), 'phoneNumber')
        activityBody.setAttachment('Designation', designation.value, 'string')
        activityBody.setAttachment('Employee Code', code.value, 'string');
        activityBody.setAttachment('First Supervisor', supervisorInput.dataset.number, 'phoneNumber');
        activityBody.setAttachment('Base Location', branchSelect.value, 'branch');


        const requestBody = activityBody.get();
        getUser(officeId, firebase.auth().currentUser.phoneNumber).then(userRecord => {

            createEmployee(requestParams, requestBody, hasEmployeeSubscription(userRecord))
        })
    })
}

const removeOldBranches = (oldBranch, newBranch) => {
    Object.keys(oldBranch).forEach(key => {
        if (!newBranch[key]) {
            document.querySelector(`[data-value="${key}"]`).remove()
        }
    });
}

const hasEmployeeSubscription = (userRecord) => {
    if (!userRecord) return;
    if (userRecord.subscriptions.some(sub => sub.name === 'employee')) return true;
    if (userRecord.subscriptions.filter(sub => sub.name === "subscription" || sub.name === "employee").length >= 2) return true;
    if (userRecord.subscriptions.some(sub => sub.name === 'subscription')) return false

}

const createEmployee = (requestParams, requestBody, hasEmployeeSubscription, count = 0) => {

    let employeeSubscriptionPromise = Promise.resolve()

    if (!hasEmployeeSubscription) {
        employeeSubscriptionPromise = createSubscription(requestBody.office, 'employee');
    };

    employeeSubscriptionPromise.then((subResponse) => {
            if (!subResponse) return http(requestParams.method, requestParams.url, requestBody)
            return delay(3000, http(requestParams.method, requestParams.url, requestBody));
        }).then(res => {
            let message = 'New employee added';
            if (requestParams.method === 'PUT') {
                message = 'Employee updated';
                putActivity(requestBody).then(function () {
                    handleFormButtonSubmitSuccess(submitBtn, message);
                })
                return
            };
            handleFormButtonSubmitSuccess(submitBtn, message);
        })
        .catch(err => {
            if (err.message === `employee '${requestBody.attachment.Name.value}' already exists`) {
                setHelperInvalid(new mdc.textField.MDCTextField(document.getElementById('name-field-mdc')), err.message);
                handleFormButtonSubmit(submitBtn);
                return
            }
            if (err.message === `No subscription found for the template: 'employee' with the office '${requestBody.office}'`) {
                if (count == 2) {
                    handleFormButtonSubmit(submitBtn, 'Try again later');
                    return
                }
                count++
                createEmployee(requestParams, requestBody, true, count)
                return
            }
            handleFormButtonSubmit(submitBtn, err.message)
        })
}


const delay = (time, value) => {
    return new Promise(resolve => {
        setTimeout(resolve, time, value)
    })
}

const updateEmployeeFields = (officeId, activity) => {
    if (activity.employeeStatus === 'CANCELLED') {
        redirect('/admin/employees/');
        return;
    };

    const empName = activity.attachment['Name'].value || ''
    employeeName.value = empName;
    phonenumber.value = activity.attachment['Phone Number'].value;
    designation.value = activity.attachment['Designation'].value;
    code.value = activity.attachment['Employee Code'].value;
    const supervisorNumber = activity.attachment['First Supervisor'].value;
    supervisorInput.value = supervisorNumber || '';
    supervisorInput.dataset.number = supervisorNumber;
    if (activity.assignees) {
        activity.assignees.forEach(assignee => {
            const chip = createUserChip(assignee);
            if (document.querySelector(`.mdc-chip[data-number="${assignee.phoneNumber}"]`)) {
                document.querySelector(`.mdc-chip[data-number="${assignee.phoneNumber}"]`).remove()
            }
            if (assignee.phoneNumber === supervisorNumber) {
                supervisorInput.value = assignee.displayName
            }
        })
    }

    branchSelect.value = activity.attachment.Branch.value

    const employeeText = document.getElementById('employee-text')
    employeeText.textContent = `${activity.attachment.Name.value} is a registered employee`
    employeeStatusButton.querySelector('.mdc-button__label').textContent = `Remove ${empName.split(" ")[0]}`
    employeeStatusButton.removeEventListener('click', statusChange, true);
    employeeStatusButton.addEventListener('click', statusChange, true);
    const selfNumber = firebase.auth().currentUser.phoneNumber;
    const employeeNumber = activity.attachment['Phone Number'].value;

    // if employeee is self don't show employee status container
    if (employeeNumber === selfNumber) return;

    getActivity(officeId).then(officeActivity => {
        // if employee is owner of the office don't show
        if (employeeNumber === officeActivity.attachment['First Contact'].value) return;

        let isUserOwner = false
        if (selfNumber === officeActivity.attachment['First Contact'].value) {
            isUserOwner = true
        }
        //if user is owner of office then show
        if (isUserOwner) {
            document.querySelector('.employee-status').classList.remove('hidden');
            return;
        }

        getUser(officeId, employeeNumber).then(rec => {
            if (!rec) return
            //if employee is another admin don't show
            if (rec.adminId) return;

            // employee is neither admin nor owner
            document.querySelector('.employee-status').classList.remove('hidden');
        })
    })
}


/**
 * 
 * @param {string} phonenumber 
 * @returns {object} e.target.result
 */
const getUser = (officeId, phonenumber) => {
    return new Promise((resolve, reject) => {
        window.database.transaction('users').objectStore('users').get(phonenumber).onsuccess = function (e) {
            const record = e.target.result;
            if (record) return resolve(record)
            getUsersDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/user?phoneNumber=${encodeURIComponent(phonenumber)}`).then(response => {
                resolve(response.results[0]);
            }).catch(reject)
        }
    })
}



const statusChange = () => {
    const removeDialog = new mdc.dialog.MDCDialog(document.getElementById('remove-employee-confirm-dialog'))
    removeDialog.content_.textContent = `Are you sure you want to remove ${employeeActivity.attachment.Name.value || employeeActivity.attachment['Phone Number'].value} as an employee ?
     If you change your mind you will have to add them again manually.`
    removeDialog.open()
    removeDialog.listen('MDCDialog:closed', (ev) => {
        if (ev.detail.action !== "accept") {
            return
        }
        submitBtn.classList.add('active')
        employeeStatusButton.classList.add('in-progress')

        userStatusChange(employeeActivity).then(() => {
            handleFormButtonSubmitSuccess(submitBtn, 'User removed');
        }).catch((err) => {
            showSnacksApiResponse('There was a problem changing employee status')
            submitBtn.classList.remove('active')
        })
    })
}