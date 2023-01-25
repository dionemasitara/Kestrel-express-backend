let loginIn= async(values) =>{
    await fetch('/admin/login', {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            username : values.username,
            password : values.password
        })
    })
    .then(res=>res.json())
    .then(res=>{
        if(!res.err){
            if(res.login){
                LOGINFORM.querySelector('.noAccount').classList.add('hidden')
                $(location).attr("href","/home/")
               }
               else{
                LOGINFORM.querySelector('.noAccount').classList.remove('hidden')
               }
        }
        else{
            LOGINFORM.querySelector('.errorOccured').classList.remove('hidden')

        }
    })
    .catch(err=>{
        LOGINFORM.querySelector('.errorOccured').classList.remove('hidden')
    })
}

let LOGINFORM = document.querySelector('#loginForm')
LOGINFORM.addEventListener('submit',(e)=>{
    e.preventDefault()
    let VALID  = false
    LOGINFORM.querySelectorAll('.required')
    .forEach(input=>{
        if(input.value.length != 0){
            input.style.borderColor = '#ccc'
            VALID = true
        }
        else{
            input.style.borderColor = '#8b0000'
            VALID = false
      
        }
    })
    if(VALID){
        loginIn({
            username: e.target.username.value,
            password : e.target.password.value
        })
    }
})
//<!--  -->
