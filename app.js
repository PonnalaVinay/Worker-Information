const session = require('express-session');
const axios = require('axios');
const express = require('express');
const app = express();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
var serviceAccount = require('./samplekey.json');
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // Set EJS as the view engine
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));
app.get('/', function (req, res) {
  res.render('login'); // Render the login.ejs view
});
app.get('/signup', function (req, res) {
  res.render('signup'); // Render the signup.ejs view
});
app.get('/signupSubmit', function (req, res) {
  const FullName = req.query.fullname;
  const Mail = req.query.email;
  const Password = req.query.password;
  db.collection('Information').add({
    Name: FullName,
    Email: Mail,
    password: Password,
  }).then(() => {
    res.redirect("/Display");
  });
});
app.get('/login', function (req, res) {
  res.render('login'); // Render the login.ejs view
});
app.get('/signIn', function (req, res) {
  db.collection('Information').where('Email', '==', req.query.gmail).where('password', '==', req.query.security).get()
    .then((docs) => {
      if (docs.size > 0) {
        req.session.user = {
          email: req.query.gmail,
          authenticated: true
        };
        res.redirect("/Display");
      } else {
        res.send("Fail");
      }
    });
});
app.get('/Display', function (req, res) {
  if (req.session.user && req.session.user.authenticated) {
    res.render('Display'); // Render the dashboard.ejs view
  } else {
    res.redirect('/login');
  }
});
app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error("Error destroying session:", err);
    }
    // Redirect to the login page after logout
    res.redirect("/login");
  });
});

app.get('/bass', function (req, res) {
  res.render('bass'); // Render the bass.ejs view
});
app.get('/basss', function (req, res) {
  res.render('basss'); // Render the basss.ejs view
});
const maxWorkers = 25;
app.get('/In', async function (req, res) {
  try {
    const place1 = req.query.locality.toLowerCase();
    const place2 = req.query.locality2.toLowerCase();
    const place3 = req.query.locality3.toLowerCase();
    const date = req.query.date;
    const worker = req.query.worker.toLowerCase();
    async function fetchCityCoordinates(city) {
      try {
        const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
          params: {
            q: city,
            key:'f62dd8f2c0b5434cbcfe2af0036ca111', 
          },
        });
        const latitude = response.data.results[0].geometry.lat;
        const longitude = response.data.results[0].geometry.lng;
        return {
          latitude: latitude,
          longitude: longitude,
        };
      } catch (error) {
        console.error('Error fetching coordinates:', error);
        throw error; // Re-throw the error to handle it in the caller function
      }
    }
    // Fetch worker information for place1
    const coordinates1 = await fetchCityCoordinates(place1);
    const coordinates2 = await fetchCityCoordinates(place2);
    const coordinates3 = await fetchCityCoordinates(place3);
    const querySnapshotPlace1 = await db
      .collection('Worker Information')
      .where('freetime', '==', date)
      .where('Occupation', '==', worker)
      .where('Location', '==', place1)
      .limit(maxWorkers)
      .get();
      const querySnapshotPlace2 = await db
      .collection('Worker Information')
      .where('freetime', '==', date)
      .where('Occupation', '==', worker)
      .where('Location', '==', place2)
      .limit(maxWorkers)
      .get();
      const querySnapshotPlace3 = await db
      .collection('Worker Information')
      .where('freetime', '==', date)
      .where('Occupation', '==', worker)
      .where('Location', '==', place3)
      .limit(maxWorkers)
      .get();
    const workerRowsPlace1 = [];
    let naturalIndexPlace1 = 1;
    querySnapshotPlace1.forEach((doc) => {
      const number = doc.get('Number');
      const name = doc.get('Name');
      let row = `<tr><td>${naturalIndexPlace1}</td><td>${name}</td><td>${number}</td></tr>`;
      workerRowsPlace1.push(row);
      naturalIndexPlace1++;
    });
    const workerRowsPlace2 = [];
    let naturalIndexPlace2 = 1;
    querySnapshotPlace2.forEach((doc) => {
      const number = doc.get('Number');
      const name = doc.get('Name');
      let row = `<tr><td>${naturalIndexPlace2}</td><td>${name}</td><td>${number}</td></tr>`;
      workerRowsPlace2.push(row);
      naturalIndexPlace2++;
    });
    const workerRowsPlace3 = [];
    let naturalIndexPlace3 = 1;
    querySnapshotPlace3.forEach((doc) => {
      const number = doc.get('Number');
      const name = doc.get('Name');
      let row = `<tr><td>${naturalIndexPlace3}</td><td>${name}</td><td>${number}</td></tr>`;
      workerRowsPlace3.push(row);
      naturalIndexPlace3++;
    });
    // Render tables for all places
    const tablePlace1 = createTable(workerRowsPlace1);
    const tablePlace2 = createTable(workerRowsPlace2);
    const tablePlace3 = createTable(workerRowsPlace3);
    const finalTable = tablePlace1 +'<br><br><br>'+ tablePlace2 +'<br><br><br>'+tablePlace3;
    res.send(finalTable);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Error occurred while processing the request.Please enter proper city name');
  }
});
function createTable(rows) {
  const tableRows = rows.join('');
  const table = `<table border="2" style="background:#81ecec;margin-left:550px">
                  <tr>
                    <th>Natural Index</th>
                    <th>Name</th>
                    <th>Number</th>
                  </tr>
                  ${tableRows}
                </table>`;
  // Set the background color of the entire page to red
  const Background = `<body style="background:#00cec9;">
                                    ${table}
                                  </body>`;
  
  return Background;
}
app.get('/Out', async function (req, res) {
    try {
      const fullname = req.query.persons;
      const mobilenumber = req.query.phnos;
      const originate = req.query.localitys.toLowerCase(); 
      const work = req.query.workers.toLowerCase();
      const time = req.query.dates;
      async function fetchCityCoordinates(city) {
        try {
          const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
              q: city,
              key: 'f62dd8f2c0b5434cbcfe2af0036ca111',
         } });
  
          if (response.data.results.length === 0) {
            // City not found in the API response
            throw new Error('City not found');
          }
          const latitude = response.data.results[0].geometry.lat;
          const longitude = response.data.results[0].geometry.lng;
          return {
            latitude: latitude,
            longitude: longitude,
          };
        } catch (error) {
          console.error('Error fetching coordinates:', error);
          throw error; // Re-throw the error to handle it in the caller function
        }
      }
      // Fetch coordinates for the 'originate' city
      const coordinates = await fetchCityCoordinates(originate);
      db.collection('Worker Information').add({
        Name: fullname,
        Number: mobilenumber,
        Location: originate,
        Occupation: work,
        freetime: time,
    }).then
      res.send('Registered successfully');
    } catch (error) {
      console.error('Error occurred:', error);
      if (error.message === 'City not found') {
        res.status(400).send('You entered an incorrect city name.');
      } else {
        res.status(500).send('Error occurred while processing the request.');
      }
    }
  });
  app.listen(4000);
  
  