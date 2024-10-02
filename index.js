const express = require('express')
const morgan = require('morgan')
const app = express()

app.use(express.json())

morgan.token('data', function (req, res) {
  return JSON.stringify(req.body) 
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))

let persons = [
  { 
    id: "1",
    name: "Arto Hellas", 
    number: "040-123456"
  },
  { 
    id: "2",
    name: "Ada Lovelace", 
    number: "39-44-5323523"
  },
  { 
    id: "3",
    name: "Dan Abramov", 
    number: "12-43-234345"
  },
  { 
    id: "4",
    name: "Mary Poppendieck", 
    number: "39-23-6423122"
  }
]

const generateId = () => {
  const max = 99999999;
  const randomId = Math.floor(Math.random() * max)
  return String(randomId)
}

const countPersons = () => {
  return persons.length
}

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

app.get('/info', (request, response) => {
  const count = 'Phonebook has info for ' + countPersons().toString() + ' people';
  const date = new Date()
  response.send(count + '<br/>' + date)
})

app.get('/api/persons', (request, response) => {
  response.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
  const id = request.params.id
  const person = persons.find(person => person.id === id)
  
  if(person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})

app.delete('/api/persons/:id', (request, response) => {
  const id = request.params.id
  persons = persons.filter(person => person.id !== id)

  response.status(204).end()
})

app.post('/api/persons', (request, response) => {
  const body = request.body

  if(!body.name || !body.number) {
    return response.status(400).json({ 
      error: 'name or number missing' 
    })
  }

  if(!validateName(body.name)) {
    return response.status(400).json({ 
      error: 'name must be unique' 
    })
  }

  const person = {
    name: body.name,
    number: body.number,
    id: generateId(),
  }

  persons = persons.concat(person)

  response.json(person)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})