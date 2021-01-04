const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const activityReportDate = document.getElementById('employee-activity-date-input');
const locationReportDate = document.getElementById('location-date-input');
const attendanceMonthSelect = document.getElementById("attendance-month-select");
const attendanceYearSelect = document.getElementById("attendance-year-select");
const endMonth = new Date().getMonth()
const endYear = new Date().getFullYear();

const getRange = (start, end) => {
    const array = []
    for (let index = start; index <= end; index++) {
        array.push(index)
    }
    console.log(array)
    return array
}

const selectLi = (value, name) => {
    const el = createElement('li', {
        className: 'mdc-list-item',

    })
    el.dataset.value = value
    el.innerHTML = `<span class = "mdc-list-item__ripple"></span> 
         <span class = "mdc-list-item__text">${name}</span>`
    return el;
}

/** Initialize the select fields and date fields for report cards */
(function () {
    const attendanceCard = document.getElementById('attendance-card');
    months.forEach((month,index)=>{
        attendanceCard.querySelector('.month-list').appendChild(selectLi(index,month))
    })
    getRange(2020, endYear).forEach(year => {
        attendanceCard.querySelector('.year-list').appendChild(selectLi(year, year))
    })

    const todayDate = moment().format('YYYY-MM-DD')


    activityReportDate.setAttribute("max", todayDate)
    activityReportDate.value = todayDate

    locationReportDate.setAttribute("max", todayDate)
    locationReportDate.value = todayDate

})();

const init = (office, officeId) => {

    attendanceMonthSelect.MDCSelect.value = endMonth.toString()
    attendanceYearSelect.MDCSelect.value = endYear.toString()


    /** Report download buttons. Report name is taken from dataset 'name' */
    const url = `${appKeys.getBaseUrl()}/api/office/${officeId}/report`;
    document.querySelectorAll(".download-report-btn").forEach(el=>{
        el.addEventListener('click',function(){
            this.classList.add('in-progress')
            let reportURL = `${url}?name=${el.dataset.name}`;
            let fileName = ''
            if(el.dataset.name === "monthlyAttendance") {
                fileName = `OnDuty Monthly Attendance report | ${moment(`${attendanceYearSelect.MDCSelect.value}-${Number(attendanceMonthSelect.MDCSelect.value)+1}`,'YYYY-MM').format('MMMM YYYY')}`
                console.log(fileName)
                reportURL += `&month=${attendanceMonthSelect.MDCSelect.value}&year=${attendanceYearSelect.MDCSelect.value}`
            }            
            if(el.dataset.name === "employeeActivity") {
                fileName = `OnDuty employee activity report | ${moment(activityReportDate.value,'YYYY-MM-DD').format('DD MMMM YYYY')}`
                console.log(fileName)
                reportURL += `${getURLStringFromDate(activityReportDate.value)}`
            }
            if(el.dataset.name === "location") {
                fileName = `OnDuty location report | ${moment(locationReportDate.value,'YYYY-MM-DD').format('DD MMMM YYYY')}`
                console.log(fileName)
                reportURL += `${getURLStringFromDate(locationReportDate.value)}`
            }

            getReportBinary(reportURL).then(data=>{
                this.classList.remove('in-progress')
                handleReport(data,fileName, this.nextElementSibling)
            }).catch((err)=>{
                this.classList.remove('in-progress')
                this.nextElementSibling.textContent  = err.message
            })
        })
    })
}

const handleReport = (data, filename,errorField) => {
    if (!data) {
        errorField.textContent = 'No data found for this date'
        return
    }
    errorField.textContent = ''
    console.log(data)
    const file = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = file;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

const getURLStringFromDate = (dateString) => {
    const momentDate = moment(dateString, 'YYYY-MM-DD')
    return `&year=${momentDate.year()}&month=${momentDate.month()}&day=${momentDate.date()}`
}

const getReportBinary = (url) => {
    return new Promise((resolve, reject) => {
        firebase.auth().currentUser.getIdToken().then(token => {
            fetch(url, {
                method: 'GET',
                headers: new Headers({
                    "Authorization": `Bearer ${token}`,
                })
            }).then(response => {
                if (response.status == 204) {
                    return response.text();
                }
                return response.blob()
            }).then(resolve).catch(reject)
        })
    })
}