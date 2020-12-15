
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
            handleFormButtonSubmitSuccess(submitBtn, 'Account updated')
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
    getMemberShipDetails(officeId, 1, 0).then(response => {
        clearError();
        const subscriptions = response.results
        if (!subscriptions.length) {
            document.getElementById('details').innerHTML = '<span>No pamynets found</span>'
            return
        };
        handleSubscriptions(subscriptions,office)

        document.getElementById('show-previous').addEventListener('click', function(){
            clearError()
            getMemberShipDetails(officeId, response.size, 1).then(res => {
                this.remove()
                handleSubscriptions(res.results,office);
            }).catch(handleSubscriptionError);
        })
      
    }).catch(handleSubscriptionError)
}




const getMemberShipDetails = (officeId, limit, start) => {
    return new Promise((resolve, reject) => {
        http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/payment?type=membership${start ? `&start=${start}` :''}${limit ? `&limit=${limit}` :''}`)
            .then(resolve).catch(reject)
    })
}

const handleSubscriptions = (subscriptions,office) => {
    subscriptions.forEach(subscription => {
        document.getElementById('details').appendChild(createSubscriptionCard(subscription,office))
    })
}
const handleSubscriptionError = (error) => {
    document.getElementById('error').textContent = error.message;
}
const clearError = () => {
    document.getElementById('error').textContent = ''
}



const createSubscriptionCard = (subscription,office) => {

    const duration = subscription.attachment.Amount.value == 0 ? '3 Days' : getPlanDuration(subscription.schedule[0].startTime, subscription.schedule[0].endTime)
    const hasExpired = subscription.schedule[0].endTime < Date.now();
    const isActive =  Date.now() >= subscription.schedule[0].startTime && Date.now() <= subscription.schedule[0].endTime
    console.log(duration);
    const card = createElement('div', {
        className: 'subscription-card mdc-layout-grid__inner'
    });
    const paymentLog = getConfirmedPayment(subscription.attachment.Logs.value);
    
    card.innerHTML = `
            <div class='mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone'>
                <div class='plan inline-flex'>Plan: ${formatMoney(String(subscription.attachment.Amount.value))} / ${duration} ${isActive ? `<div class='inline-flex mdc-theme--primary ml-10 change-plan'>
                <a class="mdc-button" href="../join.html?#payment?office=${office}&extend=1">
                    <div class="mdc-button__ripple"></div>
                    <i class="material-icons mdc-button__icon" aria-hidden="true">change_circle</i>
                    <span class="mdc-button__label">Change plan</span>
                </a>
                </div>`:''}</div>
            </div>
            <div class='mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-4-phone'>
                <div class='expiry-end'>Your ${duration} subscription period ${hasExpired ? '' :' will'} ${hasExpired ? 'expired' :'expire'} on ${moment(subscription.schedule[0].endTime).format("DD MMM YYYY")}</div>
            </div>
            <div class='mdc-layout-grid__cell mdc-layout-grid__cell--align-middle'>
                Date : ${subscription.attachment['Payment Initiation Date'].value}
            </div>  
            <div class='mdc-layout-grid__cell mdc-layout-grid__cell--align-middle'>
                ${paymentLog ? `Mode of payment : ${paymentLog.paymentMode}`  : ''}
            </div>  
            <div class='mdc-layout-grid__cell mdc-layout-grid__cell--align-middle'>
               
            </div>  
        `
    return card;
}

{/* <button class="mdc-button download-report-btn">
<div class="mdc-button__ripple"></div>
<i class="material-icons mdc-button__icon" aria-hidden="true">download</i>
<div class='straight-loader'></div>
<span class="mdc-button__label">Download Receipt</span>
</button> */}

const getPlanDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${moment([end.getFullYear(),end.getMonth(),end.getDate()]).diff(moment([start.getFullYear(),start.getMonth(),start.getDate()]),"months",true)} months`
}

const getConfirmedPayment = (logs) => {
    const paymentLogs = JSON.parse(logs);
    const keys = Object.keys(paymentLogs);
    if (!keys.length) return null;


    const successKey = keys.filter(key => {
        return paymentLogs[key].txStatus === "SUCCESS"
    });
    return paymentLogs[successKey];
}