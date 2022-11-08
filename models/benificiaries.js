const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const benificiariesSchema = new mongoose.Schema({
    baniid :{
        
        type: Number
    },
    beniUserId :{
        
        type: Number
    },

    
    beniname :{
        
        type: String
    },
    lastname :{
        
        type: String
    },
    age:{
        type: Number
    },
    gender:{
        type: String
    },

    abhaid:{
        type: String
    },
    abhanumber:{
        type: String
    },
    qrurl:{
        type: String
    },
    token:{
        type: String
    },
    refreshToken:{
        type: String
    },
   
})

module.exports = mongoose.model('benificiariesSchema',benificiariesSchema)
