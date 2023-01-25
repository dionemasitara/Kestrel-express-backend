let selectedRows = []
let users = []
let numbers = []
let statusMode = {}

let filter = 'date'
let dates = null
let orderJourney = {
    startDate : '',
    endDate: '' ,
    startTime  :'',
    endTime : ''
}
let locations = {
    from  :'',
    to : ''
}

document.querySelectorAll('.table-row')
.forEach(row=>{
    row.addEventListener('click',()=>{
        let id = row.querySelector('.row_id').innerHTML
        let user = row.querySelector('#users').innerHTML
        let number = row.querySelector('#number').innerHTML
        if (!selectedRows.includes(id)){
            selectedRows.push(id)
            users.push(user)
            numbers.push(number)
        }
        else if(selectedRows.includes(id)){
            selectedRows.pop(id)
            numbers.pop(number)
            users.pop(user)
        }
        if(row.classList.contains('selected_border')){
            row.classList.remove('selected_border')
        }
        else if(!row.classList.contains('selected_border')){
            row.classList.add('selected_border')
        }
    })
})
let statusMenu = document.querySelector('#statusMenu')
let FMenu = document.querySelector('#FMenu')
let MODAL = document.querySelector('#status-modal')
let CALENDAL_MODAL= document.querySelector('#calendar-modal')

document.querySelector('#statusMenuBtn').addEventListener('click',()=>{
    $(statusMenu).toggleClass('hidden') 
})

document.querySelector('#FMenuBtn').addEventListener('click', ()=>{
    $(FMenu).toggleClass('hidden')
})
function openCalendar(){
    CALENDAL_MODAL.classList.remove('hidden')
}
$(document).ready(()=>{
    statusMenu.querySelectorAll('.li_').forEach(li=>{
        li.addEventListener('click',()=>{
            statusMenu.classList.add('hidden')
            if(selectedRows.length != 0 ){
                statusMode.mode = li.title
                if(li.title === 'DPT'){
                    openCalendar()
                }
                else{
                    MODAL.classList.remove('hidden')
                    MODAL.querySelector('#status-header').innerText =  `Set ${selectedRows.length} item(s) to ${li.innerText}`
                }
               
            }
            else{
                alert('No orders seleceted')
            }
        })
    })
    FMenu.querySelectorAll('li').forEach(li=>{
        li.addEventListener('click',()=>{
            statusMenu.classList.add('hidden')
           
            if(li.innerText === 'Receipt'){
                filter = 'receipt'
            }
            else if(li.innerText === 'Order Id'){
                filter = 'orderid'
            }
            else if(li.innerText ==='User'){
                filter = 'users'
            }else if(li.innerText === 'Status'){
                filter = 'status'
            }
            else if(li.innerText === 'Date'){
                filter = 'date'
            }
            $(location).attr("href","/inKO/page?number=" + page + '&&filter='+filter)            
        })
    })
    let options ={
        color :'danger',
        type  :'datetime',
        labelFrom: "Departure",
        labelTo: "Arrival"
    }
    var calendars = bulmaCalendar.attach('[type="date"]', options);

    for(var i = 0; i < calendars.length; i++) {
        calendars[i].on('select', date => {
            dates =  date
        });
    }
    var element = document.querySelector('#my-element');
    if (element) {
        element.bulmaCalendar.on('select', function(datepicker) {
        });
    }
  
})

function closeModal(){
    MODAL.classList.add('hidden')
    selectedRows = []
    users= []
    numbers = []
    statusMode.mode = ''
    document.querySelectorAll('.table-row')
    .forEach(row=>{
        if(row.classList.contains('selected_border')){
            row.classList.remove('selected_border')
        }
    })
}
function changeStatus(){
    document.querySelector('#status-change').disabled = true
    fetch('/change/status/', {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            statusMode : statusMode.mode,
            selectedRows : selectedRows, 
            orderJourney : orderJourney,
            locations : locations,
            users : users,
            numbers :numbers
        })
    })
    .then(res=>{
        document.querySelector('#status-change').disabled = false
        document.querySelector('#calendar-save').disabled = false;


        return  res.json()
    })
    .then((res)=>{

        if(res.statusMode){
            $(location).attr("href","/inKO/page?number=" + page + '&&filter='+filter)            

        }
        else{
            alert('An error occured')
            $(location).attr("href","/inKO/page?number=" + page + '&&filter='+filter)            

        }
    })
    .catch(err=>console.log)
}
function postDepartation(){
    if (dates != null){
        let START_ = dates.data.date.start.toString()
        let END_  = dates.data.date.end.toString()
        
        let startDateArr = START_.split(' ').splice(0,3)
        let endDateArr =  END_.split(' ').splice(0,3)
        let startTimeArr =  START_.split(' ')[4]
        let endTimeArr = END_.split(' ')[4]

        let startDate =  ''
        for(i in startDateArr){
            startDate = startDate  + startDateArr[i]+ ' '
        }

        let endDate =  ''
        for(i in endDateArr){
            endDate = endDate  + endDateArr[i]+ ' '
        }
        
        let startTime =  ''
        for(i in startTimeArr){
            startTime = startTime + startTimeArr[i]
        }

        let endTime =  ''
        for(i in endTimeArr){
            endTime = endTime +  endTimeArr[i]
        }
        orderJourney.startDate = startDate
        orderJourney.endDate = endDate
        orderJourney.startTime = startTime
        orderJourney.endTime =endTime

        locations.from = CALENDAL_MODAL.querySelector('#from').value
        locations.to = CALENDAL_MODAL.querySelector('#to').value
        
        document.querySelector('#calendar-save').disabled = true
        changeStatus()
    }
    else{
        alert('Select dates')
    }
}
function closeCalendar(){
    let MODAL = document.querySelector('#calendar-modal')
    MODAL.classList.add('hidden')
    orderJourney.endDate = ''
    orderJourney.startDate  = ''
    orderJourney.startTime = ''
    orderJourney.endDate = ''
    locations.to = ''
    locations.from = ''
}

