


const showProductList = (products) => {
    const ul = document.getElementById('products-list');
    ul.innerHTML = ''
    if(!products.length) {
        ul.appendChild(emptyCard('No products found'));
        document.querySelector('.see-all--products').classList.add('hidden')
        return
    };

    
    products.forEach(product =>{
        const li = createProductLi(product);
        new mdc.ripple.MDCRipple(li);
        ul.appendChild(li);
        ul.appendChild(createElement('li',{className:'mdc-list-divider'}))
        ul.appendChild(createElement('li',{
            className:'mdc-list-divider'
        }))
    });
    
}


const createProductLi = (product) => {
    const li = createElement("li",{
        className:'mdc-list-item',
        id:product.id
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
        <a href='../products/manage.html?id=${product.id}&name=${product.name}' class="material-icons list-meta--icon">${product.canEdit ? 'edit':'keyboard_arrow_right'}</a>
    </div>`
    return li;
}