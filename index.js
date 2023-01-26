const express = require("express")
const body_parser = require("body-parser")
const path = require("path")
const mysql = require("mysql")
var paypal = require('paypal-rest-sdk');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
let  { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
let { getApps, initializeApp } = require("firebase/app");
let firebaseConfig = require("./Helpers/FIREBASE")


const {check, validationResult, body } =  require("express-validator")
let multer = require('multer')
let cors = require('cors')
let app =  express()
let Helpers = require('./Helpers/Helpers')
let NoodeMailer = require('./Helpers/NodeMailer')
let bcyrpt = require('bcrypt')




app.use(express.static('static')); 
app.use(express.static('product_images'))
app.use("/css",express.static(__dirname+"static/css"))
app.use("/js",express.static(__dirname+"static/js"))
app.use("/fonts",express.static(__dirname+"static/fonts"))
app.use('/product_images', express.static(__dirname+'product_images'))

app.set("views", path.join(__dirname, "templates"));
app.set('view engine', 'ejs');
app.set('view options',{layout :false});

const urlenCoded = body_parser.urlencoded({extended: true})
app.use(body_parser.json());

app.use(cors({
    origin : '*'
})) 

paypal.configure({
    'mode': 'live', //sandbox or live
    'client_id': 'AdBWL9FTBGLwDGawrW1IaTdNakkANhONnzzI33Cfu-UWfD_EWuis3i29xWwjPf-5bJMW2rTomX-nxzs8',
    'client_secret': 'EKrDLHrGw5GHIfxRYAhWHrxgGS7Dy555jkiZKsfpEhFPROYAYE8rKzT36lUT11Kmpzq574bX1q2YPEX5'
});
if (!getApps().length) {
    initializeApp(firebaseConfig);
}
  

//Set html view engine
app.set("views", path.join(__dirname, "pages"));
app.set('view engine', 'ejs');
app.set('view options',{layout :false});

let pool = mysql.createPool({
    host:"92.204.220.137",
    port:"3306",
    user:"ke_root",
    password:"GOn,]8M%9UFk",
    database:"kestrel_express_admin",
    multipleStatements  : true
})    
/*  let pool = mysql.createPool({
    host:"localhost",
    port:"3306",
    user:"root",
    password:"programmerslivelonger",
    database:"kestrel_express",
    multipleStatements  : true
}) */

let checkEmail =  (email)=> {
    return new Promise((resolve, reject) => {
        try{
            pool.getConnection((error, con)=>{
                if(!error){
                    con.query(`SELECT * FROM emails WHERE email = "${email}"`, (error_, rows, fields)=>{
                        if(!error_){
                            if(rows.length > 0){
                                return reject(true)
                            }
                            else{
                               return resolve(false)
                            }
                        }
                    })
                    con.release()
                }
                else{
                    console.log(error)
                }
               
                // generate Logger here
           })    
        }
        catch (e) {
            console.log(e)
            reject(e)
        }
    }) 
}

PORT_  = process.env.PORT || 1927

app.listen(PORT_, () => console.info("http://localhost:" + PORT_))

const invoice_upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
  });

