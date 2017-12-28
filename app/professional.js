'use strict';

const request = require('request-promise'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    auth = require('./auth');

let professionalWrapper = (() =>{

    search = (professional, token) => {
        return new Promise((resolve, reject) => {
            let apiUrl = config.apiUrl;
            let name = typeof professional['extractor 1 1'] == 'undefined'? '': professional['extractor 1 1'].split(' ');
            let auth = 'Bearer '+token;
            let options = {
                method: "GET",
                uri: apiUrl +'/professionnal',
                qs: {
                    firstname: name[0],
                    lastname:name[1]
                },
                headers: {
                    'Authorization': auth,
                    'Connection': 'keep-alive'
                },
                json: true // Automatically parses the JSON string in the response
            };

            request(options)
                .then((result) => {
                    resolve(result);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    };

    update = (singleItem, office, token) => {
        return new Promise((resolve, reject) => {
            let addrArr = typeof singleItem['extractor 2 1'] == 'undefined'? '': singleItem['extractor 2 1'].split(',');
            let address = typeof addrArr[0] == 'undefined'? '': addrArr[0];
            let pinValie = typeof addrArr[1] == 'undefined'? '': addrArr[1].trim().split('   ');
            let phone = typeof singleItem['extractor 3 1'] ==  'undefined'? '': singleItem['extractor 3 1'].replace(/\s+/g, '');

            let auth = 'Bearer '+token;
            let options = {
                uri: config.apiUrl +'/office/'+office.id,
                method: "PUT",
                headers: {
                    'Authorization': auth,
                    'Connection': 'keep-alive'
                },
                body: {
                  phone:phone,
                  address: address,
                  postal_code: typeof pinValie[0] == 'undefined'? '': pinValie[0],
                  ville: typeof pinValie[1] == 'undefined'? '': pinValie[1]
                },
                json: true // Automatically parses the JSON string in the response
            };

            request(options)
                .then((result) => {
                    logMessage(`info`, `Professional updated.`, result);
                    resolve(result);
                })
                .catch((err) => {
                    logMessage(`info`, `Error while updating professional.`, singleItem);
                    reject(err);
                });
        });
    };

    updateProfessionalPhone = (singleItem, offices, token) => {
        let result = [];
        Promise.all(offices.map(async (singleOffice) => {
            let prof = await update(singleItem, singleOffice, token);
            result.push(prof);
        }));

        return result;
    };

    matchProfessionalWithAddress = (professional, professionals) => {
        let matchProfessional = [];
        professionals.forEach((singleProfessional) => {
            if(singleProfessional.offices){
                if(singleProfessional.offices.length){
                    let profArr = _.filter(singleProfessional.offices, {'address':professional['extractor 2 1']});
                    if(profArr) {
                       matchProfessional.push(singleProfessional);
                    };
                }
            }
        })
        return matchProfessional;
    };

    updateProfessional = async (singleItem, professionals, token) => {
        let result = [];
        if (professionals.length === 1) {
            if (professionals[0].offices) {
                let offices = professionals[0].offices;
                if (offices.length)
                    return result = await updateProfessionalPhone(singleItem, offices, token)
                else
                    logMessage(`info`, `Professional\'s office not found.`, singleItem);
            } else
                logMessage(`info`, `Professional\'s offices not found.`, singleItem);
        } else {
            let matchProfessional = await matchProfessionalWithAddress(singleItem, professionals)
            if(matchProfessional.length) {
                let offices = matchProfessional[0].offices;
                if (offices.length)
                    return result = await updateProfessionalPhone(singleItem, offices, token);
                else
                    logMessage(`info`, `Professional\'s offices not found.`, singleItem);
            } else
                logMessage(`info`, `Professional not found.`, singleItem);
        }
        return result;
    };

    _hydrateMissingPhone = (data) => {
        return new Promise((resolve, reject)=>{
            auth.login()
            .then((result) => {
                let updatedResult = [];

                data.forEach(async(singleItem) => {

                    let professionals = await search(singleItem, result.token);
                    if (professionals.length) {
                        let prof = await updateProfessional(singleItem, professionals, result.token);
                        if (prof.length)
                            updatedResult.push(prof);
                    } else
                        logMessage(`info`, `Professional not found.`, singleItem);
                });

                Promise.all(updatedResult).then(function() {
                    resolve({message:`Processing hydrating phone numbers done.`});
                }).catch((err) => {
                    reject({message:"Processing hydrating phone numbers failed.", err: err});
                });
            })
            .catch((err) => {
                reject(err)
            });
        });
    };

    return {
        hydrateMissingPhone: _hydrateMissingPhone
    }

    function logMessage( messageType, message, logData = '') {
      logger.log(messageType, message);
      logger.log(messageType, logData);
    }
})();

module.exports = professionalWrapper;
