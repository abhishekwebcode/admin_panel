// const container = document.querySelector('.fabs');
const mainContent = document.querySelector('.main-content')
const searchInput = document.getElementById('search-location');
const ul = document.getElementById('locations-list');
const addBranchBtn = document.getElementById('add-branch')
/**
 * Divide the parent dom by mdc two--line list height and round of to nearest whole number.
 * The resulting positive integer will be the query limit for users's api
 */
const query_limit_size = Math.round((document.body.offsetHeight - ul.offsetTop) / 57)


const init = (office, officeId) => {
    console.log('query limit size', query_limit_size);
    let start = 0;

    // load first set
    getLocationList({
        officeId,
        query_limit_size,
        start
    }, (res) => {
        updateLocationList(res.locations, start, res.fresh)
    });

    /** initialize scroll detection */
    mainContent.addEventListener('scroll', (ev) => {

        /** scrolled to bottom query_limit_size is deducted from scroll height to early load the list
         *to mitigate the problem of rough transitions at bottom*/

        if (ev.currentTarget.offsetHeight + ev.currentTarget.scrollTop >= (ev.currentTarget.scrollHeight - query_limit_size)) {
            // to prevent repeated scoll bottom executions
            debounce(function () {
                start += query_limit_size;
                getLocationList({
                    officeId,
                    query_limit_size,
                    start
                }, (res) => {
                    updateLocationList(res.locations, start, res.fresh)
                    // increment start count by query_limit_count each time list is scrolled to bottom.
                })
            }, 300)
        }
    });

    /** initialzie search */
    initializeSearch(searchInput, (value) => {
        console.log(value);
        const query = 'location='+encodeURIComponent(value);
        getLocationsDetails(`${appKeys.getBaseUrl()}/api/office/${officeId}/location?${query}`).then(res => {
            ul.innerHTML = '';
            res.results.forEach(location => {
                ul.appendChild(createLocationLi(location))
            })
        })
    }, 1000)

    addBranchBtn.addEventListener('click',(ev)=>{
        redirect('/admin/locations/branch')
    })
}


// container.children[0].addEventListener('click', (ev) => {
//   redirect('/admin/locations/customer')
// })
// container.children[1].addEventListener('click', (ev) => {
//     redirect('/admin/locations/branch')
// })

// container.children[2].addEventListener('click', (ev) => {
//     toggleFabList(ev.currentTarget)
// })