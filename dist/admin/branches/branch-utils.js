var showBranchList = function showBranchList(branches) {
  var ul = document.getElementById('branches-list');
  ul.innerHTML = '';

  if (!branches.length) {
    ul.appendChild(emptyCard('No branch found'));
    document.querySelector('.see-all--branches').classList.add('hidden');
    return;
  }

  ;
  branches.forEach(function (branch) {
    var li = createBranchLi(branch);
    new mdc.ripple.MDCRipple(li);
    ul.appendChild(li);
    ul.appendChild(createElement('li', {
      className: 'mdc-list-divider'
    }));
  });
};

var createBranchLi = function createBranchLi(branch) {
  var li = createElement("li", {
    className: 'mdc-list-item',
    id: branch.id
  });
  li.innerHTML = "<span class=\"mdc-list-item__ripple\"></span>\n    \n    <span class=\"mdc-list-item__text\">\n        <span class=\"mdc-list-item__primary-text\">".concat(branch.name, "</span>\n        <span class=\"mdc-list-item__secondary-text\">").concat(branch.address, "</span>\n\n    </span>\n    <div class=\"mdc-list-item__meta\">\n        <a href='../branches/manage.html?id=").concat(branch.id, "&name=").concat(branch.name, "&canEdit=").concat(branch.canEdit, "' class=\"material-icons list-meta--icon\">").concat(branch.canEdit ? 'edit' : 'keyboard_arrow_right', "</a>\n    </div>");
  return li;
};

var removeOldBranches = function removeOldBranches(oldBranch, newBranch) {
  Object.keys(oldBranch).forEach(function (key) {
    if (!newBranch[key]) {
      document.querySelector("[data-value=\"".concat(key, "\"]")).remove();
    }
  });
};