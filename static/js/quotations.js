let filter = ''
let page;
let prev;
let next;
let NAV_PREV  = document.querySelector('#nav-prev')
let NAV_NEXT =  document.querySelector('#nav-next')
let FMenubtn = document.querySelector('#FMenuBtn')
let FMenu = document.querySelector('#FMenu')



FMenubtn.addEventListener('click', ()=>{
    if(FMenu.classList.contains('hidden')){
        FMenu.classList.remove('hidden')
    } 
    else{
        FMenu.classList.add('hidden')
    }
})
FMenu.querySelectorAll('li').forEach(li=>{
    li.addEventListener('click',()=>{
        FMenu.classList.add('hidden')
       
        if(li.innerText === 'New'){
            filter = 'new'
        }
        else if(li.innerText === 'Old'){
            filter = 'old'
        }
       
        $(location).attr("href","/quotations/page?number=" + page + '&&filter='+filter)            
    })
})
function handlePagination(current, prev_, next_){
    page = current
    prev = prev_
    next = next_

}
$(document).ready(()=>{
    if(NAV_PREV != null){
        NAV_PREV.addEventListener('click', ()=>{
            page = prev
            $(location).attr("href","/quotations/page?number=" + page + '&&filter='+filter)            

        
        })
    }
    if(NAV_NEXT != null){
        NAV_NEXT.addEventListener('click', ()=>{
            page = next
            $(location).attr("href","/quotations/page?number=" + page + '&&filter='+filter)            

        
        })
    }
   
    
})
