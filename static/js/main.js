document.querySelector('.mobile-nav-toggle')
.addEventListener('click',()=>{
    $('body').toggleClass('mobile-nav-active');
    $('.mobile-nav-toggle i').toggleClass('bi bi-x');
})

let searchBox = document.querySelector('.search-results')

async function deleteUser(user_id){
    await fetch('/delete/user', {
        method : 'DELETE',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            user_id: user_id
        })
    })
    .then(res=>{
        let OVERLAY_ALERT = document.querySelector('#delete-modal').querySelector('.ke-alert')
        OVERLAY_ALERT
        .querySelector('#user-delete').disabled = false
        return res.json()
    })
    .then(res=>{
        if(res){
            document.querySelector('#deletionErr').classList.add('hidden')
            $(location).attr("href","/users?page=1&&sort=new")                    

        }
    })
    .catch(err=>{
        console.log(err)
        document.querySelector('#deletionErr').classList.remove('hidden')
    })
}
async function deleteOrder(id){
    await fetch('/delete/order', {
        method : 'DELETE',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            id: id
        })
    })
    .then(res=>res.json())
    .then(res=>{
        if(res.deletionStatus){
            $(location).attr("href","/inKO/page?number=" + page + '&&filter='+filter)            

        }
    })
    .catch(err=>{
        alert('An ERROR occured')
    })
}
async function addUser(values){
    await fetch('/create/user/', {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            values
        })  
    })
    .then(res=>res.json())
    .then(res=>{
        console.log(res)
        if(res.response.email){
            alert('Email in Use [!]')
        }
        if(res.response.status){
            if(!res.response.error){
                $(location).attr("href","/users?page=1&&sort=new")                    
            }
            else{
                alert('An Error occured try again later')
            }
        }
    })
    .catch(err=>{
        console.log(err)
    })
}
async function handleSearch(table, URL){
    let genResult = (heading, infor, id)=>{
        return `  
        <div class="result">
            <a href="${URL}?id=${id}" target= '_blank' class="textBold primaryText noMarg mTop15">${heading}</a>
            <p class="secondaryText noMarg textSmall">${infor}</p>
        </div>`
    }
   
    let search_ = document.querySelector('#search-bar').value
    let resultsContainer = document.querySelector('.s_results')

    fetch('/search/'+table+'?search'+'='+search_)
    .then(response => {
        searchBox.classList.remove('hidden')
        $(resultsContainer).empty()
        return response.json()
    })
    .then(response=>{
        if(response.results_ !=0){
            response.results_.map((result)=>{
                $(resultsContainer).prepend(genResult(result.heading, result.infor, result.id))
            })
        }
        else{
            $(resultsContainer).empty()
            searchBox.querySelector('.nun').classList.remove('hidden')
        }
    })
    .catch(err=>{
        console.log(err)
        alert('Network Error!')
    })

}
function handleOverlay(MODE, component){
    if(MODE === 'OPEN'){
        document.querySelector(component).classList.remove('hidden')
    }
    else if(MODE === 'CLOSE'){
        document.querySelector(component).classList.add('hidden')

    }
}
function handleDeletion(user_id){
    handleOverlay('OPEN', '#delete-modal')
    let OVERLAY_ALERT = document.querySelector('#delete-modal').querySelector('.ke-alert')
    OVERLAY_ALERT
    .querySelector('#user-delete')
    .addEventListener('click', ()=>{
        OVERLAY_ALERT
        .querySelector('#user-delete').disabled  = true
        deleteUser(user_id)
    })

    OVERLAY_ALERT
    .querySelector('#user-cancel')
    .addEventListener('click', ()=>{
      handleOverlay('CLOSE','#delete-modal')
    })

}
function handleOrderDeletion(id){
    handleOverlay('OPEN', '#order-delete-modal')
    let OVERLAY_ALERT = document.querySelector('#order-delete-modal').querySelector('.ke-alert')
    OVERLAY_ALERT
    .querySelector('#order-delete')
    .addEventListener('click', ()=>{
        deleteOrder(id)
    })

    OVERLAY_ALERT
    .querySelector('#order-cancel')
    .addEventListener('click', ()=>{
      handleOverlay('CLOSE','#order-delete-modal')
    })
}
function handleAddition(){
    handleOverlay('OPEN', '#add-user-model')
    let ADD_USER_MODAL = document.querySelector('#add-user-model')
    let au_form = ADD_USER_MODAL.querySelector('form')
    au_form.addEventListener('submit', (e)=>{
        e.preventDefault()
        let VALID = true
        au_form.querySelectorAll('.required').forEach( input=>{
            if(input.value.length != 0 ){
                input.style.borderColor = '#ccc'
                VALID = true
            }
            else{
                VALID =false
                input.style.borderColor = '#8b0000'
            }
        })
        if (VALID){
            let values ={
                fullname: e.target.fullname.value, 
                address : e.target.address.value,
                email : e.target.email.value,
                number : e.target.number.value,
                date:  e.target.date.value.length != 0  ? (parseInt(e.target.date.value)): (0),
                month : e.target.month.value.length != 0  ? (parseInt(e.target.month.value)): (0),
                year  : e.target.year.value.length != 0  ? (parseInt(e.target.year.value)): (0),
                occupation : e.target.occupation.value,
                password : '0000',
            }
            addUser(values)
        }
    })
}
function closeSearchBox(){
    searchBox.classList.add('hidden')
}
function closeAddUserModal(){
    let ADD_USER_MODAL = document.querySelector('#add-user-model')
    let au_form = ADD_USER_MODAL.querySelector('form')
    au_form.querySelectorAll('input').forEach((input)=>{
        input.value = ''
    })
    handleOverlay('CLOSE', '#add-user-model')
}