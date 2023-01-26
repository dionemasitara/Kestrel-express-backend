const axios = require("axios");
let Status = require('./Statuses')
var StringCrypto = require('string-crypto');
const password = 'bRI7A9$8jHv78ZkTNg@A#*oS4x';

const {
    encryptString,
    decryptString,
  } = new StringCrypto({
    salt: 'CBP6fY4fMEeta5MRRZdHrXHHn2Bgbberr',
    iterations: 10,
    digest: 'sha3-512',
  });

let createUser = (values, con) =>{
    let query_ = `INSERT INTO users(
        fullname,
        phone_number,
        address,
        date,
        month,
        year,
        occupation
    )VALUES (
        '${values.fullname}',
        '${values.number}',
        '${values.address}',
        '${values.date}',
        '${values.month}',
        '${values.year}',
        '${values.occupation}'
    );`
    return new Promise((resolve, reject)=>{
        con.query(query_, (err, rows, fields)=>{
            if(!err){
                resolve(rows.insertId)
            }
            else{
                console.log('ERROR AT QUERYING [CREATE USER FUNCTION] .> ' + err)
                resolve(false)
            }
        })
    })
    
}
let getOrders = (user_id,page,con)=>{

    return new Promise((resolve, reject)=>{
        let limit = 6
        let query = ` 
        SELECT * FROM productjobs WHERE belongs_to = ${user_id};
        SELECT payment_id, amount, receipt, date FROM payments WHERE belongs_to = ${user_id};
       `
        con.query(query, (err, rows)=>{
            if(!err && rows.length != 0){
               let orders= []
               let payments = []
               rows[0].map((row)=>{
                    let results ={}
                    let date = row.jobDate.toString().split(' GM')[0]
                    results.receipt = row.receiptNumber,
                    results.date = date
                    results.status = row.status_
                    results.id = row.productJobsID

                    if(row.transportationMode === 'Air'){
                        results.icon = 'bxs-plane'
                    }
                    else if(row.transportationMode === 'Sea'){
                        results.icon = 'bxs-ship'
                    } 
                    else if(row.transportationMode === 'Rail'){
                        results.icon = 'bx-train'
                    }
                    else if(row.transportationMode === 'Road'){
                        results.icon = 'bxs-car'
                    }
                    orders.push(results)
               })
               rows[1].map((payment)=>{
                payments.push(payment)
               })
               resolve({
                    orders : orders,
                    payments : payments,
                    status: true
               })
            }
            else{
                console.log(err)
                resolve({
                    status: false
                })
            }

        })
    })
    
}
let getUsers = (page, limit, con, SORT)=>{
    let query = `SELECT * FROM users order by user_id ${SORT}`
   
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;
    
    return new Promise ((resolve, reject)=>{
        con.query(query, async(err, rows)=>{
            if(rows.length != 0 && !err){
                let users = []
                let new_rows = rows.slice(startIndex, endIndex)
                new_rows.map((user)=>{
                    let initial = user.fullname[0].toUpperCase()
                    let result ={
                        initial : initial,
                        user_id  : user.user_id,
                        fullname  : user.fullname,
                        number : user.phone_number != undefined ? (user.phone_number) : ('Nothing yet....'),
                        address : user.address != undefined ? (user.address) : ('Nothing yet....'),
                    }
                    users.push(result)
                })
                resolve({
                    results : users
                })
            }     
            else{
                resolve({
                    results : []
                })
            }  
        })
    })
}
let getPayments = (page, limit, con, SORT)=>{
    let query = `SELECT * FROM payments order by payment_id ${SORT}`
   
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;
    
    return new Promise ((resolve, reject)=>{
        con.query(query, async(err, rows)=>{
            if(rows.length != 0 && !err){
                let payments = []
                let new_rows = rows.slice(startIndex, endIndex)
                new_rows.map((payment)=>{
                    let result ={
                        payment_id : payment.payment_id,
                        amount  : payment.amount,
                        receipt  : payment.receipt,
                        payer_fullname : payment.payer_fullname,
                        date : payment.date
                    }
                    payments.push(result)
                })
                resolve({
                    payments : payments
                })
            }      
            else{
                resolve({
                    payments : []
                })
            } 
        })
    })
}
let createReceipt = (req,con)=>{
    let fullname;
    let number
    return new Promise((resolve, reject)=>{
        let query_1 = `SELECT fullname, phone_number FROM users WHERE user_id  = ${req.body.generalInformation.USER_ZAG}`
        let query =  
        con.query(query_1, (err, rows)=>{
            if(!err){
                con.query(`INSERT INTO productjobs(
                    transportationMode,
                    cargoType, 
                    deliveryName, 
                    deliveryNationalID, 
                    deliveryEmail, 
                    deliveryPhoneNumber, 
                    receiptNumber, 
                    belongs_to,
                    user_name,
                    user_number
                )
                VALUES (
                    '${req.body.generalInformation.shippingMode}',
                    '${req.body.generalInformation.typeOfCargo}',
                    '${req.body.deliveryInformation.fullname}',
                    '${req.body.deliveryInformation.nationalIDNumber}',
                    '${req.body.deliveryInformation.email}',
                    '${req.body.deliveryInformation.mobileNumber}',
                    '${req.body.receipt}',
                    ${req.body.generalInformation.USER_ZAG},
                    '${rows[0].fullname}',
                    '${rows[0].phone_number}'
                )`, (ERR, rows_)=>{
                    if(!ERR){
                        resolve({status: true, insertid : rows_.insertId })
                    }
                    else{
                        resolve(false)
                    } 
                })
            }
            else{
                console.log(err)
            }

        })
    })
}
let createJob = (job, insertId, userId, con)=>{
   
    return new Promise((resolve, reject)=>{
        let quantity = parseInt(job.quantity)
        let query = `
        INSERT INTO job(
            productName,
            productDescription,
            productQuantity,
            imageLocation,
            belongs_to_jobID,
            belongs_to,
            collectionDate,
            collectionTime
        )
        values(
            "${job.productName}",
            "${job.productDescription}",
            ${quantity},
            "${job.uri}",
            ${insertId},
            ${userId},
            "${job.collectionDate}",
            "${job.collectionTime}"
        )`
        con.query(query, (err, row)=>{
            if(!err){
            
                resolve(true)
            
            }
            else{
                console.log(err)
               resolve(false)
            }
        })
    })
}
let createQuote = (req,con)=>{
    return new Promise((resolve, reject)=>{
        let query_1 = `SELECT fullname, phone_number FROM users WHERE user_id  = ${req.body.generalInformation.USER_ZAG}`
        let query =  
        con.query(query_1, (err, rows)=>{
            if(!err){

                con.query(`INSERT INTO quotations(
                    from_,
                    to_, 
                    receiptNumber, 
                    belongs_to, 
                    message,
                    fullname,
                    number
                )
                VALUES (
                    '${req.body.generalInformation.from}',
                    '${req.body.generalInformation.to}',
                    '${req.body.receipt}',
                    ${req.body.generalInformation.USER_ZAG},
                    '${req.body.deliveryInformation.message}',
                    '${rows[0].fullname}',
                    '${rows[0].phone_number}'
                )`, (ERR, rows_)=>{
                    if(!ERR){
                        resolve({status: true, insertid : rows_.insertId })
                    }
                    else{
                        console.log(ERR)
                        resolve(false)
                    } 
                })
            }
            else{
                console.log(err)
            }

        })
    })
}
let getPassword= (password,userId, con) =>{
    return new Promise((resolve, reject)=>{
        let query = `SELECT * FROM passwords WHERE belongs_to  = ${userId}`
        con.query(query, (err, rows)=>{
            if(!err && rows.length !=0){
                let output = {
                    belongs_to  :rows[0].belongs_to,
                    password_ : rows[0].user_password 
                }
                resolve(output)
            }
            else{
                resolve(false)
            }
        })

    }) 
 
}
let getUserInformation = (user_id, con) =>{
    return new Promise((resolve, reject)=>{
        let query = `
        SELECT * FROM users WHERE user_id = ${user_id};
        SELECT * FROM emails WHERE belongs_to  = ${user_id};
        SELECT COUNT(*) FROM productjobs WHERE productjobs.status_ != 'KO' and belongs_to = ${user_id};
        SELECT COUNT(*) FROM productjobs WHERE productjobs.status_ = 'KO' and belongs_to = ${user_id};
        SELECT COUNT(*) FROM payments where belongs_to = ${user_id};
        `
        con.query(query, (err, rows)=>{
            if(!err){
                let results = {
                    userInformation : {
                        name : rows[0][0].fullname,
                        phone : rows[0][0].phone_number,
                        address  : rows[0][0].address,
                        dob  :{
                            date :  rows[0][0].date,
                            month :  rows[0][0].month,
                            year  : rows[0][0].year
                        },
                        occupation :  rows[0][0].occupation

                    },
                    email : rows[1][0].email,
                    transactions : {
                        inKO : rows[2][0]['COUNT(*)'],
                        KO : rows[3][0]['COUNT(*)'],
                        payments : rows[4][0]['COUNT(*)']
                    },
                    status :true
                }
                console.log()

                resolve(results)
            }else{
                console.log(err)
                resolve({
                    status: false
                })
            }
        })  
    })
    
}
let deleteUser = async(user_id, con)=>{
    return new Promise((resolve, reject)=>{
        let query = `
        DELETE FROM emails WHERE belongs_to = ${user_id};
        DELETE FROM passwords WHERE belongs_to = ${user_id};
        DELETE FROM job WHERE belongs_to = ${user_id};
        DELETE FROM productjobs WHERE belongs_to = ${user_id};
        DELETE FROM users WHERE user_id = ${user_id};
        `
        con.query(query, (err, rows)=>{
            if(!err){
                resolve(true)
            }
            else{
                resolve(false)
                console.log('ERROR AT TRY TO DELETE A USER .> '+err)

            }
        })
    })
    
}
let genIndexReport = (con) => {
    return new Promise((resolve, reject)=>{
        let query = `
        SELECT COUNT(*) FROM users;
        SELECT COUNT(*) FROM productjobs WHERE productjobs.status_ != 'KO';
        SELECT COUNT(*) FROM productjobs WHERE productjobs.status_ = 'KO';
        SELECT sum(amount) from payments;  
    `
    con.query(query, (err, rows)=>{
        if(!err){
            let users_amount = rows[0][0]['COUNT(*)']
            let inKO = rows[1][0]['COUNT(*)']
            let KO = rows[2][0]['COUNT(*)']
            let Total = rows[3][0]['sum(amount)']
    

     
            let result = [
                {
                    amount : users_amount,
                    icon : 'bx bx-user',
                    heading : 'Users'
                },
                {    
                    amount : inKO,
                    icon : 'bx bx-book-content',
                    heading : 'Incomplete Orders'
                },
                {
                    amount : KO,
                    heading : 'Complete Orders',
                    icon : 'bx bx-file-blank',

                },
                {
                    amount: Total,
                    icon : 'bi bi-currency-exchange',
                    heading : 'Revenue'
                },
            ]
            resolve({
                results  : result
            })

        }
        else{
            resolve({
                error : true
            })
        }
    })
    })
    
}
let updateUserinformation = (user_id, values, con) =>{
    return new Promise((resolve, reject)=>{
        let query = `
        UPDATE users 
        SET fullname = '${values.fullname}',
        phone_number = '${values.number}',
        address = '${values.address}',
        occupation = '${values.occupation}'
        WHERE user_id = ${user_id};
`
        con.query(query, (err, rows)=>{
            if(!err){
                resolve({
                    status : true
                })
            }
            else{
                console.log(err)
                resolve({
                    status: false
                })
            }
        })
    })
   
}
let updateUserPassword  = (user_id, values, con, bcrypt)=>{
    return new Promise((resolve, reject)=>{
        let newPassword = bcrypt.hash(values.newPassword, 10)
        let query = `
            UPDATE passwords
            SET user_password ='${newPassword}'
            WHERE belongs_to = ${user_id}
        `
        con.query(query, (err, rows)=>{
            if(!err){
                resolve(true)
            }
            else{
                console.log(err)
                resolve(false)
            }
        })
    })
}

