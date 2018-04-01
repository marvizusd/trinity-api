const bodyParser = require('body-parser')
const express = require('express')
const axios = require('axios')
const morgan = require('morgan')
const cors = require('cors')
const queryString = require('query-string');
const Enom = require('node-enom-api');
const app = express()
require('dotenv').config()

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cors())

var client = new Enom({
    uid: process.env.ENOM_LOGIN,
    pw: process.env.ENOM_PW,
    response: "json",
    mode: "live"
  });

// app.get('/', (req, res) => {
//     console.log(req.query.url)
//     if(!req.query.url){
//         return res.status(400).send('You need to pass params. `example.com/?url=someapi.com`')
//     }
//     const params = queryString.parseUrl(decodeURI(req.query.url))

//     console.log(params)
//     let headers = req.headers
//     console.log(headers)
//     return axios.get(params.url, {params:params.query, headers:{'Authorization':headers.authorization}})
//     .then((response)=>res.send(response))
//     .catch((response)=>{
//         // console.log(error.response.data);
//         // console.log(error.response.status);
//         // console.log(error.response.headers);
//         res.status(400).json(response.error)
//     })
// })

app.get('/check/:available', (req, res) => {
    let domain = req.params.available
    
    axios.get(`https://api.godaddy.com/v1/domains/available?domain=${domain}&checkType=FAST&forTransfer=false`,{"headers":
    {"Accept": "application/json", "Authorization":process.env.GODADDY_OAUTH}})
    .then(r => res.send(r.data))
    .catch((error)=>{
        console.log(error)
    })
})

app.get('/whois/:ns', (req, res) =>{
    let domain = req.params.ns
    axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${process.env.WHOIS_KEY}&domainName=${domain}&outputFormat=json`)
    .then((r)=>{
        res.send(r.data)
    })
    .catch((err)=>{
        console.log(err)
    })
})

app.get('/godaddy/:domain', (req, res) => {
    let domain = req.params.domain

    axios.get(`https://api.godaddy.com/v1/domains/${domain}`, {"headers":
    {"Accept": "application/json", "Authorization":process.env.GODADDY_OAUTH}})
    .then(r => res.send(r.data))
    .catch(error => res.send(error.response.data))
})

app.get('/enom/:domain', (req, res) => {
    let domain = req.params.domain.split('.')
    let data = {}

    client.get('GetDomainInfo', {sld: domain[0], tld: domain[1]}, function(error, data){
        if (error) {
            console.log(error)
            res.send('error')
        }else{
            if(data['interface-response'].ErrCount[0] == '0'){
                data = {
                    expiration:data["interface-response"].GetDomainInfo[0].status[0].expiration,
                    dns:data["interface-response"].GetDomainInfo[0].services[0].entry[0].configuration[0].dns
                }
                res.send(data)
            } else if(data['interface-response'].errors[0].Err1[0] === 'Domain name not found'){
                console.log(data['interface-response'].errors[0].Err1[0])
                res.send('DOMAIN_NOT_FOUND')
            } else if(data['interface-response'].errors[0].Err1[0] === 'The domain does not belong to this account'){
                console.log(data['interface-response'].errors[0].Err1[0])
                res.send('NOT_BELONGS_TO_ACCOUNT')
            }else if(data['interface-response'].errors[0].Err1[0]){
                console.log(data['interface-response'].errors[0].Err1[0])
                res.send('IP_NOT_REGISTERED')
            }
        }
      })
})

app.listen(process.env.PORT || 4000, null, () => console.log('Listening on http://localhost:4000'))