$(document).ready(()=>{

    firebase.initializeApp(firebaseConfig);
    let FORM  =  document.querySelector('#upload-invoice')
    let FAIL = FORM.querySelector('#upload-fail')
    let SUCCESS = FORM.querySelector('#upload-success')
    let THEBTN = FORM.querySelector('#upload-btn')
    let RECEIPT = document.querySelector('#receiptN').innerHTML
    let NUMBER =  document.querySelector('#number').innerHTML
    let nt = document.querySelector('#uploadingTEXT')


    FORM.addEventListener('submit', (e)=>{
        e.preventDefault()
        THEBTN.disabled = true
        nt.classList.remove('hidden')
        var storage = firebase.storage();
        let file = e.target.invoice.files[0]
        var storageref=storage.ref();
        var thisref = storageref.child(file.type).child(file.name).put(file)
        thisref.on('state_changed',function(snapshot) {
        }, function(error) {
            FAIL.classList.remove('hidden')
            setTimeout(()=>{
                FAIL.classList.add('hidden')
            },3500)
            THEBTN.disabled = false
       }, function() {
        // Uploaded completed successfully, now we can get the download URL
        thisref.snapshot.ref.getDownloadURL().then(function(downloadURL) {
          fetch('/insert/quote/link', {
            method : 'POST',
            headers: {
                "Accept":"application/json, text/plain, */* ",
                "Content-type":"application/json"
            },
            body : JSON.stringify({
                id :parseInt(e.target.orderId.value),
                link :downloadURL,
                receipt : RECEIPT,
                number : NUMBER
            })
        })
        .then(res=>{
            THEBTN.disabled = false
            nt.classList.add('hidden')
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
         });
        });
       
    })
})
