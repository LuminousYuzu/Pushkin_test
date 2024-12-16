const workers = require('pushkin-worker');
const amqp = require('amqplib');
const pWorker = workers.pushkinWorker;
const defaultHandler = workers.defaultHandler;

const options = {
	amqpAddress: process.env.AMQP_ADDRESS || 'amqp://rabbitmq',
	readQueue: 'basic_path_quiz_dbread',
	writeQueue: 'basic_path_quiz_dbwrite',
	taskQueue: 'basic_path_quiz_taskworker',
};

const dbConnection = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DB,
};

const transactionOps = {
	tableName: 'transactions',
	connection: {
			host: process.env.TRANS_HOST,
			user: process.env.TRANS_USER,
			password: process.env.TRANS_PASS,
			database: process.env.TRANS_DB,
	}
}

const worker = new pWorker(options);

async function sendToPythonWorker(message) {
	const connection = await amqp.connect(process.env.AMQP_ADDRESS || 'amqp://rabbitmq');
	const channel = await connection.createChannel();
	const queue = 'basic_path_python_worker';

	const correlationId = generateUuid();
	const { queue: replyQueue } = await channel.assertQueue('', { exclusive: true });

	return new Promise((resolve, reject) => {
		channel.consume(
			replyQueue,
			(msg) => {
				if (msg.properties.correlationId === correlationId) {
					const result = JSON.parse(msg.content.toString());
					resolve(result);
					connection.close();
				}
			},
			{ noAck: true }
		);

		channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
			correlationId: correlationId,
			replyTo: replyQueue,
		});
	});
}

function generateUuid() {
	return (
		Math.random().toString() +
		Math.random().toString() +
		Math.random().toString()
	);
}

worker.init()
	.then(() => {
		worker.handle('getPrediction', async (data) => {
			console.log(`Received data for prediction: ${data}`);
			const result = await sendToPythonWorker({ key_press: data.key_press });
			console.log(`Prediction result: ${result.prediction}`);
			return result.prediction;
		});
		worker.useHandler(defaultHandler, dbConnection, 'basic_path', transactionOps);
		worker.start();
	})
	.catch(err => {
		console.error(`Failed to initialize worker: ${err}`);
	});

