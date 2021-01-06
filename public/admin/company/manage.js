const heading  = document.getElementById('form-heading');
const companyName = document.getElementById('company-name');
const yearInput = document.getElementById('year-of-estd');
const address = document.getElementById('address');
const description  = document.getElementById('description');
const pincode = document.getElementById('pincode');
const form = document.getElementById('manage-form');
const logoCont = document.getElementById('company-logo');
const uploadLogo = document.getElementById('upload-logo');
const imageErrorEl = document.getElementById('image-upload-error')
const removeLogo = document.getElementById('remove-logo');
const submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]')

const init = (office,officeId) => {
    const tx = window.database.transaction("activities");
    const store = tx.objectStore("activities");
    store.get(officeId).onsuccess = function(evt) {
        const record = evt.target.result;
        if(!record) return;
        updateForm(record)
    }
};

const updateForm = (record) => {
    heading.textContent = `Manage ${record.office}`;
    companyName.value = record.office
    yearInput.value = record.attachment['Year Of Establishment'].value;
    address.value = record.attachment['Registered Office Address'].value;
    description.value = record.attachment['Description'].value;
    pincode.value = record.attachment['Pincode'].value;
    const category = new mdc.select.MDCSelect(document.getElementById('category-select'));
    category.value = record.attachment['Category'].value;
    
    if(record.attachment['Company Logo'].value) {
        logoCont.style.backgroundImage = `url("${record.attachment['Company Logo'].value}")`;
        logoCont.classList.remove('hidden');
    }
    
    uploadLogo.addEventListener('change',(ev)=>{
        getImageBase64(ev,0.5,).then(base64 => {
            imageErrorEl.innerHTML = ''
            logoCont.classList.remove('hidden');
            logoCont.style.backgroundImage = `url("${base64}")`;
            removeLogo.addEventListener('click',()=>{
                uploadLogo.value = '';
                logoCont.style.backgroundImage = '';
                logoCont.classList.add('hidden');
            })
        }).catch(imageUploadErr=>{
            switch (imageUploadErr.message) {
                case 'file-size-too-large':
                    imageErrorEl.textContent = 'Image size should be less than 10MB'
                    break
                case 'file-not-exist':
                    imageErrorEl.textContent = 'File does not exist'
                    break
                default:
                    imageErrorEl.textContent = error.message
            }
        })
    })


    form.addEventListener('submit',(ev)=>{
        ev.preventDefault();
        submitBtn.classList.add('active')

        const clone = JSON.parse(JSON.stringify(record))
        clone.attachment['Year Of Establishment'].value = yearInput.value;
        clone.attachment['Registered Office Address'].value = address.value;
        clone.attachment['Description'].value = description.value;
        clone.attachment['Category'].value = category.value;
        clone.attachment['Company Logo'].value = logoCont.style.backgroundImage.substring(5, logoCont.style.backgroundImage.length -2);
        clone.geopoint = {
            latitude:0,
            longitude:0
        };
        isValidPincode(pincode.value).then(isValid=>{
            if(!isValid) {
                const pincodeMDC = new mdc.textField.MDCTextField(document.getElementById('pincode-mdc'));
                setHelperInvalid(pincodeMDC,'Enter a valid pincode')
                submitBtn.classList.remove('active')
                return
            }
            clone.attachment['Pincode'].value = pincode.value;
            http('PUT',`${appKeys.getBaseUrl()}/api/activities/update`,clone).then(res=>{
                const tx = window.database.transaction("activities",'readwrite');
                const store = tx.objectStore("activities");
                delete clone.geopoint
                store.put(clone);
                tx.oncomplete = function(){
                    handleFormButtonSubmitSuccess(submitBtn,'Company info updated');
                }
            }).catch(err=>{
                handleFormButtonSubmit(submitBtn,err.message);
            })
        })
        return
    })
}

