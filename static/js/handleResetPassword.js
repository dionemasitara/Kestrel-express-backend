let FORM = document.querySelector('#loginForm')
let SUCCESS = FORM.querySelector('#update-success')
let FAIL = FORM.querySelector('#update-fail')
let PASSWORDNOMATCH = FORM.querySelector('#password-no-match')
let THEBTN = FORM.querySelector('#reset-password')

FORM.addEventListener('submit', (e)=>{
    e.preventDefault()
    let password = FORM.querySelector('#password').value
    let confirmPassword  =  FORM.querySelector('#password3').value

    if(password != confirmPassword){
        PASSWORDNOMATCH.classList.remove('hidden')
        setTimeout(()=>{
            PASSWORDNOMATCH.classList.add('hidden')
        },3500)
    }
    else{
        THEBTN.disabled = true
        fetch('/change/password/', {
            method : 'POST',
            headers: {
                "Accept":"application/json, text/plain, */* ",
                "Content-type":"application/json"
            },
            body : JSON.stringify({
                id : e.target.z.value,
                password : password
            })
        })
        .then(res=>{
            THEBTN.disabled = false
            return  res.json()
        })
        .then((res)=>{
            if(res.statusMode == true){
              
              SUCCESS.classList.remove('hidden')
              setTimeout(()=>{
                SUCCESS.classList.add('hidden')
              },3500)
    
            }
            else if(!res.statusMode){
                FAIL.classList.remove('hidden')
              setTimeout(()=>{
                FAIL.classList.add('hidden')
              },3500)
    
            }
        })
        .catch(err=>{
            FAIL.classList.remove('hidden')
            setTimeout(()=>{
              FAIL.classList.add('hidden')
            },3500)
        })
    }
})