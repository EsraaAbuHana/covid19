'use strict';
const express=require('express');
const cors=require('cors');
const pg=require('pg');
const superagent=require('superagent');
const methodOverride=require('method-override');

const app=express();
 
// **** Useful Express Codes ****
require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');


//DB setup
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

//routs
app.get('/',homeHandler);
app.get('/getCountryResult',getCountryResultHandler);
app.get('/allCountries',allCountriesHandler);
app.post('/myRecords',myRecordsHandler);
app.get('/myRecords',getMyRecordsHandler);
app.get('/recordDetails/:id',recordDetailsHandler);
app.delete('/recordDetails/:id',deleteRecordDetailsHandler);




//handlers
function homeHandler(req,res) {
    let url='https://api.covid19api.com/world/total';
    superagent.get(url).then(data=>{
        console.log(data.body);
res.render('pages/home',{data:data.body});
    });
}

function getCountryResultHandler(req,res) {
    let country=req.query.country;
    let from=req.query.from;
    let to=req.query.to;

    let url=`https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
    superagent.get(url).then(data,()=>{
       let countryArr=data.body.map((item)=>{
return new Country(item)
       });
        
res.render('pages/getCountryResult',{data:countryArr});
    });

}

function allCountriesHandler(req,res) {
   

    let url=`https://api.covid19api.com/summary`;
    superagent.get(url).then(data,()=>{
       let countriesArr=data.body.Countries.map((item)=>{
return new AllCountries(item);
       });
        
res.render('pages/allCountries',{data:countriesArr});
    });

}
function myRecordsHandler(req,res) {
   let {country,totalconfirmed,totaldeaths,totalrecovered,date}=req.body;
let sql ='INSERT INTO contraries (country,totalconfirmed,totaldeaths,totalrecovered,date) VALUES ($1,$2,$3,$4,$5) RETURNING * ;';
let values=[country,totalconfirmed,totaldeaths,totalrecovered,date];
client.query(sql,values).then(results=>{
    res.redirect('/myRecords');

});
        

}
function getMyRecordsHandler(req,res) {
    
 let sql ='SELECT * FROM contraries;';
 client.query(sql).then(results=>{
     res.render('pages/myRecords',{data:results.rows});

 });     
 
 }

 function recordDetailsHandler(req,res) {
    let id=req.params.id;
    let sql ='SELECT * FROM contraries WHERE id=$id;';
    value=[id];
    client.query(sql,value).then(results=>{
        res.render(`pages/recordDetails/${id}`,{data:results.rows[0]});
   
    });     
    
    }
    function deleteRecordDetailsHandler(req,res) {
        let id=req.params.id;
        let sql ='DELETE FROM contraries WHERE id=$id;';
        value=[id];
        client.query(sql,value).then(results=>{
            res.redirect('/myRecords');
       
        });     
        
        }
    


//constructors
function Country(data) {
this.country=data.Country;
this.cases=data.Cases;
this.date=data.Date;
  
}

function AllCountries(data) {
    this.country=data.Country;
    this.totalconfirmed=data.TotalConfirmed;
    this.totaldeaths=data.TotalDeaths;
    this.totalrecovered=data.TotalRecovered;
    this.date=data.Date;
      
    }


//listening 
const PORT=process.env.PORT;
client.connect().then(()=>{
    app.listen(PORT,()=>{
        console.log(`listening on PORT ${PORT}`);
    });
});