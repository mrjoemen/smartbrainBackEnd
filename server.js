const express = require('express');
const app = express();
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors') //this allows the front end to gain access to the backend, w/o this, it would be blocked by Google Chrome
const db = require('knex')({
    client: 'pg',
    version: '7.17.1',
    connection: {
      host : '127.0.0.1', //this is localhost
      user : 'smartbrain',
      password : 'zkozpyz$A137',
      database : 'smartbrain'
    }
  });

app.use(cors())
app.use(express.json()) // be sure to always use this middleware parse the json data from the requests

app.get('/', (req, res) => {
    res.send(database.users)
})

app.post('/signin', (req,res) => {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid) {
            return db.select('*').from('users') // always return so that database  
                .where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post("/register", (req, res) => {
    const { email, name, password } = req.body //destructuring version, translates to: email = req.body.email ans so forth
    const hash = bcrypt.hashSync(password)
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*') // this returning statement allows us to see the data from the database, like console.log
            .insert({ //id and rank is automatically created by the database
                email: loginEmail[0],
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0])
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json(err))

})

app.get("/profile/:id", (req, res) => {
    const { id } = req.params; // request.params is the ids that are in the URL
    db.select('*').from('users').where({id})
    .then(user => {
        if (user.length) {
            res.json(user[0])
        } else {
            res.status(400).json('getting user error')
        }
    }).catch(err => res.status(400).json(err))
})

app.put("/image", (req, res) => {
    const { id } = req.body; // request.params is the ids that are in the URL
    db('users').where('id', '=', id)
    .increment('rank')
    .returning('rank')
    .then(rank => {
        res.json(rank[0]);
    })
    .catch(err => res.status(400).json('unable to receive rank')) //if using catch, remember to input err =>, if not then you will get set header error, hard to debug
})

app.listen(process.env.PORT, ()=> {
    console.log(`app is running on port ${process.env.PORT}`)
})

console.log(process.env)

/*
//DESIGN OF THIS API
------------------------------------
http://localhost:3000/ --> this is working
http://localhost:3000/signin --> POST = success/fail (boolean?)
http://localhost:3000/register --> POST = user
http://localhost:3000/profile/:userId --> GET = user
http://localhost:3000/image --> PUT = user
*/