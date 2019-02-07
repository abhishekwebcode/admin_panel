import {
    requestCreator
} from './utils';
import {
    MDCRipple
} from '@material/ripple';

export function panel(auth) {
    requestCreator('fetchServerTime', {
        id: '123'
    }).then(function () {
        initButtons(auth);
    }).catch(console.log)
}

const isAdminValid = (auth) => {
    const admin = auth.admin
    if (Array.isArray(admin) && admin.length > 0) {
        return true
    }
    return false;
}

function initButtons(auth) {
    console.log(auth)
    const searchButton = new MDCRipple(document.getElementById('search-office'))
    const createButton = new MDCRipple(document.getElementById('create-office'))
    searchButton['root_'].addEventListener('click', function () {
        if (auth.claims.support) {
            initOfficeSearch()
            return;
        }

        if (isAdminValid(auth.claims)) {
            initOfficeSearch(auth.claims.admin)
            return;
        } else {
            alert("you dont have any office");
        }
    })

    createButton['root_'].addEventListener('click', function () {

    })

}


function initOfficeSearch(adminOffice) {
    const input = document.createElement('input');
    input.id = 'search-office-input'
    input.setAttribute('list', 'offices')
    input.name = 'office-search'

    let searchList;
    
    const selectOfficeButton = document.createElement('button');
    selectOfficeButton.id = 'select-office';
    selectOfficeButton.textContent = 'select office'
    selectOfficeButton.onclick = function(){
	const value = input.value;
	if(adminOffice){
	    // show rest of filters
	    return;
	}
	
	if(value){   
	    if(selectOfficeButton.dataset.value === 'search'){
		showSearchedItems(searchList,value)
	    }
	    else {
		//show rest of filter
	    }
	    return;
	}
	input.placeholder = 'Please select an office'
	
    }
    
    if (adminOffice) {
	searchList = document.createElement('datalist');
        searchList.id = 'offices'
    
        adminOffice.forEach(function (office) {
            const option = document.createElement('option');
            option.value = office
            searchList.appendChild(option)
        })
        return;
    }
    selectOfficeButton.textContent = 'search';
    selectOfficeButton.dataset.value = 'search';
    
    searchList = document.createElement('ul')

    const container = document.getElementById('office-filter-container');
    
    container.appendChild(input);
    container.appendChild(selectOfficeButton)
    container.appendChild(searchList);
}


function showSearchedItems(searchList ,value){
           searchList.innerHTML = '' 
            requestCreator('search', {
                office: value
            }).then(function (offices) {
                if (offices.length > 0) {
                  offices.forEach(function (office) {
                        const li = document.createElement('li');
                        li.textContent = office
                      searchList.appendChild(li);
		      li.onclick = function(){
			  searchList.innerHTML= ''
			  document.getElementById('search-office-input').value = office;
			  document.getElementById('select-office').textContent = 'select office';
			  document.getElementById('select-office').dataset.value = 'select';
			  
			  
		      }
		  })
                }
		
            }).catch(console.log)
  
}
