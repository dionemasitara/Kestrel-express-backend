let FMenu = document.querySelector('#FMenu')


$(document).ready(()=>{
    document.querySelector('#FMenuBtn')
    .addEventListener('click', ()=>{
        $(FMenu).toggleClass('hidden')
    })
})
FMenu.querySelectorAll('li').forEach(li=>{
    li.addEventListener('click',()=>{
       
        if(li.innerText === 'New Users'){
            FILTER = 'new'
        }
        else if(li.innerText === 'Old Users'){
            FILTER = 'old'
        }
        $(location).attr("href",`/users?page=${page}&&sort=${FILTER}`)            
    })
})
