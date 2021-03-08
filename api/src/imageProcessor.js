const path = require('path');

const {Worker, isMainThread} = require('worker_threads');

const pathToResizeWorker = path.resolve(__dirname, 'resizeWorker.js');
const pathToMonochromeWorker = path.resolve(__dirname, 'monochromeWorker.js');

const uploadPathResolver = (filename) => {
    return path.resolve(__dirname, '../uploads', filename);
}

const imageProcessor = (filename) => {
    const sourcePath = uploadPathResolver(filename);
    const resizedDestination = uploadPathResolver('resized-' + filename);
    const monochromeDestination = uploadPathResolver('monochrome-' + filename);
    let resizedWorkerFinsihed = false;
    let monochromeWorkerFinished = false;
   
    return new Promise((resolve, reject) => {
        if (isMainThread) {
            try {
                const resizeWorker = new Worker(pathToResizeWorker, {
                    workerData: {
                        source: sourcePath,
                        destination: resizedDestination,
                    },
                });

                const monochromeWorker = new Worker(pathToMonochromeWorker, {
                    workerData: {
                        source: sourcePath,
                        destination: monochromeDestination,
                    },
                });

                resizeWorker.on('message', (message) => {
                    resizedWorkerFinsihed = true;

                    if (monochromeWorkerFinished) {
                        resolve('resizeWorker finished processing');
                    }
                });

                resizeWorker.on('error', (error) => {
                    reject(new Error(error.message));
                });

                resizeWorker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error('exited with status code ' + code));
                    }
                });

                monochromeWorker.on('message', (message) => {
                    monochromeWorkerFinsihed = true;

                    if (resizedWorkerFinsihed) {
                        resolve('monochromeWorker finished processing');
                    }
                });

                monochromeWorker.on('error', (error) => {
                    reject(new Error(error.message));
                });

                monochromeWorker.on('exit', (code) => {
                    if (code !== 0) {
                        reject(new Error('exited with status code ' + code));
                    }
                });

            } catch (error) {
                reject(error);
            }
        } else {
            reject(new Error('Not on main thread'));
        }
    });
};


module.exports = imageProcessor;
