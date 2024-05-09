// This is an application to create online courses also with that you can update,delete and view your courses

const {app} = require("./app")

const PORT = process.env.PORT ||3000 ;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

