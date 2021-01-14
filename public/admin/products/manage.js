const productName = document.getElementById('name');
const brand = document.getElementById('brand');
const price = document.getElementById('price');
const description = document.getElementById('description');
const form = document.getElementById('manage-form');
const submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]')

const init = (office, officeId) => {
    // check if we have activity id in url. 
    // if activity id is  found, then udpate the form else create
    const formId = getFormId();
    const requestParams = getFormRequestParams();
    const canEdit = new URLSearchParams(window.location.search).get('canEdit') === "true"


    

    if (formId) {
        if(canEdit) {
            document.getElementById('form-heading').innerHTML = 'Update ' + new URLSearchParams(window.location.search).get('name')
        }
        else {
            submitBtn.remove();
            productName.setAttribute('disabled','true')
            brand.setAttribute('disabled','true')
            price.setAttribute('disabled','true')
            description.setAttribute('disabled','true')
        }

        getActivity(formId).then(activity => {
            if (activity) {
                updateProductFields(activity)
            }
            http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/activity/${formId}/`).then(res => {
                putActivity(res).then(updateProductFields);
            })
        })
    }


    form.addEventListener('submit', (ev) => {
        submitBtn.classList.add('active')
        ev.preventDefault();

        const activityBody = createActivityBody();
        activityBody.setOffice(office)
        activityBody.setActivityId(formId)
        activityBody.setTemplate('product')
        activityBody.setAttachment('Name',productName.value,'string')
        activityBody.setAttachment('Brand',brand.value,'string') 
        activityBody.setAttachment('Product Description',description.value,'string') 
        activityBody.setAttachment('Unit Value (excluding GST)',price.value,'string');
        
        const requestBody = activityBody.get();

        http(requestParams.method, requestParams.url, requestBody).then(res => {
            let message = 'New product added';
            if (requestParams.method === 'PUT') {
                message = 'Product updated'
                putActivity(requestBody).then(function () {
                    handleFormButtonSubmitSuccess(submitBtn,message);
                })
                return
            }
            handleFormButtonSubmitSuccess(submitBtn, message);
        }).catch(err => {
            if (err.message === `product '${requestBody.attachment.Name.value}' already exists`) {
                setHelperInvalid(new mdc.textField.MDCTextField(document.getElementById('name-field-mdc')), err.message);
                handleFormButtonSubmit(submitBtn);
                return
            }
            handleFormButtonSubmit(submitBtn, err.message)
        })
    })

}



const updateProductFields = (activity) => {
    productName.value = activity.attachment['Name'].value;
    brand.value = activity.attachment['Brand'].value;
    price.value = activity.attachment['Unit Value (excluding GST)'].value;
    description.value = activity.attachment['Product Description'].value;
}