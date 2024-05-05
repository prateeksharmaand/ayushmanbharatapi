
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const compression = require('compression')
const dotenv = require('dotenv');


 
dotenv.config();

//const mongoString ="mongodb+srv://proacdoc:kioe6u1gXsM8eTMA@cluster0.wcsupz7.mongodb.net/?appName=Cluster0";

const mongoString = "mongodb+srv://proacdoc:kioe6u1gXsM8eTMA@cluster0.wcsupz7.mongodb.net/proacdoc?retryWrites=true&w=majority";


mongoose.connect(mongoString,{useNewUrlParser: true, useUnifiedTopology: true},{ poolSize: 10 });
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})
const app = express();
app.use(compression({level:6}));

app.use(cors())
app.use(express.json());

const routes = require('./routes/routes');

app.use('/api', routes)


app.listen(port = process.env.PORT||8080, () => {
   

    console.log(`Server Started at ${3001}`)
   
   
})

/* app.listen( process.env.PORT, () => {
    console.log(`Server Started at ${3000}`) 
}) */
  
