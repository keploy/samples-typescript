require('typescript-sdk/dist/integrations/node-fetch/require');

const fullName = async () => {
  let res = await fetch('https://reqres.in/api/users/2')
  res = await res.json()
  const fullname = `${res.data.first_name} ${res.data.last_name}`
  return fullname
}

const email = async () => {
  let res = await fetch('https://reqres.in/api/users/2')
  res = await res.json()
  return res.data.email
}

module.exports = { fullName, email }
