

const init = (office,officeId) => {
    getTypeList({template:'product',officeId},(products)=>{
        showProductList(products)
    });
    const searchProductInput = document.getElementById('search-product');
    initializeSearch(searchProductInput,function(value){
        const tx = window.database.transaction("types");
        const store = tx.objectStore("types");
        const index = store.index("search_key_name");
        const matchedProducts = []
        index.openCursor(IDBKeyRange.bound(value.toLowerCase(),value.toLowerCase()+'\uFFFF')).onsuccess = function(ev)  {
            const cursor = ev.target.result;
            if(!cursor) return;
            matchedProducts.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function(){
            showProductList(matchedProducts);
            console.log('searching done')
        }
    },1000)
}    



