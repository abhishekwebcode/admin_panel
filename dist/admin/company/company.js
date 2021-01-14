var init = function init(office, officeId) {
  handleProfileDetails(officeId);
  getTypeList({
    officeId: officeId,
    limit: 5,
    template: 'product'
  }, function (products) {
    console.log(products);
    showProductList(products);
  });
  getTypeList({
    officeId: officeId,
    limit: 5,
    template: 'branch'
  }, function (branches) {
    console.log(branches);
    showBranchList(branches);
  });
};