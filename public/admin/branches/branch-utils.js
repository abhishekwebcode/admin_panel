const showBranchList = (branches) => {
    const ul = document.getElementById('branches-list');
    ul.innerHTML = ''
    if(!branches.length) {
        ul.appendChild(emptyCard('No branch found'));
        document.querySelector('.see-all--branches').classList.add('hidden')
        return
    };

    
    branches.forEach(branch =>{
        const li = createBranchLi(branch);
        new mdc.ripple.MDCRipple(li);
        ul.appendChild(li);
        ul.appendChild(createElement('li',{className:'mdc-list-divider'}))
    });
}


const createBranchLi = (branch) => {
    const li = createElement("li",{
        className:'mdc-list-item',
        id:branch.id
    })
   
    li.innerHTML = `<span class="mdc-list-item__ripple"></span>
    
    <span class="mdc-list-item__text">
        <span class="mdc-list-item__primary-text">${branch.name}</span>
        <span class="mdc-list-item__secondary-text">${branch.address}</span>

    </span>
    <div class="mdc-list-item__meta">
        <a href='../branches/manage.html?id=${branch.id}&name=${branch.name}&canEdit=${branch.canEdit}' class="material-icons list-meta--icon">${branch.canEdit ? 'edit':'keyboard_arrow_right'}</a>
    </div>`
    return li;
}

const removeOldBranches = (oldBranch, newBranch) => {
    Object.keys(oldBranch).forEach(key => {
        if (!newBranch[key]) {
            document.querySelector(`[data-value="${key}"]`).remove()
        }
    });
}