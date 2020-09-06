const init = (office,officeId) => {
    handleProfileDetails(officeId);
    handleProductList(officeId);
    handleDepartmentList(officeId);
}

const handleProductList = (officeId) => {
    window
    .database
    .transaction("types")
    .objectStore("types")
    .index("template")
    .getAll("product",5).onsuccess = function(e){
        const products = e.target.result;
        showProductList(products);

        http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/type?template=product&limit=5&start=0`).then(response => {
            const tx = 
            window
            .database
            .transaction("types","readwrite");
            const store = tx.objectStore("types")

            response.results.forEach(result=>{
                result.template = 'product'
                store.put(result);
            });
            tx.oncomplete = function() {
                showProductList(response.results)
            }
        })
    }
}

const handleDepartmentList = (officeId) => {
  
    window
    .database
    .transaction("types")
    .objectStore("types")
    .index("template")
    .getAll("department",5).onsuccess = function(e){
        const products = e.target.result;
        showDepartmentList(products);

        http('GET', `${appKeys.getBaseUrl()}/api/office/${officeId}/type?template=department&limit=5&start=0`).then(response => {
            const tx = 
            window
            .database
            .transaction("types","readwrite");
            const store = tx.objectStore("types")

            response.results.forEach(result=>{
                result.template = 'department'
                store.put(result);
            });
            tx.oncomplete = function() {
                showDepartmentList(response.results)
            }
        })
    }
}

const showProductList = (products) => {
    const ul = document.getElementById('products-list');
    ul.innerHTML = ''
    if(!products.length) {
        ul.appendChild(emptyCard('No products found'));
        document.querySelector('.see-all--products').classList.add('hidden')
        return
    };

    
    products.forEach(product =>{
        const li = createElement("li",{
            className:'mdc-list-item'
        })
        if(product.brand) {
            li.classList.add('product-with--brand')
        }
        li.innerHTML = `<span class="mdc-list-item__ripple"></span>
        
        <span class="mdc-list-item__text">
            <span class="mdc-list-item__primary-text">${product.name}</span>
            <span class="mdc-list-item__secondary-text">${product.brand}</span>
        </span>
        <div class="mdc-list-item__meta">
            ${product.value ? `<span class='product-value'>${formatMoney(product.value)}</span>` :''}
            <a href='../products/manage?id=${product.id}' class="material-icons list-meta--icon">${product.canEdit ? 'edit':'keyboard_arrow_right'}</a>
        </div>`
        new mdc.ripple.MDCRipple(li);
        ul.appendChild(li);
        ul.appendChild(createElement('li',{
            className:'mdc-list-divider'
        }))
    });
    
}

const showDepartmentList = (departments) => {
    const ul = document.getElementById('departments-list');
    ul.innerHTML = ''
    if(!departments.length) {
        ul.appendChild(emptyCard('No departments found'));
        document.querySelector('.see-all--departments').classList.add('hidden')

        return
    }
    departments.forEach(department =>{

        const li = createElement("li",{
            className:'mdc-list-item'
        })

        li.innerHTML = `<span class="mdc-list-item__ripple"></span>
        ${department.name}
        ${department.canEdit ? `<span class="mdc-list-item__meta material-icons">edit</span>` :''}`
        new mdc.ripple.MDCRipple(li);
        ul.appendChild(li)
        ul.appendChild(createElement('li',{
            className:'mdc-list-divider'
        }))
    });
}


