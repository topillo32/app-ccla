const express = require('express');
const axios = require('axios');
const app = express();
const https = require('https');
const cors = require('cors');
const fs = require('fs');
const querystring = require('querystring');
const admin = require("firebase-admin");
const dotenv = require('dotenv');
const bodyParser = require("body-parser");

const httpsOptions = {
  key: fs.readFileSync('/home/ccla1dm1n/privkey.pem'),
  cert: fs.readFileSync('/home/ccla1dm1n/cert.pem')
};



const serviceAccount = require('./credentials.json');

dotenv.config();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});


app.use(cors());


app.use(async (req, res, next) => {

  const idToken = req.headers.authtoken;

  if (!idToken) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Error al verificar el token" });
  }
});

app.get('/', (req, res) => {
  res.send('Node JS api');
});

app.post('/api/itsm3/', (req, res) => {

  let Descripcion = req.body.formState.Descripcion
  let Resolutor = req.body.formState.Resolutor
  let asignado_a = req.body.formState.asignado_a
  let estado = req.body.formState.estado
  let grupo = req.body.formState.grupo
  let id = req.body.formState.id
  let solicitante = req.body.formState.solicitante

  let codigo_cierre = req.body.formClose.codigo_cierre

  let comentarios = req.body.formClose.comentarios + " Ticket cerrado por resolutor: " + Resolutor

  let descripcion_cerrada = req.body.formClose.descripcion_cerrada

  let resolution_content = "Solcuionado ticket.";
  //let input_data = "{\"request\":{\"status\":{\"id\":\""+ id +"\"},\"closure_info\":{\"requester_ack_comments\":\"" + comentarios  +"\",\"closure_comments\":\""+descripcion_cerrada+"\",\"closure_code\":{\"id\":\""+codigo_cierre+"\"}},\"resolution\":{\"content\":\""+ +"\"}}}"

  let input_data = `{\"request\":{\"status\":{\"id\":\"3\"},\"update_reason\":\"${comentarios}\",\"closure_info\":{\"requester_ack_comments\":\"${comentarios}\",\"closure_comments\":\"${comentarios}\",\"closure_code\":{\"id\":\"${codigo_cierre}\"}},\"resolution\":{\"content\":\"${comentarios}\"},\"zia_properties\":{}}}`

  let input_data2 = "{\"request\":{\"status\":{\"id\":\"3\"},\"update_reason\":\"cerradoprueba\",\"closure_info\":{\"requester_ack_comments\":\"cerradopruebacerradopruebacerradopruebacerradoprueba\",\"closure_comments\":\"cerradoprueba\",\"closure_code\":{\"id\":\"1\"}},\"resolution\":{\"content\":\"<div>cerradopruebacerradopruebacerradoprueba<br></div>\"},\"zia_properties\":{}}}"

  // const cadenaJSON = JSON.stringify(input_data);
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  const numero_ticket = parseInt(id);
  const instance = axios.create({
    baseURL: process.env.API_URL,
    params: {
      TECHNICIAN_KEY: process.env.API_KEY
    },
    httpsAgent,
  });

  //"{\"request\":{\"status\":{\"id\":\"3\"},\"update_reason\":\"cerradoprueba\",\"closure_info\":{\"requester_ack_comments\":\"cerradopruebacerradopruebacerradopruebacerradoprueba\",\"closure_comments\":\"cerradoprueba\",\"closure_code\":{\"id\":\"1\"}},\"resolution\":{\"content\":\"<div>cerradopruebacerradopruebacerradoprueba<br></div>\"},\"zia_properties\":{}}}"

  const formData = new FormData();

  formData.append("input_data", input_data);

  const config = {

    headers: {

      'Content-Type': 'multipart/form-data' // Especificamos el Content-Type para el FormData

    }

  };

  const rq = `requests/${numero_ticket}`

  instance.put(rq, formData, config)

    .then(response => {

      res.send({ "data": "Exito!" });

    })

    .catch(error => {

      console.log();
      res.send(
        { "data": "Error!", 
          "detail" : error 
        }
      );

    });



});