let getIncompleteOrders = (page, FILTER,con)=>{
    return new Promise((resolve, reject)=>{
        let query_ = `
        SELECT * FROM productjobs
        WHERE status_ != 'KO'
        ORDER BY ${FILTER} Desc;
    `

    let limit = 10;
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    con.query(query_, (err, rows)=>{
        if(!err && rows.length != 0){
            let orders = []
            let new_rows = rows.splice(startIndex, endIndex)
            new_rows.map(async(order)=>{

                    let date = order.jobDate.toString().split(' GM')[0]
                    let result = {}
                    result.id = order.productJobsID
                    result.Tmode  = order.transportationMode
                    result.cargoType =  order.cargoType
                    result.receiptNumber = order.receiptNumber
                    result.jobDate = date
                    result.status = order.status_
                    result.belongs_to = order.belongs_to 
                    result.userName = order.user_name
                    result.number = order.user_number     
                    orders.push(result)    
            })
            resolve({
                orders : orders
            })
        }
        else{
            resolve({
                orders : []
            })
        }
    })
    })
    

}
let getQuotations = (page, FILTER,con)=>{
    return new Promise((resolve, reject)=>{
        let orderBy = ''
        if (FILTER === 'new'){
            orderBy = 'DESC'
        }
        else{
            orderBy = 'ASC'
        }

        let query_ = `
        SELECT 
            idquotations,
            receiptNumber,
            jobdate,
            status_,
            fullname
         FROM quotations
        
        ORDER BY idquotations ${orderBy};
    `

    let limit = 10;
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    con.query(query_, (err, rows)=>{
        if(!err && rows.length != 0){
            let quotations = []
            let new_rows = rows.splice(startIndex, endIndex)
            new_rows.map(async(order)=>{

                    let date = order.jobdate.toString().split(' GM')[0]
                    let result = {}
                    result.id = order.idquotations
                    result.receiptNumber  = order.receiptNumber
                    result.status =  order.status_
                    result.fullname = order.fullname
                    result.jobDate = date
                   
                    quotations.push(result)    
            })
            resolve({
                quotations : quotations
            })
        }
        else{
            resolve({
                quotations : []
            })
        }
    })
    })
    

}
let getCompleteOrders = (page, con)=>{
    return new Promise((resolve, reject)=>{
        let query_ = `
        SELECT * FROM productjobs
        WHERE status_ = 'KO'
        ORDER BY productJobsID Desc;
    `

    let limit = 20;
    let startIndex = (page - 1) * limit;
    let endIndex = limit + startIndex;

    con.query(query_, (err, rows)=>{
        if(!err && rows.length != 0){
            let orders = []
            console.log(rows)
            let new_rows = rows.length === 1 ? (rows) : rows.splice(startIndex, endIndex)
            new_rows.map(async(order)=>{
                    let date = order.jobDate.toString().split(' GM')[0]
                    let result = {}
                    result.id = order.productJobsID
                    result.Tmode  = order.transportationMode
                    result.cargoType =  order.cargoType
                    result.receiptNumber = order.receiptNumber
                    result.jobDate = date
                    result.status = order.status_
                    result.belongs_to = order.belongs_to      
                    orders.push(result)    
            })
            resolve({
                orders : orders
            })
        }
        else{
            console.log(err)
            resolve({
                orders : []
            })
        }
    })
    })
    
}
let genQuery = (id, mode,OJ, locations) =>{
    let query = `
    UPDATE productjobs
    SET status_ = '${mode}',
    startDate = '${OJ.startDate}',
    endDate = '${OJ.endDate}',
    startTime = '${OJ.startTime}',
    endTime = '${OJ.endTime}',
    from_ = '${locations.from}',
    to_ = '${locations.to}'
    WHERE productJobsID = ${id};
    `
    return query
}

