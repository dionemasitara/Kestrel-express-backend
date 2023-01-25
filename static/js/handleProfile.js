let success =  document.querySelector('#update-success')
let fail = document.querySelector('#update-fail')

document.querySelector('#change-username')
.addEventListener('click',(e)=>{
    e.preventDefault()
    fetch('/change/admin/username', 
    {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            username : document.querySelector('#occ').value
        })
    })
    .then(res=>res.json())
    .then(res=>{
      if(res.update){
        success.classList.remove('hidden')
        setTimeout(()=>{
            success.classList.add('hidden')
        },4000)
      }
      else{
        fail.classList.remove('hidden')
        setTimeout(()=>{
            fail.classList.add('hidden')
        },4000)
      }
    })
    .catch(err=>{
        console.log(err)
        fail.classList.remove('hidden')
        setTimeout(()=>{
            fail.classList.add('hidden')
        },4000)
    })
})
document.querySelector('#change-password')
.addEventListener('click',(e)=>{
    e.preventDefault()
    fetch('/change/admin/password', 
    {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            oldPass : document.querySelector('#cpass').value,
            newPass : document.querySelector('#npass').value,
        })
    })
    .then(res=>res.json())
    .then(res=>{
        if (!res.password){
            document.querySelector('#passStatus').classList.add('hidden')
            if(res.update){
                success.classList.remove('hidden')
                setTimeout(()=>{
                    success.classList.add('hidden')
                },4000)
            }
            else{
            fail.classList.remove('hidden')
            setTimeout(()=>{
                fail.classList.add('hidden')
            },4000)
            }
        }
        else{
            document.querySelector('#passStatus').classList.remove('hidden')
        }
     
    })
    .catch(err=>{
        console.log(err)
        fail.classList.remove('hidden')
        setTimeout(()=>{
            fail.classList.add('hidden')
        },4000)
    })
})