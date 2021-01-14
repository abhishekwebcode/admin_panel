var init = function init(office, officeId) {
  getTypeList({
    template: 'product',
    officeId: officeId
  }, function (products) {
    showProductList(products);
  });
  var searchProductInput = document.getElementById('search-product');
  initializeSearch(searchProductInput, function (value) {
    var tx = window.database.transaction("types");
    var store = tx.objectStore("types");
    var index = store.index("search_key_name");
    var matchedProducts = [];

    index.openCursor(IDBKeyRange.bound(value.toLowerCase(), value.toLowerCase() + "\uFFFF")).onsuccess = function (ev) {
      var cursor = ev.target.result;
      if (!cursor) return;
      matchedProducts.push(cursor.value);
      cursor.continue();
    };

    tx.oncomplete = function () {
      showProductList(matchedProducts);
      console.log('searching done');
    };
  }, 1000);
};