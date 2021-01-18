var container = document.querySelector('.fabs');
var mainContent = document.querySelector('.main-content');
var searchInput = document.getElementById('search-employee');
var ul = document.getElementById('employees-list');
var downloadBtn = document.getElementById('download-employees');
/**
 * Divide the parent dom by mdc two--line list height and round of to nearest whole number.
 * The resulting positive integer will the query limit for users's api
 */

var query_limit_size = Math.round((document.body.offsetHeight - ul.offsetTop) / 72);

var init = function init(office, officeId) {
  console.log('query limit size', query_limit_size);
  var start = 0; // load first set

  getUserList({
    officeId: officeId,
    query_limit_size: query_limit_size,
    start: start
  }, function (res) {
    updateUsersList(res.users, start, res.fresh);
  });
  /** initialize scroll detection */

  mainContent.addEventListener('scroll', function (ev) {
    /** scrolled to bottom query_limit_size is deducted from scroll height to early load the list
     *to mitigate the problem of rough transitions at bottom*/
    if (ev.currentTarget.offsetHeight + ev.currentTarget.scrollTop >= ev.currentTarget.scrollHeight - query_limit_size) {
      // to prevent repeated scoll bottom executions
      debounce(function () {
        start += query_limit_size;
        getUserList({
          officeId: officeId,
          query_limit_size: query_limit_size,
          start: start
        }, function (res) {
          updateUsersList(res.users, start, res.fresh); // increment start count by query_limit_count each time list is scrolled to bottom.
        });
      }, 300);
    }
  });
  /** initialzie search */

  initializeSearch(searchInput, function (value) {
    var query;

    if (Number(value)) {
      query = 'phoneNumber=' + encodeURIComponent(value);
    } else {
      query = 'employeeName=' + encodeURIComponent(value);
    }

    getUsersDetails("".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/user?").concat(query)).then(function (res) {
      ul.innerHTML = '';
      res.results.forEach(function (user) {
        ul.appendChild(createUserli(user));
      });
    });
  }, 1000);
  downloadBtn.addEventListener('click', function () {
    var reportUrl = "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/user?downloadReport=true");
    downloadBtn.classList.add('in-progress');
    getReportBinary(reportUrl).then(function (data) {
      downloadBtn.classList.remove('in-progress');

      if (!data) {
        showSnacksApiResponse('No data is available');
        return;
      }

      handleReport(data, 'users');
    }).catch(function (err) {
      downloadBtn.classList.remove('in-progress');
    });
  });
};
/** Handle fab list */


container.children[0].addEventListener('click', function (ev) {
  var dialog = new mdc.dialog.MDCDialog(document.getElementById('share-dialog'));
  var metaRecord;
  var tx = window.database.transaction("meta");

  tx.objectStore("meta").get("meta").onsuccess = function (e) {
    metaRecord = e.target.result;
  };

  tx.oncomplete = function () {
    dialog.content_.innerHTML = '';

    if (metaRecord.shareLink) {
      dialog.content_.appendChild(shareWidget(metaRecord.shareLink));
    } else {
      getShareLink(metaRecord.office).then(function (res) {
        dialog.content_.appendChild(shareWidget(res.shortLink));
        metaRecord.shareLink = res.shortLink;
        window.database.transaction("meta", 'readwrite').objectStore("meta").put(metaRecord);
      });
    }

    dialog.open();
    toggleFabList(container.children[2]);
  };
});
container.children[1].addEventListener('click', function (ev) {
  redirect('/admin/employees/manage');
});
container.children[2].addEventListener('click', function (ev) {
  toggleFabList(ev.currentTarget);
});