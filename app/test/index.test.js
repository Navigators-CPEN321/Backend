const test = require('firebase-functions-test')({
    databaseURL: 'https://axon-4b339.firebaseio.com',
    storageBucket: 'axon-4b339.appspot.com',
    projectId: 'axon-4b339',
  }, 'axon-4b339-abe96cfda9fc.json');

  const myFunctions = require('../index.js');

  