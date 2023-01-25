let page;
let prev;
let next;
let FILTER = 'new'
let NAV_PREV  = document.querySelector('#nav-prev')
let NAV_NEXT =  document.querySelector('#nav-next')

function handlePagination(current, prev_, next_){
    page = current
    prev = prev_
    next = next_

}
$(document).ready(()=>{
    NAV_PREV.addEventListener('click', ()=>{
        page = prev
        $(location).attr("href",`/users?page=${page}&&sort=${FILTER}`)            
    
    })
    NAV_NEXT.addEventListener('click', ()=>{
        page = next
        $(location).attr("href",`/users?page=${page}&&sort=${FILTER}`)            

    
    })
})
