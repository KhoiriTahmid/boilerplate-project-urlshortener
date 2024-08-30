require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('node:dns');
const {URL} = require('node:url');
const mongoose  = require('mongoose');
const number = 0;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

mongoose
.connect(process.env.DB)
.catch(e=>console.log("cant connect : " + e))

let Schema = new mongoose.Schema({
  original_url: {
    type : String,
    required : true,
  },
  short_url: {
    type : Number,
    required : true,
    unique : true
  },
})

const Model = mongoose.model('tabel1', Schema);

async function findDocByShortUrl(param) {
  return await Model
      .findOne((typeof(param)=="number")?{short_url:param}:{original_url:param})
      .then((result)=> result)
      .catch(e=>"gagal find : "+e) 
}

async function addDoc (original_url, short_url) {
  const newData = new Model({
    original_url,
    short_url
  })
  
  return await newData.save() // return result without callback
}

// Your first API endpoint
app.post('/api/shorturl', express.urlencoded(), async function(req, res) {

  let cleanUrl;
  
  try {
    // Attempt to create a URL object
    cleanUrl = new URL(req.body.url);
  } catch (err) {
    // If it fails, respond with an error
    return res.json({ error: 'invalid url' });
  }
  
  dns.lookup(cleanUrl.hostname, async (err, address, family) => {
    if (err||!address) return res.json({ error: 'invalid url' });

    const data = await findDocByShortUrl(req.body.url)    

    if(data){
      res.json({original_url:data.original_url,short_url: data.short_url})
    }else{
      const docLen = await Model.countDocuments({})
      const result = await addDoc(req.body.url, docLen+1)
      res.json({original_url:result.original_url,short_url: result.short_url})
    }
  })
});

app.get(`/api/shorturl/:id`, async function(req, res) {
  const data = await findDocByShortUrl(Number(req.params.id)) 

  if(data){
    res.redirect(data.original_url)
  }else{
    res.json({ error: 'invalid url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