function sendSMS(status, numbers){
        const options = {
            method: 'POST',
            url: 'https://d7sms.p.rapidapi.com/messages/v1/send',
            headers: {
            'content-type': 'application/json',
            Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoLWJhY2tlbmQ6YXBwIiwic3ViIjoiYWM4OThlYzItNDE2Yy00YTA5LThjYmUtOTg2N2M3YzUzY2IxIn0.RfWajf3THvADiaR7s4SWdgSLigGujxaJsSuWfGEsSP0',
            'X-RapidAPI-Key': '4ce68f179cmsh38bf9a8c9a46db4p1616fbjsn3009da327a74',
            'X-RapidAPI-Host': 'd7sms.p.rapidapi.com'
            },
            data: JSON.stringify({
                messages: [
                    {
                        channel: "sms",
                        originator: "KESTREL EXPRESS",
                        recipients: numbers,
                        content: "Greatings from KESTREL EXPRESS. Your recent order has changed state to "+ Status[status] + '. Open the application for more information',
                        msg_type: "text"
                    }
                ]
            
            })
        };
        axios.request(options)
        .then(function (response) {
            console.log(response.data);
        })

}
function alertQuotation( numbers, message){
    return new Promise((resolve, reject)=>{
        const options = {
            method: 'POST',
            url: 'https://d7sms.p.rapidapi.com/messages/v1/send',
            headers: {
            'content-type': 'application/json',
            Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoLWJhY2tlbmQ6YXBwIiwic3ViIjoiYWM4OThlYzItNDE2Yy00YTA5LThjYmUtOTg2N2M3YzUzY2IxIn0.RfWajf3THvADiaR7s4SWdgSLigGujxaJsSuWfGEsSP0',
            'X-RapidAPI-Key': '4ce68f179cmsh38bf9a8c9a46db4p1616fbjsn3009da327a74',
            'X-RapidAPI-Host': 'd7sms.p.rapidapi.com'
            },
            data: JSON.stringify({
                messages: [
                    {
                        channel: "sms",
                        originator: "KESTREL EXPRESS",
                        recipients: numbers,
                        content: message,
                        msg_type: "text"
                    }
                ]
            
            })
        };
        axios.request(options)
        .then(function (response) {
            console.log(response.data);
            resolve(true)
        })
        .catch((err)=>{
            resolve(false)
        })
    
    })
  

}
function savePayment(infor, con){
    return new Promise((resolve, reject)=>{
 let query = `
        INSERT INTO payments(
            belongs_to, 
            amount, 
            receipt,
            receipt_id,
            payer_email,
            payer_fullname,
            payee_email,
            description,
            date,
            pal_id
        ) VALUES(
            ${parseInt(infor.belongs_to)},
            ${parseFloat(infor.amount)},
            '${infor.receipt}',
            '${infor.receipt_id}',
            '${infor.payer_email}',
            '${infor.payer_fullname}', 
            '${infor.payee_email}',
            '${infor.description}',   
            '${infor.date}',
            '${infor.paypal_id}'
        );
        UPDATE productjobs SET payment_status = 'PAID' WHERE productJobsID = ${infor.receipt_id};
    `
    con.query(query, (err, rows)=>{
        if(!err){
            resolve(true)
        }
        else{
            console.log(err)
            resolve(false)
        }
    })
    })
   
}
function getEmail(id, con){
    return new Promise((resolve, reject)=>{
        con.query('SELECT email FROM emails WHERE belongs_to = '  + parseInt(id), (err, row)=>{
            if(!err){
                let email = row[0].email
                resolve(email)
            }
            else{
                resolve(false)
            }
        })
    })
}
function encrypt(text){
    let encryptedString = encryptString(text, password);
    return encryptedString
}
function decrypt(text){
    console.log('Decrypted String:', decryptString(text, password));
    return null
}

module.exports ={
    updateUserinformation,
    getIncompleteOrders,
    updateUserPassword,
    getUserInformation,
    getCompleteOrders,
    alertQuotation,
    genIndexReport,
    createReceipt,
    getQuotations,
    createQuote,
    getPassword,
    savePayment,
    getPayments,
    createUser,
    deleteUser,
    getOrders,
    createJob,
    genQuery,
    getEmail,
    getUsers,
    encrypt,
    decrypt,
    sendSMS
}