app.get('/', (req, res)=>{
    res.render('login')
})
app.get('/home/', (req, res)=>{
    pool.getConnection(async(error, con)=>{
        if(!error){
            let report = await Helpers.genIndexReport(con)      
            con.release()
            res.render('index',{
                reports: report.results
            }) 
        }
        else{
            console.log(error)
        }

    })
})
app.get('/users/', (req, res)=>{
    pool.getConnection(async(err, con)=>{
        if(!err){
            let PAGE_NUMBER = parseInt(req.query.page)
            let SORT = req.query.sort === 'new' ? ('DESC') : ('ASC')
            let results =  await Helpers.getUsers(PAGE_NUMBER, 6, con, SORT)
            
           con.release()
            res.render('users',{
               results : results.results,
               pagination : {
                current : PAGE_NUMBER,
                prev : PAGE_NUMBER - 1 == 0  ? 1 : PAGE_NUMBER - 1,
                next :  results.results.length >= 10 ? PAGE_NUMBER + 1 : 0
            }
            })
        }
        else{
            console.log(err)
        }
      
    })
})
app.get('/get/infor/for', (req, res)=>{
    let user_id = req.query.id
    pool.getConnection(async(error, con)=>{
        if(!error){
            let generalInformation = await Helpers.getUserInformation(user_id, con)
            await Helpers.getOrders(user_id,1, con)
            .then((orders)=>{  
                if(orders.status != false){
                   
                    res.render('userProfile',{
                        general : generalInformation,
                        orders :orders.orders,
                        payments : orders.payments,
                        init : generalInformation.userInformation.name[0].toUpperCase()
                    })
                }
                else{
                  
                    res.render('userProfile',{
                        general : generalInformation,
                        orders :[],
                        init : generalInformation.userInformation.name[0].toUpperCase()
                    })
                }
            })
            con.release()
        }
        else{
           
            console.log('ERROR AT TRYING TO CONNECT [GET USER INFOR FUNCTION] .> ' + error)
        }
    }) 

})
app.get('/KO/', (req, res)=>{
    let PAGE_NUMBER = parseInt(req.query.page)
    pool.getConnection(async(error, con)=>{
        if(!error){
           await Helpers.getCompleteOrders(PAGE_NUMBER, con)
           .then(orders=>{
            res.render('ko',{
                orders : orders.orders,
                pagination : {
                    current : PAGE_NUMBER,
                    prev : PAGE_NUMBER - 1 == 0  ? 1 : PAGE_NUMBER - 1,
                    next :  orders.orders.length >= 10 ? PAGE_NUMBER + 1 : 0
                }
            })
           })
           con.release()
        }
        else{
            console.log('ERROR AT TRYING TO CONNECT [USER UPDATE PASSWORD FUNCTION] .> ' + error)
        }
       

    })
})
app.get('/inKO/page', (req, res)=>{
    let PAGE_NUMBER = parseInt(req.query.number)
    let FILTER_ = req.query.filter
    let FILTER = '' 

    if(FILTER_ === 'receipt'){
        FILTER = 'receiptNumber'
    }
    else if(FILTER_=== 'orderid'){
        FILTER = 'productJobsID'
    }
    else if(FILTER_ ==='users'){
        FILTER = 'belongs_to'

    }else if(FILTER_ === 'status'){
        FILTER = 'status'
    }
    else if(FILTER_ === 'date'){
        FILTER = 'jobDate'
    }
  
    pool.getConnection(async(error, con)=>{
        if(!error){
           await Helpers.getIncompleteOrders(PAGE_NUMBER, FILTER, con)
           .then(orders=>{
            res.render('inKo',{
                orders : orders.orders,
                pagination : {
                    current : PAGE_NUMBER,
                    prev : PAGE_NUMBER - 1 == 0  ? 1 : PAGE_NUMBER - 1,
                    next :  orders.orders.length >= 10 ? PAGE_NUMBER + 1 : PAGE_NUMBER
                }
            })
           })
           con.release()
        }
        else{
            console.log('ERROR AT TRYING TO CONNECT [USER UPDATE PASSWORD FUNCTION] .> ' + error)
        }
    })
})
app.get('/payments/', (req, res)=>{
    pool.getConnection(async(err, con)=>{
        let PAGE_NUMBER = parseInt(req.query.page)
        let SORT ='DESC'
        let results =  await Helpers.getPayments(PAGE_NUMBER, 10, con, SORT)
        
       con.release()
       res.render('payments',{
           results : results.payments,
           pagination : {
            current : PAGE_NUMBER,
            prev : PAGE_NUMBER - 1 == 0  ? 1 : PAGE_NUMBER - 1,
            next :  results.payments.length >= 10 ? PAGE_NUMBER + 1 : 0
        }
        })
    })
   
})
app.get('/profile/', (req, res)=>{
    res.render('profile')
})
app.get('/get/infor/', (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            con.query(`SELECT * FROM users WHERE user_id = "${req.query.id}"`, (err, rows)=>{
                if(!err){
                    if (rows.length > 0){
                        let results = {}
                        results.fullname = rows[0].fullname
                        res.status(200).json({
                            results
                        })
                    }
                 
                }
            })
            con.release()
        }
    })
})
app.get('/get/jobs/', (req, res)=>{
    let userId = req.query.userzag
    let page =  parseInt(req.query.page)
    let limit = 6;
    let query = `SELECT * FROM productjobs WHERE belongs_to = ${userId} order by productjobs.productJobsID DESC `

    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    pool.getConnection((error, con)=>{
        try{
            if(!error){
                con.query(query, (err, rows)=>{
                    if(!err){
                        let new_rows  = rows.slice(startIndex, endIndex)
                        let simplified_row = []
                        new_rows.map((row)=>{
                            let job = {}
                            job.jobId = row.productJobsID;
                            job.transportationMode = row.transportationMode;
                            job.receipt =  row.receiptNumber;
                            job.date = row.jobDate
                            job.status = row.status_
                            simplified_row.push(job)
                        })
                    
                        res.status(200).json({
                            jobs: simplified_row,
                            'Message': true
                        })
                    }
                    else{
    
                        console.log(err)
                        res.status(500).json({
                            'Message' : false
                        })
                    }
                })
                con.release()
            }
            else{
                console.log(error)
                res.status(500).json({
                    'Message' : false
                })
            }
        }
        catch (e){
            console.log('Error')
        }
        
    })
})
app.get('/get/status/jobs', (req, res)=>{
    let userId = req.query.userzag
    let page =  req.query.page;
    let mode = req.query.mode
    let expression = mode === 'inko' ? ('!=') : '='
    let limit = 6;
    let query = `SELECT * FROM productjobs WHERE belongs_to = ${userId} AND status_ ${expression} 'KO' order by productjobs.productJobsID DESC `

    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    pool.getConnection((error, con)=>{
        try{
            if(!error){
                con.query(query, (err, rows)=>{
                    if(!err){
                        let new_rows  = rows.slice(startIndex, endIndex)
                        let simplified_row = []
                        new_rows.map((row)=>{
                            let job = {}
                            job.jobId = row.productJobsID;
                            job.transportationMode = row.transportationMode;
                            job.receipt =  row.receiptNumber;
                            job.date = row.jobDate
                            job.status = row.status_
                            simplified_row.push(job)
                        })
                    
                        res.status(200).json({
                            jobs: simplified_row,
                            'Message': true
                        })
                    }
                    else{
    
                        console.log(err)
                        res.status(500).json({
                            'Message' : false
                        })
                    }
                })
        con.release()

            }
            else{
                console.log(error)
                res.status(500).json({
                    'Message' : false
                })
            }
        }
        catch (e){
            console.log('Error')
        }
     
        
    })
})
app.get('/get/payments/for', (req, res)=>{
    let userId = req.query.userzag
    let page =  req.query.page;
   
    let limit = 6;
    let query = `SELECT * FROM payments WHERE belongs_to = ${userId}  order by payment_id DESC `

    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    pool.getConnection((error, con)=>{
        try{
            if(!error){
                con.query(query, (err, rows)=>{
                    if(!err){
                        let new_rows  = rows.slice(startIndex, endIndex)
                        let simplified_row = []
                        new_rows.map((row)=>{
                            let payment = {}
                            payment.receipt = row.receipt;
                            payment.amount = row.amount;
                            payment.date =  row.date;
                            payment.pay_pal = row.pal_id != null ? row.pal_id : 'N\A'
                            simplified_row.push(payment)
                        })
                    
                        res.status(200).json({
                            jobs: simplified_row,
                            'Message': true
                        })
                    }
                    else{
    
                        console.log(err)
                        res.status(500).json({
                            'Message' : false
                        })
                    }
                })
                con.release()
            }
            else{
                console.log(error)
                res.status(500).json({
                    'Message' : false
                })
            }
        }
        catch (e){
            console.log('Error')
        }
      
        
    })
})
app.get('/get/quotations/for', (req, res)=>{
    let userId = req.query.userzag
    let page =  req.query.page;
   
    let limit = 6;
    let query = `SELECT * FROM quotations WHERE belongs_to = ${userId}  order by idquotations DESC `

    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    pool.getConnection((error, con)=>{
        try{
            if(!error){
                con.query(query, (err, rows)=>{
                    if(!err){
                        let new_rows  = rows.slice(startIndex, endIndex)
                        let simplified_row = []
                        new_rows.map((row)=>{
                            let quotation = {}
                            quotation.id =  row.idquotations
                            quotation.receipt = row.receiptNumber;
                            quotation.status = row.status_;
                            quotation.date =  row.jobdate;
                            simplified_row.push(quotation)
                        })
                    
                        res.status(200).json({
                            quotations: simplified_row,
                            'Message': true
                        })
                    }
                    else{
    
                        console.log(err)
                        res.status(500).json({
                            'Message' : false,

                        })
                    }
                })
                con.release()
            }
            else{
                console.log(error)
                res.status(500).json({
                    'Message' : false
                })
            }
        }
        catch (e){
            console.log('Error')
        }
        
    })
})
app.get('/get/user/profile', (req, res)=>{
    let user_id = req.query.id
    pool.getConnection(async(error, con)=>{
        if(!error){
            await Helpers.getUserInformation(user_id, con)
            .then(results=>{
                if(results.status){
                    res.status(200).json({
                        results
                    })
                }else{
                    res.status(500).json({
                        status : false
                    })
                }  
                
                con.release()
            })
        }
        else{
            console.log('ERROR WHEN CONNECTING [GETTING USER INFORMATION]' + error)
            
        }
    })
})
app.get('/view/order/for',(req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT * FROM productjobs WHERE productJobsID = ${req.query.id}
            `
            let results = {}
            let items = []
            con.query(query, (err, rows)=>{
                if(!err){
                    rows.map((row)=>{
                        let date = row.jobDate.toString()
                        let date_ = date.split('GM') 
                        results.CID = req.query.id
                        results.TMode = row.transportationMode
                        results.CType = row.cargoType
                        results.DName  = row.deliveryName
                        results.DMail= row.deliveryEmail
                        results.DId = row.deliveryNationalID
                        results.DNum = row.deliveryPhoneNumber
                        results.RNumber = row.receiptNumber
                        results.number = row.user_number === '' ? ('0') : row.user_number
                        results.date = date_[0]
                        results.status = row.status_
                        results.SDate = row.startDate === '' ? ('PENDING') : row.startDate
                        results.EDate = row.endDate=== '' ? ('PENDING') : row.endDate
                        results.STime = row.startTime === '' ? ('PENDING') : row.startTime
                        results.ETime = row.endTime  === '' ? ('PENDING') : row.endTime
                        results.from = row.from_ === '' ? ('PENDING') : row.from_
                        results.to = row.to_ === '' ? ('PENDING') : row.to_
                        results.price = row.price_ === null ? ('0') : row.price_
                    })
                    con.query(`
                    SELECT fullname from users WHERE user_id = ${rows[0].belongs_to};
                    SELECT * FROM job WHERE belongs_to_jobID = ${req.query.id}
                    `, (r, information)=>{
                        if(!r){
                            results.name = information[0][0].fullname 
                            information[1].map(item=>{
                                let result = {}
                                result.name =item.productName
                                result.desc = item.productDescription
                                result.quantity = item.productQuantity
                                result.image = item.imageLocation
                                result.jcdate = item.collectionDate
                                result.jctime = item.collectionTime
                                items.push(result)
                            })
    
                            res.render('orderProfile', {
                                results: results,
                                cart : items
                            })
                        }
                        else{console.log(r)}
                       
                    })
                }
                else{console.log(err)}
                
               
            })
          
            con.release()
        }
       
    })
   
})
app.get('/view/quotation/for',(req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT * FROM quotations WHERE idquotations = ${req.query.id}
            `
            let results = {}
            let items = []
            con.query(query, (err, rows)=>{
                if(!err){
    
                    rows.map((row)=>{
                        let date = row.jobdate.toString()
                        let date_ = date.split('GM') 
                        results.CID = req.query.id
                        results.from = row.from_
                        results.to = row.to_
                        results.RNumber = row.receiptNumber
                        results.number = row.number
                        results.date = date_[0]
                        results.status = row.status_
                        results.message = row.message 
                        results.price = row.est_price
                    })
                    con.query(`
                    SELECT fullname from users WHERE user_id = ${rows[0].belongs_to};
                    SELECT * FROM job WHERE belongs_to_jobID = ${req.query.id}
                    `, (r, information)=>{
                        if(!r){
                            results.name = information[0][0].fullname 
                            information[1].map(item=>{
                                let result = {}
                                result.name =item.productName
                                result.desc = item.productDescription
                                result.quantity = item.productQuantity
                                result.image = item.imageLocation
                                items.push(result)
                            })
    
                            res.render('viewQuotation', {
                                results: results,
                                cart : items
                            })
                        }
                        else{console.log(r)}
                       
                    })
                }
                else{console.log(err)}
                
                
            })
            con.release()
        }

    })
   
})
app.get('/get/order/for', (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT * FROM productjobs WHERE productJobsID = ${req.query.Jid};
            SELECT * FROM job WHERE belongs_to_jobID = ${req.query.Jid}
            `
            let results = {}
            let items = []
            con.query(query, (err, rows)=>{
                if(!err){
                    rows[0].map((row)=>{
                        results.CID = req.query.id
                        results.TMode = row.transportationMode
                        results.CType = row.cargoType
                        results.RNumber = row.receiptNumber
                        results.weight = row.weight_
                        results.status = row.status_
                        results.invoice = row.invoice
                        results.SDate = row.startDate === '' ? ('PENDING') : row.startDate
                        results.EDate = row.endDate=== '' ? ('PENDING') : row.endDate
                        results.STime = row.startTime === '' ? ('PENDING') : row.startTime
                        results.ETime = row.endTime  === '' ? ('PENDING') : row.endTime
                        results.from = row.from_ === '' ? ('PENDING') : row.from_
                        results.to = row.to_ === '' ? ('PENDING') : row.to_
                        results.price = row.price_ === null ? ('0') : row.price_
                        results.payment_status = row.payment_status
                    })
                    rows[1].map(item=>{
                        let result = {}
                        result.name =item.productName
                        result.quantity = item.productQuantity
                        result.image = item.imageLocation
                        result.id = item.idjob
                        items.push(result)
                    })
                    res.status(200).json({
                        results: results,
                        cart : items,
                        error : false
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        error : true
                    })
                }
    
                
            })
            con.release()

        }
        else{
            console.log(error)
                    res.status(500).json({
                        error : true
                    })
        }
       
      
    })
})
app.get('/get/quote/for', (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT * FROM quotations WHERE idquotations = ${req.query.Qid};
            SELECT * FROM job WHERE belongs_to_jobID = ${req.query.Qid}
            `
            let results = {}
            let items = []
            con.query(query, (err, rows)=>{
                if(!err){
                    rows[0].map((row)=>{

                        results.RNumber = row.receiptNumber
                        results.status = row.status_
                        results.date = ''
                        results.message = row.message,
                        results.response = row.response,
                        results.invoice=  row.invoice
                        results.from = row.from_ 
                        results.to = row.to_ 
                        results.price = row.est_price 
        
                    })
                    rows[1].map(item=>{
                        let result = {}
                        result.name =item.productName
                        result.quantity = item.productQuantity
                        result.image = item.imageLocation
                        result.id = item.idjob
                        items.push(result)
                    })
                    res.status(200).json({
                        results: results,
                        cart : items,
                        error : false
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        error : true
                    })
                }
    
                
                con.release()
            })
        }
        else{
            console.log(error)
                    res.status(500).json({
                        error : true
                    })
        }
       
      
    })
})
app.get('/search/orders/' , (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT productjobsID, status_, belongs_to, receiptNumber
            FROM productjobs 
            WHERE receiptNumber LIKE '%${req.query.search}%' and belongs_to = ${req.query.id}
            `
            con.query(query, (err, rows)=>{
                if(!err){
                    let results = []
                    rows.map(row=>{
                        let result = {
                            receiptNumber : row.receiptNumber,
                            status  : row.status_,
                            id : row.productjobsID,
                            belongs_to  : row.belongs_to
                        }
                        results.push(result)
                    })
                    res.status(200).json({
                        results_  :results
                    })
                    
                  
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        results_  :[]
                    })
                }
                con.release()
            })
        }
        else{
            
            console.log(error)
            res.status(500).json({
                results_  :[]
            })
        }

    })
})
app.get('/get/cart/for', (req, res)=>{
    pool.getConnection((error,con)=>{
        if(!error){
            let query = `
                SELECT idjob, productName, productDescription, productQuantity, imageLocation FROM job WHERE idjob = ${req.query.id}
            `
            con.query(query, (err, rows)=>{
                if(!err){
                    res.status(200).json({
                        results: rows[0],
                        error : false
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        error : true
                    })
                }
                con.release()
            })
        }
    })
})
app.get('/get/cart/items', (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `SELECT * FROM job WHERE belongs_to_jobID = ${req.query.id}`
            con.query(query, (err, rows)=>{
                if(!err){
                    let items = []
                    rows.map(item=>{
                        let result = {}
                        result.name =item.productName
                        result.quantity = item.productQuantity
                        result.image = item.imageLocation
                        result.id = item.idjob
                        items.push(result)
                    })
                    res.status(200).json({
                        results  : items,
                        error : false
                    })
                    

                }
                else{
                    console.log(err)
                    res.status(500).json({
                        error : true
                    })
                }
                con.release()
            })
        }
        else{
            res.status(500).json({
                error : true
            })
            console.log(Error)
        }
    })
})
app.get('/search/inko' , (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT productjobsID, status_, receiptNumber
            FROM productjobs 
            WHERE receiptNumber LIKE '%${req.query.search}%'
            `
            con.query(query, (err, rows)=>{
                if(!err){
                    let results = []
                    let new_rows = rows.splice(0,5)
                    new_rows.map(row=>{
                        let result = {
                            heading : row.receiptNumber,
                            infor  : row.status_,
                            id : row.productjobsID,
                        }
                        results.push(result)
                    })
                    res.status(200).json({
                        results_  :results
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        results_  :[]
                    })
                }

            })
            con.release()

        }
        else{
            console.log(error)
            res.status(500).json({
                results_  :[]
            })
        }

    })
})
app.get('/search/users' , (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            SELECT user_id, fullname, phone_number
            FROM users 
            WHERE fullname LIKE '%${req.query.search}%'
            `
            con.query(query, (err, rows)=>{
                if(!err){
                    let results = []
                    let new_rows = rows.splice(0,5)
                    new_rows.map(row=>{
                        let result = {
                            heading : row.fullname,
                            infor  : row.phone_number,
                            id : row.user_id,
                        }
                        results.push(result)
                    })
                    res.status(200).json({
                        results_  :results
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        results_  :[]
                    })
                }

            })
            con.release()

        }
        else{
            console.log(error)
            res.status(500).json({
                results_  :[]
            })
        }

    })
})
app.get('/payment/form', (req, res)=>{
    let PRICE = req.query.price
    let RECEIPT = req.query.receipt
    let STATUS = req.query.status
    let ID =  req.query.id
    let belongs_to =req.query.belongsto

    res.render('paymentForm', {
        price : PRICE,
        receipt  :RECEIPT,
        status : STATUS,
        id: ID,
        belongs_to : belongs_to
    })
})
app.get('/paypal/payments',(req, res)=>{

    let PRICE = parseFloat(req.query.price)
    let RECEIPT = req.query.receipt

    var KE_PAYMENT_FORM = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "https://kestrelexpress.onrender.com/payment/success?price="+PRICE+"&id="+req.query.id+"&bt="+req.query.bt,
            "cancel_url": "https://kestrelexpress.onrender.com/payment/failure"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Cargo " + RECEIPT,
                    "sku": RECEIPT,
                    "price": PRICE,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": PRICE
            },
            "description": "This is the payment description."
        }]
    };
    
    try{
        paypal.payment.create(KE_PAYMENT_FORM, function (error, payment) {
            if (error) {
                console.log(error.response.details[0]);
            } else {
                payment.links.map(link=>{
                    if(link.rel === 'approval_url'){
                        res.redirect(link.href)
                    }
                })
            }
        });
    }
    catch(e){

    }
    
})
app.get('/payment/success', (req, res)=>{
    PAYER_ID = req.query.PayerID
    PAYMENT_ID = req.query.paymentId

    let KE_FINAL_TRANSACTIONS = {
        'payer_id': PAYER_ID,
        'transactions': [
            {
                'amount' : {
                    'currency' : 'USD',
                    'total' : parseFloat(req.query.price)
                }
            }
        ]
    }
    try{
        paypal.payment.execute(PAYMENT_ID, KE_FINAL_TRANSACTIONS, (err, payment)=>{
            if(!err){
                res.render('success')
                let PAYMENT_INFORMATION = {}
                PAYMENT_INFORMATION.paypal_id = payment.id
                PAYMENT_INFORMATION.state = payment.state
                PAYMENT_INFORMATION.payer_email = payment.payer.payer_info.email
                PAYMENT_INFORMATION.payer_fullname = payment.payer.payer_info.first_name + ' ' + payment.payer.payer_info.last_name
                PAYMENT_INFORMATION.amount = payment.transactions[0].amount.total
                PAYMENT_INFORMATION.payee_email = payment.transactions[0].payee.email
                PAYMENT_INFORMATION.description = payment.transactions[0].description
                PAYMENT_INFORMATION.receipt = payment.transactions[0].item_list.items[0].sku
                PAYMENT_INFORMATION.date = payment.create_time
                PAYMENT_INFORMATION.belongs_to = parseInt(req.query.bt)
                PAYMENT_INFORMATION.receipt_id = parseInt(req.query.id)

                pool.getConnection(async(error, con)=>{
                    if(!error){
                        await Helpers.savePayment(PAYMENT_INFORMATION, con)
                        con.release()
                    }
                })
            }
            else{
                console.log(err)
            }
        })
    }
    catch(e){

    }
    
})
app.get('/payment/failure', (req, res)=>{
    res.render('failure')
})
app.get('/check/deletion', (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            con.query('SELECT fullname FROM users WHERE user_id = ' + parseInt(req.query.for), (err, row)=>{
                if (!err){
                    if(row.length != 0 ){
                        res.status(200).json({
                            deletion : false
                        })
                    }
                    else{
                        res.status(200).json({
                            deletion : true
                        })
                    }
                }
            })
        }
    })
})
app.get('/view/payment/for/',(req, res)=>{
    let id = req.query.id
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `SELECT * FROM PAYMENTS WHERE payment_id = ${id}`
            con.query(query, (err, rows)=>{
                if(!err){
                    res.render('invoice',{
                        amount : rows[0].amount,
                        receipt: rows[0].receipt,
                        receipt_id: rows[0].receipt_id,
                        payer_email : rows[0].payer_email,
                        payer_fullname: rows[0].payer_fullname,
                        payee_email : rows[0].payee_email,
                        description: rows[0].description,
                        date : rows[0].date,
                        pal_id: rows[0].pal_id
                    })
                }

            })
            con.release()
        }
    })

})
app.get('/quotations/page', (req, res)=>{
    let PAGE_NUMBER = parseInt(req.query.number)
    let FILTER_ = req.query.filter
    
    pool.getConnection(async(error, con)=>{
        if(!error){
           await Helpers.getQuotations(PAGE_NUMBER, FILTER_, con)
           .then(quotations=>{
            res.render('quotations',{
                quotations : quotations.quotations,
                pagination : {
                    current : PAGE_NUMBER,
                    prev : PAGE_NUMBER - 1 == 0  ? 1 : PAGE_NUMBER - 1,
                    next :  quotations.quotations.length >= 10 ? PAGE_NUMBER + 1 : PAGE_NUMBER
                }
            })
           })
           con.release()
        }
        else{
            console.log('ERROR AT TRYING TO CONNECT [USER UPDATE PASSWORD FUNCTION] .> ' + error)
        }
    })
})
app.get('/455f5rwwf/wsuwbHnGDObu/NISNhojpj', (req, res)=>{
    res.render('resetPassword',{
        user_zag:  req.query.zag
    })
})
app.post('/admin/login',urlenCoded, (req, res)=>{
    pool.getConnection((error,con)=>{
        if(!error){
            let query = `
            SELECT * FROM 
            admin WHERE 
            username = '${req.body.username}' 
            AND password_ = '${req.body.password}'
            `
            con.query(query, async(err, rows)=>{
                if(!err && rows.length != 0 ){
                    res.status(200).json({
                        err : false,
                        login :true
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        err : false,
                        login :false
                    })
                }

            })
        con.release()
        }
        else{
            res.status(500).json({
                err : true,
                login :false
            })
        }

    })
})
app.post('/change/admin/username', urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            con.query(`
            UPDATE admin
            SET username = '${req.body.username}'
            WHERE admin_id = ${123}`,(err, rows)=>{
                if(!err){
                    res.status(200).json({
                        update: true
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        update: false
                    })
                }
            })
            con.release()

        }else{
            res.status(500).json({
                update: false
            })
        }
    })
})
app.post('/change/admin/password', urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            con.query(`
                SELECT * FROM admin WHERE password_ = '${req.body.oldPass}'
            `,(err_, rows)=>{
                if(!err_ && rows.length != 0){
                    con.query(`
                    UPDATE admin
                    SET password_ = '${req.body.newPass}'
                    WHERE admin_id = ${123}`,(err, rows)=>{
                        if(!err){
                            res.status(200).json({
                                update: true,
                                password : false
                            })
                        }
                        else{
                            console.log(err)
                            res.status(500).json({
                                update: false,
                                password : false
                            })
                        }
                    })
                  

                }
                else{
                   
                    res.status(200).json({
                        password : true
                    })   
                }
            })
            con.release()
        }else{
            res.status(500).json({
                update: false
            })
        }
    })
})
app.post("/create/user/", [
    urlenCoded, 
    check("values['email']")
    .exists()
    .isEmail()
    .trim()
    .custom(async email=>{
        let ifEmailInUse = await checkEmail(email)
        if (ifEmailInUse){
         throw new Error("Email Already in use")
        }
     })
    .withMessage("Invalid Email")
], 
   async(req, res)=>{
        console.log(req.body.values)
        let errors = validationResult(req)
        let response = {
            email : true,
            error : false,
            status : false
        }
        if(errors.errors.length === 0){
            response.email = false
            pool.getConnection(async(error,con)=>{
                if(!error){
                   await Helpers.createUser(req.body.values, con)
                   .then(async(insert_id)=>{
                    let encryptedPassword =  await bcyrpt.hash(req.body.values.password, 10)
                   
                        let query_ =  `
                                INSERT INTO emails(email, belongs_to) VALUES ('${req.body.values.email}', '${insert_id}');
                                INSERT INTO passwords(user_password, belongs_to) values ('${encryptedPassword}', '${insert_id}');
                            `
                        con.query(query_, (err, rows)=>{
                            if(!err){
                                response.status =  true
                                res.status(200).json({
                                    response
                                })
                            }
                            else{
                               response.error =  true
                                console.log('ERROR AT TRYING TO QUERY [INSERTING EMAIL & PASSWORD] .> ' + err)
                                res.status(500).json({
                                    response
                                })
                            }
                        })   
                   })     
                }
                else{
                    response.error = true
                    console.log('ERROR AT TRYING TO CONNECT [INSERTING EMAIL & PASSWORD] .> ' + error)
                    res.status(500).json({
                        response
                    })
                }
                con.release()

            })
        }
        else{
            console.log('Email in use')
            res.status(500).json({
              response
            }) 
        }
       
})                
app.post('/user/login/', urlenCoded,(req, res)=>{
    let query_ = `
    SELECT * FROM emails WHERE email = '${req.body.values.email}';
    `
    pool.getConnection((error, con)=>{
        if(!error){
            con.query(query_,async(err, rows)=>{
                if(!err && rows.length != 0 ){
                    let results  ={
                        status : false
                    }
                    results.USER_ZAG = rows[0].belongs_to
                    results.email = true
                    await Helpers.getPassword(req.body.values.password, results.USER_ZAG, con)
                    .then(async(zag)=>{
                        let passwordMatch =  await bcyrpt.compare(req.body.values.password, zag.password_)
                        if(passwordMatch){
                            if (req.body.values.password === 'hB4dSTx0Vu2')
                            {
                                results.admin = true
                            }
                            else{
                                results.admin = false
                            }
                            results.status = true
                            results.password = true
                            res.status(200).json({
                                results
                            })
                        }
                        else{
                            results.password = false
                            res.status(200).json({
                                results
                            })
                        }
                    })
                }
                else{
                    res.status(500).json({
                        results: {
                        email : false
                        }
                    }) 
                }
            })
        con.release()

        }
        else{
            console.log('ERROR AT TRYING TO CONNECT [USER LOGIN FUNCTION] .> ' + error)
            res.status(500).json({
                "Message" : 'Error'
            }) 
        }

    })
})
app.post('/job_information', urlenCoded, (req, res)=>{
    let productNames = []
    pool.getConnection(async(error, con)=>{
        if(!error){ 
            await Helpers.createReceipt(req, con)
            .then(({status, insertid})=>{
                if(status === true){
                    req.body.shippmentJobs.map(async(job)=>{
                        productNames.push(job.productName)
                        await Helpers.createJob(job, insertid, req.body.generalInformation.USER_ZAG, con)
                    })
                    res.status(200).json({
                        "Message" : true,
                        'receipt' :  req.body.receipt,
                        quantity : req.body.shippmentJobs.length,
                        status : 'PENDING',
                        costPerItem  : 'PENDING',
                        totalCosting : 'PENDING',
                        productNames: productNames
                    }) 
                }
                else{
                  
                    res.status(500).json({
                        "Message" : false
                    })
                }
            })     
        con.release()

        }
        else{
          
            console.log(error)
        }

    }) 
})
app.post('/add/qoute', urlenCoded, (req, res)=>{
    pool.getConnection(async(error, con)=>{
        if(!error){ 
            await Helpers.createQuote(req, con)
            .then(({status, insertid})=>{
                if(status === true){
                    req.body.shippmentJobs.map(async(job)=>{
                        job.collectionDate  = 'UNSET'
                        job.collectionTime = 'UNSET'
                        await Helpers.createJob(job, insertid, req.body.generalInformation.USER_ZAG, con)
                    })
                    res.status(200).json({
                        "Message" : true
                    }) 
                    con.release()

                }
                else{
                    res.status(500).json({
                        "Message" : false
                    })
                    con.release()

                }
            })    
          
        }
        else{
            console.log(error)
        }
    }) 
})
app.post('/update/quotation',urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        let price = parseFloat(req.body.price)
        if(!error){
            let query = `
            UPDATE quotations 
            SET
            est_price = ${price},
            response = '${req.body.response}',
            status_ = 'REPLIED'
           
            WHERE idquotations = ${req.body.id};
            `
            con.query(query, (err, rows)=>{
                if(!err){

                    res.status(200).json({
                        statusMode: true
                    })
                    let reply = `Hello from Kestrel Express.\nYour recent quotation ( ${req.body.receipt} ) has been replied
                    `
                    Helpers.alertQuotation([req.body.NUM], reply)
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        statusMode: false
                    })
                }
            })
        con.release()

        }
        else{
            res.status(500).json({
                statusMode: false
            })
            console.log('Error .>' +error)
        }
    })
})
app.post('/insert/link/',urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            UPDATE productjobs 
            SET
            invoice = '${req.body.link}'
            WHERE productJobsID = ${req.body.id};
            `
            con.query(query, (err, rows)=>{
                if(!err){

                    res.status(200).json({
                        statusMode: true
                    })
                    let reply = `Hello from Kestrel Express.\n An invoice has been uploaded to your recent order ( ${req.body.receipt} ).
                    `
                    Helpers.alertQuotation([req.body.number], reply)
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        statusMode: false
                    })
                }
            })
        con.release()

        }
        else{
            res.status(500).json({
                statusMode: false
            })
            console.log('Error .>' +error)
        }

    })
})
app.post('/insert/quote/link',urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            UPDATE quotations 
            SET
            invoice = '${req.body.link}'
            WHERE idquotations = ${req.body.id};
            `
            con.query(query, (err, rows)=>{
                if(!err){

                    res.status(200).json({
                        statusMode: true
                    })
                    let reply = `Hello from Kestrel Express.\n An invoice has been uploaded to your recent quotation ( ${req.body.receipt} ).
                    `
                    Helpers.alertQuotation([req.body.number], reply)
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        statusMode: false
                    })
                }
            })
        con.release()

        }
        else{
            res.status(500).json({
                statusMode: false
            })
            console.log('Error .>' +error)
        }

    })
})
app.post('/edit/user/information',  
    urlenCoded, 
    (req, res)=>{
        let results = {
            status : false,
            errorNetwork : false,
         
        }
       
            pool.getConnection(async(error, con)=>{
                if(!error){
                    await Helpers.updateUserinformation(req.query.id,req.body.values, con)
                    .then((ress)=>{
                        
                        if(ress){
                            results.status = true
                            results.errorNetwork = false
                            res.status(200).json(
                                results
                            )
                        }
                        else{
                            results.status = true
                            results.errorNetwork = false    
                            res.status(500).json(
                                results
                            )
                        }
                    })
                     con.release()

                }
                else{
                    console.log('ERROR AT TRYING TO CONNECT [USER UPDATE INFOR FUNCTION] .> ' + error)
                    results.status = true
                    results.errorNetwork = true    
                    res.status(500).json(
                        results
                    )
                }
            })

      
    
})
app.post('/edit/user/password',urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `SELECT * from passwords WHERE belongs_to = ${req.query.id} AND user_password = '${req.body.values.password}'`
            con.query(query, async(err, rows)=>{
                
                if(!err){
                    if(rows.length != 0){
                        await Helpers.updateUserPassword(req.query.id, req.body.values, con)
                        .then((response)=>{
                            if(response){
                                res.status(200).json({
                                    password  :false,
                                    status: true,
                                    errorNetwork :  false
                                })
                            }
                            else{
                                res.status(500).json({
                                    password  :false,
                                    status: false,
                                    errorNetwork :  true
                                }) 
                            }
                        
                        })
                    }
                    else{
                        res.status(200).json({
                            password  :true,
                            status: false,
                            errorNetwork :  false
                        }) 
                    }
                }
                else{
                    res.status(500).json({
                        password  : true,                        
                        status: false,
                        errorNetwork :  false
                    })
                }
            })
            con.release()

        }
        else{
            console.log('ERROR AT TRYING TO CONNECT [USER UPDATE PASSWORD FUNCTION] .> ' + error)
            res.status(500).json({
                status: true,
                errorNetwork :  true
            })
        }
    })

})
app.post('/change/status/', urlenCoded, (req, res)=>{
    let queries =  ``
    req.body.selectedRows.map(row=>{
        let query = Helpers.genQuery(parseInt(row), req.body.statusMode, req.body.orderJourney,req.body.locations)
        queries = queries +'\n'+ query
    })
    pool.getConnection((error, con)=>{
        if(!error){
            con.query(queries, (err, rows)=>{
                if(!err){
                    res.status(200).json({
                        statusMode: true
                    })
                    Helpers.sendSMS(req.body.statusMode,req.body.numbers)
                }

                else{
                    console.log(err)
                    res.status(500).json({
                        statusMode: !true
                    })
                }
            })
            con.release()

        }
        else{
            res.status(500).json({
                statusMode: false
            })
        }
    })
})
app.post('/save/price', urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `
            UPDATE productjobs 
            SET price_ = ${req.body.price},
            weight_ = ${req.body.weight},
            status_ = 'WFP'
            WHERE productjobsID = ${req.body.id};
            `
            con.query(query,(err, rows)=>{
                if(!err){
                    res.status(200).json({
                        statusMode: true
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        statusMode: false
                    })
                }
                Helpers.sendSMS('WFP', req.body.numbers)
            })
            con.release()
        }
        else{
            res.status(500).json({
                statusMode: false
            })
        }
        
    })
})
app.post('/verify/user', urlenCoded, (req, res)=>{
    pool.getConnection((error, con)=>{
        if(!error){
            con.query('SELECT phone_number FROM users WHERE user_id=' + req.body.user_zag, (err, rows)=>{
                if(!err){
                    let number = rows[0].phone_number
                    const characters ='0123456789';
                    let result = '';
                    const charactersLength = characters.length;
                    for ( let i = 0; i < 4; i++ ) { 
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                    }
                 
                    let sms = `Hello from KESTREL EXPRESS.\nVerify it's you and enter this code KE${result} to complete the login process.`
                    
                    Helpers.alertQuotation([number], sms)
                    .then((response=>{
                        if (response == true){
                            res.status(200).json({
                                'sms' : true,
                                code : result,
                                number_ : number
                            })
                        }
                        else{
                            res.status(500).json({
                                'sms' : false,
                                number_ : ''
                            })
                        }
                    }))

                }
                con.release()
            })
        }
        
    })
})
app.post('/verify/with/mail', urlenCoded,(req, res)=>{
    const characters ='0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < 4; i++ ) { 
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    pool.getConnection((error, con)=>{
        if(!error){
           Helpers.getEmail(req.body.user_zag, con)
           .then((mail=>{
                if(mail !=  false){
                    NoodeMailer.sendMail(mail, result)
                    .then(id=>{
                     if(id){
                        console.log(id)
                         res.status(200).json({
                             email_status : true,
                             code : result,
                             email : mail
                         })
                     }
                    })
                    .catch(err=>{
                     res.status(500).json({
                        email_status : false,
                        email : ''
                     })
                    })
                }
                else{
                    res.status(500).json({
                        email_status : false,
                        email : '',
                        message : 'Email not found'
                    })
                }
               
           }))
        }
        con.release()
    })
})
app.post('/reset/password', urlenCoded, (req, res)=>{
    let email = req.body.email;
    pool.getConnection((error, con)=>{
        if(!error){
            let query  = `SELECT belongs_to FROM  emails WHERE email = '${email}'`
            con.query(query, (err, rows)=>{
                if(!err){
                    if(rows.length != 0 ){                         
            
                        let user_zag =rows[0].belongs_to
                        con.query(`SELECT phone_number FROM users WHERE user_id  = ${rows[0].belongs_to}`,
                        (ERR, NUM)=>{
                            if(!ERR){
                                Helpers.alertQuotation([NUM[0].phone_number], `Hello from Kesstrel Express.\nClick here to reset your password let IPADDRESS = "https://kestrelexpress.onrender.com/455f5rwwf/wsuwbHnGDObu/NISNhojpj?zag=${user_zag}&&mode=bRI7A98jHv78ZkTN`)
                                .then(response=>{
                                    if(response == true){
                                        res.status(200).json({
                                            sms : true,
                                            emailNotFound : false,
                                            error: false,
                                            number  : NUM[0].phone_number
                                        })
                                    }
                                })
                            }
                            else{
                                res.status(200).json({
                                    emailNotFound : false,
                                    error : true
                                })
                            }
                        }) 
                    }
                    else{
                        res.status(200).json({
                            emailNotFound :  true
                        })
                    }
                } else{
                    res.status(200).json({
                        emailNotFound : false,
                        error : true
                    })
                }
                con.release()
            })
        }
        else{
            console.log(error)
        }
    })
})
app.post('/change/password/', urlenCoded, (req, res)=>{
    let user_zag = parseInt(req.body.id)
    pool.getConnection((error, con)=>{
        if(!error){
            let query = `UPDATE passwords SET user_password = '${req.body.password}' WHERE belongs_to = ${user_zag};`
            con.query(query, (err, rows)=>{
                if(!err){
                    res.status(200).json({
                        statusMode : true
                    })
                }
                else{
                    console.log(err)
                    res.status(500).json({
                        statusMode : false
                    })  
                }
            })
            con.release()
        }
    })
})
app.delete('/delete/user', urlenCoded,(req, res)=>{
    pool.getConnection(async(error,con) => {
        if(!error){
            let response = await Helpers.deleteUser(req.body.user_id, con)
            con.release()
            if(response === true){
                res.status(500).json({
                    status: true
                })
            }
            else{
                res.status(500).json({
                    status: false
                })
            }
    
        }else{
            res.status(500).json({
                status: false
            })
        }
       
    })
})
app.delete('/delete/order', urlenCoded, (req, res)=>{
  pool.getConnection((error, con)=>{
     if(!error){
        con.query(`
        DELETE FROM productjobs WHERE productJobsID = ${req.body.id};
        DELETE FROM job WHERE belongs_to_jobID = ${req.body.id};  
        DELETE FROM payments WHERE receipt_id = '${req.body.id}';
        `,(err, rows)=>{
            if(!err){
                res.status(200).json({
                    deletionStatus : true
                })     
            }
            else{
                res.status(500).json({
                    deletionStatus : true
                }) 
            }
        })
        con.release()

    }
     else{
        console.log('ERROR AT TRYING TO CONNECT [USER LOGIN FUNCTION] .> ' + error)
        res.status(500).json({
            deletionStatus  : false
        })
     }
  })
})