app.get('/api/itsm3/:id', (req, res) => {

  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  const numero_ticket = parseInt(req.params.id);

  const instance = axios.create({
    baseURL: process.env.API_URL,
    params: {
      TECHNICIAN_KEY: process.env.API_KEY
    },
    httpsAgent,
  });

  const formData = new FormData();
  formData.append("input_data",
    {
      "list_info":
      {
        "row_count": "25",
        "start_index": 1,
        "get_total_count": true,
        "search_criteria":
          [
            {
              "field": "status",
              "values": [
                {
                  "id": "1",
                  "name": "Abierto"
                },
                { "id": "2", "name": "En Espera" },
                { "id": "6", "name": "En Progreso" },
                { "id": "603", "name": "N2 En Espera" },
                { "id": "5", "name": "Asignado" }
              ],
              "condition": "is",
              "logical_operator": "and"
            }
          ],
        "sort_field": "created_time",
        "sort_order": "desc",
        "fields_required": ["requester", "created_time", "dependency_status", "subject", "notification_status", "technician", "priority", "due_by_time", "site", "is_service_request", "has_notes", "id", "status", "group", "template", "category", "short_description", "has_attachments", "created_time", "responded_time", "completed_time", "resolved_time", "due_by_time", "is_overdue", "is_first_response_overdue", "status.in_progress", "status.stop_timer", "is_editing_completed", "first_response_due_by_time", "is_fcr", "onhold_scheduler.change_to_status", "onhold_scheduler.scheduled_time", "onhold_scheduler.held_by", "editor", "editing_status", "is_read", "unreplied_count", "cancel_requested_is_pending", "lifecycle"]
      }, "for": "advanced_search_filter"
    });

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data' // Especificamos el Content-Type para el FormData
    }
  };

  const rq = `requests/${numero_ticket}`

  instance.get(rq, formData, config)
    .then(response => {
      res.send(response.data);
    })
    .catch(error => {
      res.send(error);
    });

});


app.get('/api/itsm3/', (req, res) => {


  let indice = req.query.index;

  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  const numero_ticket = parseInt(req.params.id);

  let input_data = {
    "list_info": {
      "row_count": "10",
      "start_index": indice,
      "get_total_count": true,
      "search_criteria": [
        {
          "field": "status",
          "values": [
            {
              "id": "1",
              "name": "Abierto"
            },
            {
              "id": "2",
              "name": "En Espera"
            },
            {
              "id": "6",
              "name": "En Progreso"
            },
            {
              "id": "603",
              "name": "N2 En Espera"
            },
            {
              "id": "5",
              "name": "Asignado"
            }
          ],
          "condition": "is",
          "logical_operator": "and"
        },
        {
          "field": "group",
          "values": [
            {
              "id": "1203",
              "name": "REGIONES - TERRENO COASIN"
            },
            {
              "id": "3001",
              "name": "SOPORTE CAMPO RM"
            },
            {
              "id": "601",
              "name": "TERRENO COASIN"
            }
          ],
          "condition": "is",
          "logical_operator": "and"
        }
      ],
      "sort_field": "created_time",
      "sort_order": "desc",
      "fields_required": [
        "id",
        "status",
        "requester",
        "group",
        "technician",
        "created_time",
        "due_by_time",
        "sla",
        "short_description",
        "subject",
        "update_reason",
        "closure_info",
        "closure_info",
        "closure_comments",
        "closure_code",
        "resolution"
      ]
    },
    "for": "advanced_search_filter"
  }

  const objetoUrlEncoded = querystring.stringify(input_data);

  const cadenaJSON = JSON.stringify(input_data);

  const cadenaURLEncoded = encodeURIComponent(cadenaJSON);

  const instance = axios.create({
    baseURL: process.env.API_URL, // 'https://172.31.4.35/api/v3/'
    params: {
      TECHNICIAN_KEY: process.env.API_KEY
    },
    httpsAgent,
  });

  const formData = new FormData();
  //formData.append("input_data", cadenaURLEncoded );

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data' // Especificamos el Content-Type para el FormData
    }
  };

  const rq = `requests?input_data=${cadenaURLEncoded}`


  instance.get(rq, config)
    .then(response => {

      res.send(response.data);
    })
    .catch(error => {
      console.error(error);
      res.send({ "data": "Error!" });
      
    });


});

const port = process.env.port || 4433;

//app.listen(port, () => console.log(`Escuchando en puerto ${port}...`));

https.createServer(httpsOptions, app)
  .listen(port, function (req, res) {                        //Change Port Number here (if required, 443 is the standard port for https)
    console.log("Server started at port 4433");                //and here 
  });

