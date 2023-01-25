let page;
let prev;
let next;
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
        $(location).attr("href","/payments?page="+page)            
    
    })
    NAV_NEXT.addEventListener('click', ()=>{
        page = next
        $(location).attr("href","/payments?page="+page)            

    })
})
