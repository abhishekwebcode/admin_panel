const init = (office, officeId) => {

    const form = document.getElementById('manage-form');
    const auth = firebase.auth().currentUser;
    const nameField = new mdc.textField.MDCTextField(document.getElementById('account-name'));
    const emailField = new mdc.textField.MDCTextField(document.getElementById('account-email'));
    const imageField = document.querySelector('.account-photo');
    const imageUpload = document.getElementById('image-upload');
    const submitBtn = form.querySelector('.form-submit[type="submit"]')

    let base64Image = auth.photoURL;

    nameField.value = auth.displayName;
    emailField.value = auth.email;
    if (auth.photoURL) {
        imageField.style.backgroundImage = `url("${auth.photoURL}")`
    };
    imageUpload.addEventListener('change', (ev) => {
        getImageBase64(ev).then(base64 => {
            base64Image = base64;
            imageField.style.backgroundImage = `url("${base64}")`;

        })
    })



    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        submitBtn.classList.add('active');
        let imageProm;
        if (auth.photoURL !== base64Image) {
            imageProm = http('POST', `${appKeys.getBaseUrl()}/api/services/images`, {
                imageBase64: base64Image
            })
        } else {
            imageProm = Promise.resolve();
        }
        imageProm.then(() => {
            return handleAuthUpdate({
                displayName: nameField.value,
                email: emailField.value
            })
        }).then(() => {
            auth.reload();
            // handleFormButtonSubmitSuccess(submitBtn, 'Account updated')
        }).catch(err => {
            submitBtn.classList.remove('active')
            const message = getEmailErrorMessage(err);
            if (message) {
                setHelperInvalid(emailField, message);
                return
            }
            handleFormButtonSubmit(submitBtn, message);
        })
    });


    const renewNow = document.getElementById('renew-now');
    const changePlan = document.getElementById('change-plan');

    getOfficeActivity(officeId).then(activity => {
        const endTime = activity.schedule[0].endTime;
        console.log("end Time",new Date(endTime))
        console.log("start Time",new Date(activity.schedule[0].startTime))

        // console.log(moment.duration(moment(endTime).diff(moment(),'months',true),'months'))
        document.getElementById('start-date').textContent = moment(activity.schedule[0].startTime).format('DD MMM YYYY')
        document.getElementById('end-date').textContent = moment(endTime).format('DD MMM YYYY')
        document.getElementById('days-left').textContent = getMemberShipEnd(endTime);
        document.getElementById('status').innerHTML = isOfficeActive(activity) ? "<span class='mdc-theme--success inline-flex'><i class='material-icons mr-10'>check_circle</i> Active</span>" : "<span class='mdc-theme--error inline-flex'><i class='material-icons mr-10'>cancel</i> Inactive</span>"
        const tableBody = document.getElementById('payments-table-body')
        const progressBar = document.getElementById('data-table-progress-bar').MDCLinearProgress;
    
        progressBar.open();
        getMemberShipDetails(officeId).then(response => {
            console.log(response)
            // clearError();
            const subscriptions = response.results;
            if (!subscriptions.length) {
                tableBody.innerHTML = "<span class='mdc-theme--error'>No pamynets found</span>"
                return
            };
    
            
            tableBody.appendChild(getRow(subscriptions))
            progressBar.close();
    
    
            const downgradeDialog = document.getElementById('downgrade-plan').MDCDialog
            const upgradeDialog = document.getElementById('upgrade-plan').MDCDialog
            const choosePlanDialog = document.getElementById('choose-plan').MDCDialog
    
            renewNow.addEventListener('click',()=>{
                if(subscriptions[0].attachment.Amount.value == 2999) {
                    const endTime = activity.schedule[0].endTime;
                    redirect(`/join.html?renew=1&office=${encodeURIComponent(office)}&plan=2999`)
                    return
                }
                upgradeDialog.open()
    
            })
            changePlan.addEventListener('click',()=>{
                if(subscriptions[0].attachment.Amount.value == 2999) {
                    downgradeDialog.open();
                    return
                }
                upgradeDialog.open()
            });
            [...document.querySelectorAll('.confirmation-button')].forEach(el=>{
                el.addEventListener('click',()=>{
                    downgradeDialog.close();
                    upgradeDialog.close();
                    choosePlanDialog.open()
                })
            });
            document.getElementById('pay-now').addEventListener('click',()=>{
                const endTime = activity.schedule[0].endTime;
                const plans = [2999,999];
                const ul = document.getElementById('choose-plan-list').MDCList;
                const amount = plans[ul.selectedIndex]
                redirect(`/join.html?renew=1&office=${encodeURIComponent(office)}&plan=${amount}`)
            });
        })    
    }).catch(err => {
        console.error(err)
        document.querySelector('#subscription-cont .details').innerHTML = `<p class='mdc-theme--error text-center mdc-typography--headline6'>Try again later</p>`
    })


}

