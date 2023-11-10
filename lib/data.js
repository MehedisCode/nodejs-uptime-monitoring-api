// dependencies
const fs = require('fs');
const path = require('path');

// Object - module scaffolding
const lib = {};

lib.baseDir = path.join(__dirname, '../.data/');

lib.create = (dir, file, data, callback) => {
    fs.open(`${lib.baseDir + dir}/${file}.json`, 'w', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, (err2) => {
                if (!err2) {
                    fs.close(fileDescriptor, (err3) => {
                        if (!err3) {
                            callback(false);
                        } else {
                            callback('Error while closing file');
                        }
                    });
                } else {
                    callback('Error while writing the file');
                }
            });
        } else {
            callback("couldn't open the file, file may already exits");
            // callback(err);
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir + dir}/${file}.json`, 'utf8', (err, data) => {
        callback(err, data);
    });
};

lib.update = (dir, file, data, callback) => {
    fs.open(`${lib.baseDir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            const stringData = JSON.stringify(data);
            fs.ftruncate(fileDescriptor, (err4) => {
                if (!err4) {
                    fs.writeFile(fileDescriptor, stringData, (err2) => {
                        if (!err2) {
                            fs.close(fileDescriptor, (err3) => {
                                if (!err3) {
                                    callback(false);
                                } else {
                                    callback('error on closing file');
                                }
                            });
                        } else {
                            callback('error on writting file');
                        }
                    });
                } else {
                    callback('error on trancating');
                }
            });
        } else {
            callback('error opening the file');
            // callback(err);
        }
    });
};

lib.delete = (dir, file, callback) => {
    fs.unlink(`${lib.baseDir + dir}/${file}.json`, (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('error deleting the file');
        }
    });
};

lib.list = (dir, callback) => {
    fs.readdir(`${lib.baseDir + dir}/`, (err, fileNames) => {
        if (!err && fileNames && fileNames.length > 0) {
            const trimmedFileNames = [];
            fileNames.forEach((fileName) => {
                trimmedFileNames.push(fileName.replace('.json', ''));
            });
            callback(false, trimmedFileNames);
        } else {
            callback('Error reading directory');
        }
    });
};

module.exports = lib;
