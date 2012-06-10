var samurai = require('samurai');

samurai.setup({
  merchant_key: '31f8d0969c4b537f19279689',
  merchant_password: '55ce8121a1c6ebae6eae91cd',
  processor_token: 'e291c3af0fe36d2f8c216d99',
});

exports.samurai = samurai;