const getMemberShipEnd = (endTime,startTime) => {
    console.log( moment.preciseDiff(endTime,startTime))
    const diff =  moment.preciseDiff(endTime,startTime,true);
    return `${diff.years ? `${diff.years} years` :''} ${diff.months ? `${diff.months} months` :''} ${diff.days ? `${diff.days} days` :''} ${diff.hours ? `${diff.hours} hours` : ''} ${diff.minutes ? `${diff.minutes} minutes` : ''}`;


}

const isOfficeActive = (activity) => {
    const currentTs = Date.now();
    return activity.status === "CONFIRMED" && currentTs >= activity.schedule[0].startTime && currentTs <= activity.schedule[0].endTime
}


const getMemberShipDetails = (officeId, limit, start) => {
    return new Promise((resolve, reject) => {
        http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/payment?type=membership${start ? `&start=${start}` :''}${limit ? `&limit=${limit}` :''}`)
            .then(resolve).catch(reject)
    })
}

const getRow = (subscriptions) => {
    const frag = document.createDocumentFragment();

    subscriptions.forEach(subscription => {
        if(subscription.attachment.Amount.value == 0) return;
        const logs = getPaymentLog(subscription.attachment.Logs.value)
        console.log(logs);
        const tr = createElement('tr', {
            className: 'mdc-data-table__row'
        })
        const date = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            textContent:subscription.attachment['Payment Initiation Date'].value
        });
        const duration = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            textContent:getMemberShipEnd(subscription.schedule[0].endTime,subscription.schedule[0].startTime)
        });

        const method = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            textContent: logs['paymentMode'] || '-'
        }); 
        
        const creator = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            textContent:subscription.creator.displayName
        }); 
        const amount = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            textContent:subscription.attachment.Amount.value ? formatMoney(String(subscription.attachment.Amount.value)) : 0
        }); 
        
        const status = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            innerHTML:logs.txStatus ? "<span class='mdc-theme--success inline-flex'><i class='material-icons mr-10'>check_circle</i> Success</span>" : "<span class='mdc-theme--error inline-flex'><i class='material-icons mr-10'>cancel</i> Failed</span>"
        }); 

        const receipt = createElement('th', {
            className: 'mdc-data-table__cell',
            attrs: {
                scope: "row"
            },
            textContent: ''
        }); 

        tr.appendChild(date)
        tr.appendChild(duration)
        tr.appendChild(method)
        tr.appendChild(creator)
        tr.appendChild(amount)
        tr.appendChild(status)
        tr.appendChild(receipt)
        frag.appendChild(tr)
    })
    return frag;
}
const handleSubscriptionError = (error) => {
    document.getElementById('error').textContent = error.message;
}
const clearError = () => {
    document.getElementById('error').textContent = ''
}


const getPlanDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${moment([end.getFullYear(),end.getMonth(),end.getDate()]).diff(moment([start.getFullYear(),start.getMonth(),start.getDate()]),"months",true)} months`
}

const getPaymentLog = (logs) => {
    const log = JSON.parse(logs) || {}
    return log[Object.keys(log)[0]] || {}
}