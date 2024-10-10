require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

const url = process.env.MONGODB_URI;

morgan.token('data', function (req, res) {
  return JSON.stringify(req.body) 
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))

let persons = []

const validateName = (enteredName) => {
  const nameUnique = persons.find(({name}) => name.toLowerCase() === enteredName.toLowerCase())
  if(nameUnique === undefined) {
    return true
  }

  return false
}

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/info', (request, response, next) => {
  const date = new Date()

  Person.find({})
    .then(persons => {
      response.send(
        `<p>Phonebook has info for ${persons.length} people</p>
        <p>${date}</p>`
      )
    })
    .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then(persons => {
      response.json(persons)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if(person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      if(result === null) {
        return response.status(400).json({ 
          error: 'This person has already been deleted' 
        })
      } else {
        response.status(204).end()
      }
    })
    .catch(error => {
      next(error)
    } )
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if(!body.name || !body.number) {
    return response.status(400).json({ 
      error: 'Name or number missing' 
    })
  }

  if(!validateName(body.name)) {
    return response.status(400).json({ 
      error: 'Name must be unique'
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  const person = {
    name: name,
    number: number,
  }

  Person.findByIdAndUpdate(
    request.params.id, 
    person, 
    { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// this has to be the last loaded middleware, also all the routes should be registered before this!
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})