
const container = document.querySelector('.fabs');
const mainContent = document.querySelector('.main-content')
const searchInput = document.getElementById('search-employee');
const ul = document.getElementById('employees-list');
const downloadBtn = document.getElementById('download-employees')

/**
 * Divide the parent dom by mdc two--line list height and round of to nearest whole number.
 * The resulting positive integer will the query limit for users's api
 */
const query_limit_size = Math.round((document.body.offsetHeight - ul.offsetTop) / 72)


const init = (office, officeId) => {
    console.log('query limit size', query_limit_size);
    let start = 0;

    // load first set
    getUserList({
        officeId,
        query_limit_size,
        start
    }, (res) => {
        updateUsersList(res.users, start, res.fresh)
    });

    /** initialize scroll detection */
    mainContent.addEventListener('scroll', (ev) => {

        /** scrolled to bottom query_limit_size is deducted from scroll height to early load the list
         *to mitigate the problem of rough transitions at bottom*/

        if (ev.currentTarget.offsetHeight + ev.currentTarget.scrollTop >= (ev.currentTarget.scrollHeight - query_limit_size)) {
            // to prevent repeated scoll bottom executions
            debounce(function () {
                start += query_limit_size;
                getUserList({
                    officeId,
                    query_limit_size,
                    start
                }, (res) => {
                    updateUsersList(res.users, start, res.fresh)
                    // increment start count by query_limit_count each time list is scrolled to bottom.
                })
            }, 300)
        }
    });

    /** initialzie search */
    initializeSearch(searchInput, (value) => {
   
        let query;
        if(Number(value)) {
            query = 'phoneNumber='+encodeURIComponent(value)
        }
        else {
            query = 'employeeName='+encodeURIComponent(value)
        }        
        
        getUsersDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/user?${query}`).then(res => {
            ul.innerHTML = '';
            res.results.forEach(user => {
                ul.appendChild(createUserli(user))
            })
        })
    }, 1000);


    downloadBtn.addEventListener('click',()=>{
        const reportUrl = `${appKeys.getBaseUrl()}/api/office/${officeId}/user?downloadReport=true`;
        downloadBtn.classList.add('in-progress')
        getReportBinary(reportUrl).then(data=>{
            downloadBtn.classList.remove('in-progress')
            if(!data) {
                showSnacksApiResponse('No data is available');
                return
            }
            handleReport(data,'users');
        }).catch((err)=>{
            downloadBtn.classList.remove('in-progress')
        })
    })
}



/** Handle fab list */
container.children[0].addEventListener('click', (ev) => {
    const dialog = new mdc.dialog.MDCDialog(document.getElementById('share-dialog'));
    let metaRecord;
    const tx = window.database.transaction("meta");
    tx.objectStore("meta").get("meta").onsuccess = function (e) {
        metaRecord = e.target.result;

    }
    tx.oncomplete = function () {
        dialog.content_.innerHTML = ''
        if (metaRecord.shareLink) {
            dialog.content_.appendChild(shareWidget(metaRecord.shareLink))   
        }
        else {
            getShareLink(metaRecord.office).then(res => {
                dialog.content_.appendChild(shareWidget(res.shortLink));
                metaRecord.shareLink = res.shortLink
                window.database.transaction("meta",'readwrite').objectStore("meta").put(metaRecord);
            })
        }
        dialog.open()
        toggleFabList(container.children[2])
    }
})
container.children[1].addEventListener('click', (ev) => {
    redirect('/admin/employees/manage')
})
container.children[2].addEventListener('click', (ev) => {
    toggleFabList(ev.currentTarget)
})