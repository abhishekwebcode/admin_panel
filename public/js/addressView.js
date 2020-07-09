function manageAddress(locations, customerTypes, office, template) {
  console.log(customerTypes)
  const customerTypesNames = [];
  customerTypes.forEach(type => {
    customerTypesNames.push(type.attachment.Name.value)
  })
  document.getElementById('app-content').innerHTML = `
  <div class='mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4'>
    <div id='add-more--container'>
    
    </div>
    <div class='flex-container'  style='padding-top:28px'>
      <div class='flex-manage'>
          <div class='search-bar-container'></div>
          <ul class='mdc-list mdc-list--two-line overflow-list' id='branch-list'></ul>
      </div>
    </div>
  </div>
  <div class='mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4'>
    <div id='form-container'></div>
  </div>
`


  document.querySelector('.search-bar-container').appendChild(searchBar('search-branch'));



  const ul = document.getElementById('branch-list');
  locations.forEach(location => {
    window.isSupport ? location.canEdit = true : '';

    const cont = actionListStatusChange({
      primaryTextContent: location.venue[0].location,
      secondaryTextContent: location.venue[0].address || '-',
      activity:location
    })

    cont.querySelector('li').dataset.address = location.venue[0].address
    cont.querySelector('li').dataset.location = location.venue[0].location
    cont.querySelector('li').dataset.name = location.activityName
    ul.append(cont);

  });

  const list = new mdc.list.MDCList(ul);
  list.singleSelection = true;
  list.selectedIndex = 0;
  const formContainer = document.getElementById('form-container');

  list.listen('MDCList:action', function (e) {
    getLocation().then(function (geopoint) {

      const formData = locations[e.detail.index]
      console.log(formData);
      window.isSupport ? formData.canEdit = true : '';

      const venueGeopoint = formData.venue[0].geopoint;
      formData.venue[0].geopoint = {
        latitude: venueGeopoint._latitude,
        longitude: venueGeopoint._longitude
      }
      addView(formContainer, formData, customerTypesNames);
    })
  })

  if (locations.length) {
    const event = new CustomEvent('MDCList:action', {
      detail: {
        index: 0
      }
    });
    list.root_.dispatchEvent(event)
  }

  initializeSearch(function (value) {
    searchAddress(value, list);
  })


  if(!userState.canEditSubscription(template)) return;
  
  const addMore = iconButtonWithLabel('add','Add more','add-more')
  addMore.classList.add('mdc-button--raised');
  addMore.addEventListener('click', function () {


    http('GET', `/json?action=view-templates&name=${template}`).then(template => {
      const formData = template[Object.keys(template)[0]];
      getLocation().then((geopoint) => {
        formData.office = office;
        formData.template = formData.name;
        formData.canEdit = true
        const vd = formData.venue[0]

        formData.venue = [{
          'venueDescriptor': vd,
          'address': '',
          'location': '',
          'geopoint': geopoint
        }]

        formData.isCreate = true
        addView(formContainer, formData, customerTypesNames);
      })
    })

  })
  document.getElementById('add-more--container').appendChild(addMore);
}

const actionListStatusChange = (attr) => {
  const list = actionList(attr);
  list.querySelector('.mdc-list-item').dataset.key = attr.activity.activityId;

  const btn = list.querySelector('.status-button')
  if (btn) {
    btn.addEventListener('click', function () {
      attr.activity.status = btn.dataset.status
      statusChange(attr.activity).then(function () {
        if (btn.dataset.status === 'CONFIRMED') {
          btn.dataset.status = 'CANCELLED';
          btn.textContent = 'delete'
          return
        }

        btn.dataset.status = 'CONFIRMED';
        btn.textContent = 'check'

      })
    });
  }

  return list;
}






const searchAddress = (inputValue, branchList) => {
  branchList.listElements.forEach((el) => {
    if (el.dataset.address.toLowerCase().indexOf(inputValue) > -1 || el.dataset.location.toLowerCase().indexOf(inputValue) > -1 || el.dataset.name.toLowerCase().indexOf(inputValue) > -1) {
      el.classList.remove('hidden')
    } else {
      el.classList.add('hidden')
    }
  })
}