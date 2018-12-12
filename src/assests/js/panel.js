import {MdcList, toggleAppComponents, drawer,showHeaderDefault} from '../templates/templates';
import { MDCList } from '@material/list';
import * as template from '../templates/templates';
let panel = (office) => {

    // toggleAppComponents(false)
    // showHeaderDefault()
    // drawer('panel')
    localStorage.setItem('selectedOffice',office)
    document.getElementById('app').innerHTML = ''
    createActivityList(office)

    console.log(office);
}

function createActivityList(office) {
   const req = indexedDB.open('growthfile',1)
   req.onsuccess = function(){
       const db = req.result;
       const transaction = db.transaction(['activities']);
       const store = transaction.objectStore('activities');
       const index = store.index('list');
       const query = IDBKeyRange.bound([office,'ADMIN',0],[office,'ADMIN',new Date().getTime()]); 
       const results = []
       index.openCursor(query,'prev').onsuccess = function(event){
           const cursor = event.target.result;
           if(!cursor) return;
           results.push(cursor.value)
           cursor.continue();
           
       }
       transaction.oncomplete = function(){
          convertResultsToList(db,results)
       }
   }
}

function convertResultsToList(db, results) {
    let activityDom = ''

    let promiseMap = results.map(function (data) {
      return template.createActivityList(db, data).then(function (li) {
        return li.outerHTML
      })
    });
    Promise.all(promiseMap).then(function (results) {
      results.forEach(function (li) {
        activityDom += li
      })
      document.getElementById('app').innerHTML = activityDom
    })
  }


export {panel}
