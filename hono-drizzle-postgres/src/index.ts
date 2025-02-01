import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import authRoutes from './routes/authRoutes.js'
import todoRoutes from './routes/todoRoutes.js'
import dotenv from 'dotenv'

dotenv.config()


const port = 3000
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})


app.route('/auth', authRoutes)
app.route('/todo', todoRoutes)

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
