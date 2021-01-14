const init = (office,officeId) => {
    handleProfileDetails(officeId);
    getTypeList({officeId,limit:5,template:'product'},(products)=>{
        console.log(products)
        showProductList(products)
    });

    getTypeList({officeId,limit:5,template:'branch'},(branches)=>{
        console.log(branches)
        showBranchList(branches)
    });
}


