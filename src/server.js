'use strict';

import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import db from './db';
import controller from './helpers';
const app = express();

app.use(express.static(path.join(__dirname, '../www')));
app.use(express.static(path.join(__dirname, '../www', 'build')));
app.use(fileUpload());
app.use(bodyParser.json());

controller.initialize().then(() => {
	controller.getAllProperties().then((properties) => {
		controller.propertiesWithProbabilities = properties;
	  controller.propertiesWithProbabilities.forEach((property) => {
	    let url = `${controller.dreamhouseEinsteinVisionUrl}/predict-from-url?sampleLocation=${property.picture__c}`;
	    require('request').post({url: url}, (err, httpResponse, body) => {
	      try {
	        let json = JSON.parse(body);
	        property.probabilities = json.probabilities;
	      }
	      catch (error) {
	        property.probabilities = [];
	      }
	    });
	  });
	});
}).then(() => {
	app.get('/property', async (req, res) => {
		try {
		 	const json = await controller.getAllProperties();
		 	res.json(json);
		} catch(e) {
			console.log(e);
		}
	});

	app.get('/property/:id', async (req, res) => {
		try {
		  const json = await db.query(`SELECT ${controller.propertyTable}.*, ${controller.brokerTable}.sfid AS broker__c_sfid,
		  													 ${controller.brokerTable}.name AS broker__c_name, ${controller.brokerTable}.email__c AS broker__c_email__c,
		  													 ${controller.brokerTable}.phone__c AS broker__c_phone__c, ${controller.brokerTable}.mobile_phone__c AS broker__c_mobile_phone__c,
		  													 ${controller.brokerTable}.title__c AS broker__c_title__c, ${controller.brokerTable}.picture__c AS broker__c_picture__c FROM ${controller.propertyTable} 
		  													 INNER JOIN ${controller.brokerTable} ON ${controller.propertyTable}.broker__c = ${controller.brokerTable}.sfid 
		  													 WHERE ${controller.propertyTable}.sfid = $1`, [req.params.id]);
		  res.json(json.rows[0]);
	  } catch(e) {
			console.log(e);
		}
	});

	app.get('/favorite', async (req, res) => {
		try {
		  const data = await db.query(`SELECT ${controller.propertyTable}.*, ${controller.favoriteTable}.sfid AS favorite__c_sfid FROM ${controller.propertyTable}, 
		  																${controller.favoriteTable} WHERE ${controller.propertyTable}.sfid = ${controller.favoriteTable}.property__c`);
		  res.json(data.rows);
	  } catch(e) {
			console.log(e);
		}
	});

	app.post('/favorite', async (req, res) => {
		try {
		  const data = await db.query(`INSERT INTO ${controller.favoriteTable} (property__c) VALUES ($1)`, [req.body.property__c]);
	    res.json(data);
		} catch(e) {
			console.log(e);
		}
	});

	app.delete('/favorite/:sfid', async (req, res) => {
		try {
		  const data = await db.query(`DELETE FROM ${controller.favoriteTable} WHERE sfid = $1`, [req.params.sfid]);
		  res.json(data);
	  } catch(e) {
			console.log(e);
		}
	});

	app.get('/broker', async (req, res) => {
		try {
		  const data = await db.query(`SELECT * FROM ${controller.brokerTable}`);
		  res.json(data.rows);
	  } catch(e) {
	  	console.log(e);
	  }
	});

	app.get('/broker/:sfid', async (req, res) => {
		try {
		  const data = await db.query(`SELECT * FROM ${controller.brokerTable} WHERE sfid = $1`, [req.params.sfid]);
		  res.json(data.rows[0]);
	  } catch(e) {
	  	console.log(e);
	  }
	});

	app.post('/search', (req, res) => {
	  let url = `${controller.dreamhouseEinsteinVisionUrl}predict`;

	  let formData = {
	    filename: req.files.image.name,
	    sampleContent: {
	      value: req.files.image.data,
	      options: {
	        filename: req.files.image.name,
	        contentType: req.files.image.mimetype
	      }
	    }
	  };

	  require('request').post({url: url, formData: formData}, (err, httpResponse, body) => {
	    if (err) {
	      console.err(err);
	      res.send(err);
	    } else {
	    	console.log(body);
	      const json = JSON.parse(body);
	      // find the properties that most closely match the predictions
	      const predictionsWithScores = controller.propertiesWithProbabilities.map((property) => {
	        const score = property.probabilities.reduce((acc, val) => {
	          const propertyProbability = val.probability;
	          const uploadProbability = json.probabilities.find((probability) => probability.label === val.label).probability;
	          return acc + Math.pow(propertyProbability + uploadProbability, 2);
	        }, 0);
	        property.score = score;
	        return property;
	      });

	      predictionsWithScores.sort(function(a, b) {
	        if (a.score > b.score) {
	          return -1;
	        }else if (a.score < b.score) {
	          return 1;
	        } else {
	          return 0;
	        }
	      });

	      res.send(predictionsWithScores.slice(0, 5));
	    }
	  });
	});

}).then(() => {
	const port = process.env.PORT || 8200;
	app.listen(port);
	console.log(`[DREAMHOUSEAPP] Running on http://localhost:${port}`);
});
	
