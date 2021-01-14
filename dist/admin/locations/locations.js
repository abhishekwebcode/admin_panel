// const container = document.querySelector('.fabs');
var mainContent = document.querySelector('.main-content');
var searchInput = document.getElementById('search-location');
var ul = document.getElementById('locations-list');
var addBranchBtn = document.getElementById('add-branch');
/**
 * Divide the parent dom by mdc two--line list height and round of to nearest whole number.
 * The resulting positive integer will be the query limit for users's api
 */

var query_limit_size = Math.round((document.body.offsetHeight - ul.offsetTop) / 57);

var init = function init(office, officeId) {
  console.log('query limit size', query_limit_size);
  var start = 0; // load first set

  getLocationList({
    officeId: officeId,
    query_limit_size: query_limit_size,
    start: start
  }, function (res) {
    updateLocationList(res.locations, start, res.fresh);
  });
  /** initialize scroll detection */

  mainContent.addEventListener('scroll', function (ev) {
    /** scrolled to bottom query_limit_size is deducted from scroll height to early load the list
     *to mitigate the problem of rough transitions at bottom*/
    if (ev.currentTarget.offsetHeight + ev.currentTarget.scrollTop >= ev.currentTarget.scrollHeight - query_limit_size) {
      // to prevent repeated scoll bottom executions
      debounce(function () {
        start += query_limit_size;
        getLocationList({
          officeId: officeId,
          query_limit_size: query_limit_size,
          start: start
        }, function (res) {
          updateLocationList(res.locations, start, res.fresh); // increment start count by query_limit_count each time list is scrolled to bottom.
        });
      }, 300);
    }
  });
  /** initialzie search */

  initializeSearch(searchInput, function (value) {
    console.log(value);
    var query = 'location=' + encodeURIComponent(value);
    getLocationsDetails("".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/location?").concat(query)).then(function (res) {
      ul.innerHTML = '';
      res.results.forEach(function (location) {
        ul.appendChild(createLocationLi(location));
      });
    });
  }, 1000);
}; // container.children[0].addEventListener('click', (ev) => {
//   redirect('/admin/locations/customer')
// })
// container.children[1].addEventListener('click', (ev) => {
//     redirect('/admin/locations/branch')
// })
// container.children[2].addEventListener('click', (ev) => {
//     toggleFabList(ev.currentTarget)
// })