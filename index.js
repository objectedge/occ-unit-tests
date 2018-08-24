const vorpal = require('vorpal')();
const commands = require('./commands');

commands.forEach(commandClass => {
  commandClass.prototype.vorpal = vorpal;
  new commandClass();
});

vorpal
    .delimiter('oe-dev-server$')
    .show();

