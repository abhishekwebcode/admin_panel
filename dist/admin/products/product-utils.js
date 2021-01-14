var showProductList = function showProductList(products) {
  var ul = document.getElementById('products-list');
  ul.innerHTML = '';

  if (!products.length) {
    ul.appendChild(emptyCard('No products found'));
    document.querySelector('.see-all--products').classList.add('hidden');
    return;
  }

  ;
  products.forEach(function (product) {
    var li = createProductLi(product);
    new mdc.ripple.MDCRipple(li);
    ul.appendChild(li);
    ul.appendChild(createElement('li', {
      className: 'mdc-list-divider'
    }));
  });
};

var createProductLi = function createProductLi(product) {
  var li = createElement("li", {
    className: 'mdc-list-item',
    id: product.id
  });

  if (product.brand) {
    li.classList.add('product-with--brand');
  }

  li.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n    \n    <span class=\"mdc-list-item__text\">\n        <span class=\"mdc-list-item__primary-text\">".concat(product.name, "</span>\n        <span class=\"mdc-list-item__secondary-text\">").concat(product.brand, "</span>\n    </span>\n    <div class=\"mdc-list-item__meta\">\n        ").concat(product.value ? "<span class='product-value'>".concat(formatMoney(product.value), "</span>") : '', "\n        <a href='../products/manage.html?id=").concat(product.id, "&name=").concat(product.name, "&canEdit=").concat(product.canEdit, "' class=\"material-icons list-meta--icon\">").concat(product.canEdit ? 'edit' : 'keyboard_arrow_right', "</a>\n    </div>");
  return li;
};