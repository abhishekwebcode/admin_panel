const locationSearch = document.getElementById("location-search");
const employeeSearch = document.getElementById('employee-search')
const supervisorSearch = document.getElementById('supervisor-search')


const dutyStartDate = document.getElementById('duty-start-date')
const dutyEndDate = document.getElementById('duty-end-date')
const dutyStartTime = document.getElementById('duty-start-time')
const dutyEndTime = document.getElementById('duty-end-time')

const productSearch = document.getElementById('product-search')
const productList = document.getElementById('product-list')
const productRate = document.getElementById('product-rate')
const productQuantity = document.getElementById('product-quantity')



const formHeading = document.getElementById('form-heading');
const form = document.getElementById('manage-form');
const submitBtn = form.querySelector('.form-actionable .mdc-fab--action[type="submit"]')

const init = (office, officeId) => {

    // check if we have activity id in url. 
    // if activity id is  found, then udpate the form else create

    const dutyLocation = new URLSearchParams(window.location.search).get('location');
    const formId = getFormId();
    const requestParams = getFormRequestParams();
    if (!dutyLocation) {
        document.querySelector('.duty-location').classList.remove('hidden');
        
    }

    /** manage start and end date */
    dutyStartDate.addEventListener('change', (evt) => {
        dutyEndDate.value = evt.target.value;
        dutyEndDate.min = evt.target.value;
    })
    dutyStartTime.addEventListener('change', (evt) => {
        dutyEndTime.value = evt.target.value;
        dutyEndTime.min = evt.target.value;
    })
    if (formId) {
        document.getElementById('form-heading').innerHTML = 'Update Duty'
        getActivity(formId).then(activity => {
            if (activity) {
                updateDuty(activity)
            }
            http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/activity/${formId}/`).then(res => {
                putActivity(res).then(updateDuty);
            })
        });
    }
    else {
        const hours = new Date().getHours();
        const minutes = new Date().getMinutes();
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const date = new Date().getDate();
        dutyStartDate.value = `${year}-${month < 10 ?'0':''}${month}-${date < 10 ? '0':''}${date}`
        dutyStartTime.value = `${hours < 10 ? '0':''}${hours}:${minutes < 10 ? '0' :''}${minutes}`
    }

    dutyStartDate.dispatchEvent(new Event('change', {
        'bubbles': true
    }))
    dutyStartTime.dispatchEvent(new Event('change', {
        'bubbles': true
    }));


    
    locationAdditionComponent({input:locationSearch,officeId});
    locationSearch.addEventListener('selected',(ev)=>{
        locationSearch.value = ev.detail.locationName;
    })
    
    userAdditionComponent({input:supervisorSearch,officeId,singleChip:true});
    userAdditionComponent({input:employeeSearch,officeId});

    supervisorSearch.addEventListener('selected', (ev) => {
        const user = ev.detail.user;
        supervisorSearch.value = user.employeeName || user.displayName ||  user.phoneNumber;
        supervisorSearch.dataset.number = user.phoneNumber;
    })
  

    employeeSearch.addEventListener('selected', (ev) => {
        const user = ev.detail.user;

        employeeSearch.dataset.number += user.phoneNumber + ',';
        employeeSearch.value = '';
    })
    employeeSearch.addEventListener('removed', (ev) => {
        const user = ev.detail.user;
        const split = employeeSearch.dataset.number.split(",");
        const index = split.indexOf(user.phoneNumber);
        split.splice(index,1);
        const string = split.join(",")
        employeeSearch.dataset.number = string;
        employeeSearch.value = ''
    })

    const productMenu = new mdc.menu.MDCMenu(document.getElementById('product-menu'))
    /**  manage products */
    getTypeList({
        officeId,
        template:'product',
        loadOnce: true
    }, (products) => {

        initializeSearch(productSearch, function (value) {
            const tx = window.database.transaction("types");
            const store = tx.objectStore("types");
            const index = store.index("search_key_name");
            const matchedProducts = []
            index.openCursor(IDBKeyRange.bound(value.toLowerCase(), value.toLowerCase() + '\uFFFF')).onsuccess = function (ev) {
                const cursor = ev.target.result;
                if (!cursor) return;
                matchedProducts.push(cursor.value)
                cursor.continue();
            }
            tx.oncomplete = function () {
                productList.innerHTML = '';
                matchedProducts.filter(product => document.getElementById(product.id) ? null : product).forEach(product => {
                    productList.appendChild(productMenuLi(product))
                });
                if (matchedProducts.length > 0) {
                    productMenu.open = true;
                }
            }
        }, 1000);
    });

    productMenu.listen('MDCMenu:selected', function (event) {
        const product = JSON.parse(event.detail.item.dataset.product);
        menu.open = false;
        productSearch.value = '';
        appendProductCard(product)

    });


    form.addEventListener('submit', (ev) => {

        ev.preventDefault();


        submitBtn.classList.add('active')

        const activityBody = createActivityBody();
        activityBody.setOffice(office)
        activityBody.setActivityId(formId)
        activityBody.setTemplate('duty')
        activityBody.setSchedule([{
            startTime: moment(`${dutyStartDate.value}T${dutyStartTime.value}`).valueOf(),
            endTime: moment(`${dutyEndDate.value}T${dutyEndTime.value}`).valueOf(),
            name: 'Duty'
        }])

        activityBody.setAttachment('Location', dutyLocation || locationSearch.value, 'string');

        const selectedProducts = [...document.querySelectorAll('.add-product-card.selected-product')].map(el => {
            if (el.dataset.name) {
                return {
                    name: el.dataset.name,
                    rate: Number(el.querySelector('.product-rate input').value),
                    quantity: Number(el.querySelector('.product-quantity input').value)
                };
            };
        })

        activityBody.setAttachment('Products', selectedProducts, 'product');
        activityBody.setAttachment('Supervisor', supervisorSearch.dataset.number, 'phoneNumber');
        activityBody.setAttachment('Include', employeeSearch.dataset.number, 'string')
        activityBody.setAttachment('Date', moment(dutyStartDate.value).format('Do MMM YYYY'), 'string')
        const requestBody = activityBody.get();
        console.log(requestBody)



        http(requestParams.method, requestParams.url, requestBody).then(res => {
            let message = 'Duty created'
            if(requestParams.method === 'PUT') {
                message = 'Duty updated'
            };
            if(requestParams.method === 'PUT') {
                putActivity(requestBody).then(res=>{
                    handleFormButtonSubmitSuccess(submitBtn,message);
                })
                return
            }
            handleFormButtonSubmitSuccess(submitBtn,message);
        }).catch(err => {
            handleFormButtonSubmit(submitBtn, err.message)
        });
    })
}


const createProductOption = (product) => {
    const li = createElement('li', {
        className: 'mdc-list-item'
    })
    li.dataset.value = product.name;
    li.dataset.product = JSON.stringify(product);
    li.innerHTML = `  <span class="mdc-list-item__ripple"></span>
    <span class="mdc-list-item__text">${product.name}</span>`
    return li;
}

const productMenuLi = (product) => {
    const li = createElement('li', {
        className: 'mdc-list-item',
        attrs: {
            role: 'menuitem'
        }
    })
    li.dataset.product = JSON.stringify(product)
    const span = createElement('span', {
        textContent: product.name,
        className: 'mdc-list-item__text'
    })
    li.appendChild(span)
    new mdc.ripple.MDCRipple(li);
    return li
}


const appendProductCard = (product) => {
    const node = document.getElementById('clone-node').cloneNode(true);
    node.querySelector('.remove').addEventListener('click',()=>{
        node.remove();
    })
    node.id = product.id;
    node.dataset.name = product.name;
    node.querySelector('.product-name-heading').textContent = product.name
    node.querySelector('.product-rate input').value = product.rate || ''
    node.querySelector('.product-quantity input').value = product.quantity || ''
    node.classList.remove('hidden')
    node.classList.add('selected-product')
    document.querySelector('.product-manage').appendChild(node)
}



const updateDuty = (duty) => {

    locationSearch.value = duty.attachment['Location'].value;

    dutyStartDate.value = moment(duty.schedule[0].startTime).format('YYYY-MM-DD')
    dutyStartTime.value = moment(duty.schedule[0].startTime).format('HH:mm')

    dutyEndDate.value = moment(duty.schedule[0].endTime).format('YYYY-MM-DD')
    dutyEndTime.value = moment(duty.schedule[0].endTime).format('HH:mm');

    const supervisorNumber = duty.attachment['Supervisor'].value;
    const employeeNumbers = duty.attachment['Include'].value

    supervisorSearch.value = supervisorNumber || '';
    supervisorSearch.dataset.number = supervisorNumber

    employeeSearch.dataset.number = employeeNumbers;

    window.database.transaction('users').objectStore('users').get(supervisorNumber).onsuccess  = function(e) {
        supervisorSearch.value = e.target.result.employeeName;
    }

    if(duty.assignees) {
        duty.assignees.forEach(assignee => {
            const chip = createUserChip(assignee);
            if(document.querySelector(`.mdc-chip[data-number="${assignee.phoneNumber}"]`)) {
                document.querySelector(`.mdc-chip[data-number="${assignee.phoneNumber}"]`).remove()
            }
            if (assignee.phoneNumber !== supervisorNumber) {
                document.getElementById('employee-chipset').appendChild(chip);
            } 
        })
    }

    new mdc.chips.MDCChipSet(document.getElementById('employee-chipset'));

    duty.attachment['Products'].value.forEach(product => {
        if(product.name && !document.querySelector(`.add-product-card[data-name="${product.name}"]`)) {
            appendProductCard(product)
        }
    })
}