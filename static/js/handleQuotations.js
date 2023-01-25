let THEBTN = document.querySelector('#response-btn');
let SUCCESS = document.querySelector('#update-success')
let FAIL = document.querySelector('#update-fail')

THEBTN.addEventListener('click', ()=>{
    THEBTN.disabled = true
    let PRICE = document.querySelector('#price').value
    let RESPONSE  = document.querySelector('#response').value
    let QUOTATION = document.querySelector('#zag').value
    let NUMBER = document.querySelector('#number').innerHTML
    let receiptN = document.querySelector('#receiptN').innerHTML

    fetch('/update/quotation', {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
           price : PRICE,
           response : RESPONSE,
           id : QUOTATION,
           NUM  :NUMBER,
           receipt :receiptN
        })
    })
    .then(res=>{
        THEBTN.disabled = false
        return  res.json()
    })
    .then((res)=>{
        if(res.statusMode){
          SUCCESS.classList.remove('hidden')
          setTimeout(()=>{
            SUCCESS.classList.add('hidden')
          },3500)

        }
        else{
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
})