var months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var activityReportDate = document.getElementById('employee-activity-date-input');
var locationReportDate = document.getElementById('location-date-input');
var attendanceMonthSelect = document.getElementById("attendance-month-select");
var attendanceYearSelect = document.getElementById("attendance-year-select");
var endMonth = new Date().getMonth();
var endYear = new Date().getFullYear();

var getRange = function getRange(start, end) {
  var array = [];

  for (var index = start; index <= end; index++) {
    array.push(index);
  }

  console.log(array);
  return array;
};

var selectLi = function selectLi(value, name) {
  var el = createElement('li', {
    className: 'mdc-list-item'
  });
  el.dataset.value = value;
  el.innerHTML = "<span class = \"mdc-list-item__ripple\"></span> \n         <span class = \"mdc-list-item__text\">".concat(name, "</span>");
  return el;
};
/** Initialize the select fields and date fields for report cards */


(function () {
  var attendanceCard = document.getElementById('attendance-card');
  months.forEach(function (month, index) {
    attendanceCard.querySelector('.month-list').appendChild(selectLi(index, month));
  });
  getRange(2020, endYear).forEach(function (year) {
    attendanceCard.querySelector('.year-list').appendChild(selectLi(year, year));
  });
  var todayDate = moment().format('YYYY-MM-DD');
  activityReportDate.setAttribute("max", todayDate);
  activityReportDate.value = todayDate;
  locationReportDate.setAttribute("max", todayDate);
  locationReportDate.value = todayDate;
})();

var init = function init(office, officeId) {
  attendanceMonthSelect.MDCSelect.value = endMonth.toString();
  attendanceYearSelect.MDCSelect.value = endYear.toString();
  /** Report download buttons. Report name is taken from dataset 'name' */

  var url = "".concat(appKeys.getBaseUrl(), "/api/office/").concat(officeId, "/report");
  document.querySelectorAll(".download-report-btn").forEach(function (el) {
    el.addEventListener('click', function () {
      var _this = this;

      this.classList.add('in-progress');
      var reportURL = "".concat(url, "?name=").concat(el.dataset.name);
      var fileName = '';

      if (el.dataset.name === "monthlyAttendance") {
        fileName = "OnDuty Monthly Attendance report | ".concat(moment("".concat(attendanceYearSelect.MDCSelect.value, "-").concat(Number(attendanceMonthSelect.MDCSelect.value) + 1), 'YYYY-MM').format('MMMM YYYY'));
        console.log(fileName);
        reportURL += "&month=".concat(attendanceMonthSelect.MDCSelect.value, "&year=").concat(attendanceYearSelect.MDCSelect.value);
      }

      if (el.dataset.name === "employeeActivity") {
        fileName = "OnDuty employee activity report | ".concat(moment(activityReportDate.value, 'YYYY-MM-DD').format('DD MMMM YYYY'));
        console.log(fileName);
        reportURL += "".concat(getURLStringFromDate(activityReportDate.value));
      }

      if (el.dataset.name === "location") {
        fileName = "OnDuty location report | ".concat(moment(locationReportDate.value, 'YYYY-MM-DD').format('DD MMMM YYYY'));
        console.log(fileName);
        reportURL += "".concat(getURLStringFromDate(locationReportDate.value));
      }

      getReportBinary(reportURL).then(function (data) {
        _this.classList.remove('in-progress');

        handleReport(data, fileName, _this.nextElementSibling);
      }).catch(function (err) {
        _this.classList.remove('in-progress');

        _this.nextElementSibling.textContent = err.message;
      });
    });
  });
};

var handleReport = function handleReport(data, filename, errorField) {
  if (!data) {
    errorField.textContent = 'No data found for this date';
    return;
  }

  errorField.textContent = '';
  console.log(data);
  var file = window.URL.createObjectURL(data);
  var a = document.createElement('a');
  a.href = file;
  a.download = "".concat(filename, ".xlsx");
  document.body.appendChild(a);
  a.click();
  a.remove();
};

var getURLStringFromDate = function getURLStringFromDate(dateString) {
  var momentDate = moment(dateString, 'YYYY-MM-DD');
  return "&year=".concat(momentDate.year(), "&month=").concat(momentDate.month(), "&day=").concat(momentDate.date());
};

var getReportBinary = function getReportBinary(url) {
  return new Promise(function (resolve, reject) {
    firebase.auth().currentUser.getIdToken().then(function (token) {
      fetch(url, {
        method: 'GET',
        headers: new Headers({
          "Authorization": "Bearer ".concat(token)
        })
      }).then(function (response) {
        if (response.status == 204) {
          return response.text();
        }

        return response.blob();
      }).then(resolve).catch(reject);
    });
  });
};