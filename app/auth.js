const request = require('request-promise');

let authWrapper = (() => {
    _login = () => {
        return new Promise(function(resolve, reject) {
            logger.log('info', 'login');
            let apiUrl = config.apiUrl +'/login';
            console.log(config.apiUrl)
            let options = {
                method: "POST",
                uri: apiUrl,
                body: {
                  email:config.user.email,
                  password:config.user.password
                },
                json: true // Automatically stringifies the body to JSON
            };

            request(options)
                .then(function(result) {
                    resolve(result)
                })
                .catch(function(err) {
                    reject(err)
                });
        });
    };

    return {
        login: _login
    }
})();

module.exports = authWrapper;