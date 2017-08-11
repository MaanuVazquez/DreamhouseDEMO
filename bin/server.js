'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressFileupload = require('express-fileupload');

var _expressFileupload2 = _interopRequireDefault(_expressFileupload);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const app = (0, _express2.default)();

app.use(_express2.default.static(_path2.default.join(__dirname, '../www')));
app.use(_express2.default.static(_path2.default.join(__dirname, '../www', 'build')));
app.use((0, _expressFileupload2.default)());
app.use(_bodyParser2.default.json());

_helpers2.default.initialize().then(() => {
	_helpers2.default.getAllProperties().then(properties => {
		_helpers2.default.propertiesWithProbabilities = properties;
		_helpers2.default.propertiesWithProbabilities.forEach(property => {
			let url = `${_helpers2.default.dreamhouseEinsteinVisionUrl}/predict-from-url?sampleLocation=${property.picture__c}`;
			require('request').post({ url: url }, (err, httpResponse, body) => {
				try {
					let json = JSON.parse(body);
					property.probabilities = json.probabilities;
				} catch (error) {
					property.probabilities = [];
				}
			});
		});
	});
}).then(() => {
	app.get('/property', (() => {
		var _ref = _asyncToGenerator(function* (req, res) {
			try {
				const json = yield _helpers2.default.getAllProperties();
				res.json(json);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x, _x2) {
			return _ref.apply(this, arguments);
		};
	})());

	app.get('/property/:id', (() => {
		var _ref2 = _asyncToGenerator(function* (req, res) {
			try {
				const json = yield _db2.default.query(`SELECT ${_helpers2.default.propertyTable}.*, ${_helpers2.default.brokerTable}.sfid AS broker__c_sfid,
		  													 ${_helpers2.default.brokerTable}.name AS broker__c_name, ${_helpers2.default.brokerTable}.email__c AS broker__c_email__c,
		  													 ${_helpers2.default.brokerTable}.phone__c AS broker__c_phone__c, ${_helpers2.default.brokerTable}.mobile_phone__c AS broker__c_mobile_phone__c,
		  													 ${_helpers2.default.brokerTable}.title__c AS broker__c_title__c, ${_helpers2.default.brokerTable}.picture__c AS broker__c_picture__c FROM ${_helpers2.default.propertyTable} 
		  													 INNER JOIN ${_helpers2.default.brokerTable} ON ${_helpers2.default.propertyTable}.broker__c = ${_helpers2.default.brokerTable}.sfid 
		  													 WHERE ${_helpers2.default.propertyTable}.sfid = $1`, [req.params.id]);
				res.json(json.rows[0]);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x3, _x4) {
			return _ref2.apply(this, arguments);
		};
	})());

	app.get('/favorite', (() => {
		var _ref3 = _asyncToGenerator(function* (req, res) {
			try {
				const data = yield _db2.default.query(`SELECT ${_helpers2.default.propertyTable}.*, ${_helpers2.default.favoriteTable}.sfid AS favorite__c_sfid FROM ${_helpers2.default.propertyTable}, 
		  																${_helpers2.default.favoriteTable} WHERE ${_helpers2.default.propertyTable}.sfid = ${_helpers2.default.favoriteTable}.property__c`);
				res.json(data.rows);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x5, _x6) {
			return _ref3.apply(this, arguments);
		};
	})());

	app.post('/favorite', (() => {
		var _ref4 = _asyncToGenerator(function* (req, res) {
			try {
				const data = yield _db2.default.query(`INSERT INTO ${_helpers2.default.favoriteTable} (property__c) VALUES ($1)`, [req.body.property__c]);
				res.json(data);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x7, _x8) {
			return _ref4.apply(this, arguments);
		};
	})());

	app.delete('/favorite/:sfid', (() => {
		var _ref5 = _asyncToGenerator(function* (req, res) {
			try {
				const data = yield _db2.default.query(`DELETE FROM ${_helpers2.default.favoriteTable} WHERE sfid = $1`, [req.params.sfid]);
				res.json(data);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x9, _x10) {
			return _ref5.apply(this, arguments);
		};
	})());

	app.get('/broker', (() => {
		var _ref6 = _asyncToGenerator(function* (req, res) {
			try {
				const data = yield _db2.default.query(`SELECT * FROM ${_helpers2.default.brokerTable}`);
				res.json(data.rows);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x11, _x12) {
			return _ref6.apply(this, arguments);
		};
	})());

	app.get('/broker/:sfid', (() => {
		var _ref7 = _asyncToGenerator(function* (req, res) {
			try {
				const data = yield _db2.default.query(`SELECT * FROM ${_helpers2.default.brokerTable} WHERE sfid = $1`, [req.params.sfid]);
				res.json(data.rows[0]);
			} catch (e) {
				console.log(e);
			}
		});

		return function (_x13, _x14) {
			return _ref7.apply(this, arguments);
		};
	})());

	app.post('/search', (req, res) => {
		let url = `${_helpers2.default.dreamhouseEinsteinVisionUrl}predict`;

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

		require('request').post({ url: url, formData: formData }, (err, httpResponse, body) => {
			if (err) {
				console.err(err);
				res.send(err);
			} else {
				console.log(body);
				const json = JSON.parse(body);
				// find the properties that most closely match the predictions
				const predictionsWithScores = _helpers2.default.propertiesWithProbabilities.map(property => {
					const score = property.probabilities.reduce((acc, val) => {
						const propertyProbability = val.probability;
						const uploadProbability = json.probabilities.find(probability => probability.label === val.label).probability;
						return acc + Math.pow(propertyProbability + uploadProbability, 2);
					}, 0);
					property.score = score;
					return property;
				});

				predictionsWithScores.sort(function (a, b) {
					if (a.score > b.score) {
						return -1;
					} else if (a.score < b.score) {
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