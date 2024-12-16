import pushkin from 'pushkin-api';
const express = require('express');
const router = express.Router();
const workersClient = require('pushkin-worker-client');
const knex = require('knex');

const db_read_queue = 'basic_path_quiz_dbread'; // simple endpoints
const db_write_queue = 'basic_path_quiz_dbwrite'; // simple save endpoints (durable/persistent)
const task_queue = 'basic_path_quiz_taskworker'; // for stuff that might need preprocessing

const myController = new pushkin.ControllerBuilder();
myController.setDefaultPasses(db_read_queue, db_write_queue, task_queue);

// Initialize database connection
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '',
    database: process.env.DB_DB || 'basic_path_db',
  },
});

// Add new endpoint to fetch experiment data
router.get('/getExperimentData', async (req, res) => {
  try {
    const userID = req.query.userID;
    const data = await db('basic_path_stimulusResponses')
      .where({ user_id: userID })
      .select('response');

    const keyPressData = data.map(item => item.response.key_press);
    res.json({ key_press: keyPressData });
  } catch (error) {
    console.error('Error in /getExperimentData:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add new endpoint to get prediction
router.post('/getPrediction', async (req, res) => {
  try {
    const { key_press } = req.body;
    const prediction = await workersClient.ask('getPrediction', { key_press });
    res.json({ prediction });
  } catch (error) {
    console.error('Error in /getPrediction:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
