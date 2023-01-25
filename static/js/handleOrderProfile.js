let SLIDER = document.querySelector('#discount-slider')
let DISCOUNT = document.querySelector('#discount')
let WEIGHT_INPUT = document.querySelector('#cargo-weight')
let WEIGHT_DISPLAY = document.querySelector('#weight')
let PRICE = null
let CARGO_WEIGHT = null

$(document).ready(()=>{
    DISCOUNT.innerHTML = SLIDER.value
    SLIDER.oninput = ()=>{
        DISCOUNT.innerHTML = SLIDER.value
        if (PRICE != null){
            WEIGHT_DISPLAY.innerHTML = PRICE - (PRICE * (parseInt(DISCOUNT.innerHTML) / 100))

        }
    }

    WEIGHT_INPUT.oninput = ()=>{
        let weight = parseFloat(WEIGHT_INPUT.value)
        if(weight === 5){
           PRICE = 45
        }
        else if(weight < 5 && weight >= 0){
            PRICE = weight * 8.50
        }
        else if(weight > 5){
            let reminder =  (weight % 5) * 8.50
            let diviant = (Math.floor((weight / 5)) * 45)
            PRICE = (reminder + diviant) 
        }


        if(parseInt(DISCOUNT.innerHTML) >= 1){
            WEIGHT_DISPLAY.innerHTML = PRICE - (PRICE * (parseInt(DISCOUNT.innerHTML) / 100))

        }
        else{
            WEIGHT_DISPLAY.innerHTML = PRICE

        }
    }
})
async function savePrice(id){
    let PRICE_SAVE_BTN = document.querySelector('#price-save')
    let SUCCESS = document.querySelector('#update-success')
    let FAIL  = document.querySelector('#update-fail')
    let NUMBER = document.querySelector('#number').innerHTML
    PRICE_SAVE_BTN.disabled = true

    await fetch('/save/price/', {
        method : 'POST',
        headers: {
            "Accept":"application/json, text/plain, */* ",
            "Content-type":"application/json"
        },
        body : JSON.stringify({
            id : id,
            weight : parseFloat(WEIGHT_INPUT.value),
            price : PRICE === null ? (0) : PRICE,
            numbers : [NUMBER]
        })
    })
    .then(res =>{
        PRICE_SAVE_BTN.disabled = false
        return res.json()
    })  
    .then(res=>{
        if(res.statusMode){
            FAIL.classList.add('hidden')
            SUCCESS.classList.remove('hidden')
            setTimeout(()=>{
                SUCCESS.classList.add('hidden')
            },3000)
        }
        else{
            SUCCESS.classList.add('hidden')
            FAIL.classList.remove('hidden')
            setTimeout(()=>{
                FAIL.classList.add('hidden')
            },3000)
        }
    })
    .catch(err=>{
        console.log(err)
        SUCCESS.classList.add('hidden')
        FAIL.classList.remove('hidden')
        setTimeout(()=>{
            FAIL.classList.add('hidden')
        },3000)
    })
}