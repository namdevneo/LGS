const request = require('request-promise'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    auth = require('./auth');

let professionalWrapper = (() =>{

    search = (professional, token) => {
        return new Promise((resolve, reject) => {
            let apiUrl = config.apiUrl;
            let name = professional['extractor 1 1'].split(' ');
            let auth = 'Bearer '+token;
            let options = {
                method: "GET",
                uri: apiUrl +'/professionnal',
                qs: {
                    firstname: name[0],
                    lastname:name[1]
                },
                headers: {
                    'Authorization': auth
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
            let addrArr = singleItem['extractor 2 1'].split(',');
            let address = addrArr[0];
            let pinValie = addrArr[1].trim().split('   ');
            let phone = singleItem['extractor 3 1'].replace(/\s+/g, '');

            let auth = 'Bearer '+token;
            let options = {
                uri: config.apiUrl +'/office/'+office.id,
                method: "PUT",
                headers: {
                    'Authorization': auth
                },
                body: {
                  phone:phone,
                  address: address,
                  postal_code:pinValie[0],
                  ville:pinValie[1]
                },
                json: true // Automatically parses the JSON string in the response
            };

            request(options)
                .then((result) => {
                   resolve(result);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    };


    updateProfessionalPhone = (singleItem, offices, token) => {
        let result = [];
         offices.forEach(async(singleOffice) => {
            if(!singleOffice.phone) {
               prof = await update(singleItem, singleOffice, token);
               result.push(prof);
               logger.log('info', 'updated professional');
               logger.log('info', result);
            }
        })
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

    updateProfessional = async(singleItem, professionals, token) => {
        let result = [];
        if (professionals.length === 1) {
            if (professionals[0].offices) {
                let offices = professionals[0].offices;
                if (offices.length) {
                    return result = await updateProfessionalPhone(singleItem, offices, token)
                }
            }
        } else {
            let matchProfessional = await matchProfessionalWithAddress(singleItem, professionals)
            if(matchProfessional.length) {
                let offices = matchProfessional[0].offices;
                if (offices.length) {
                    return result = await updateProfessionalPhone(singleItem, offices, token)
                }
            }
        }
        return result;
    };

    _hydrateMissingPhone = (data) => {
        return new Promise((resolve, reject)=>{
            auth.login()
                .then((result) => {
                    let updatedResult = [];
                    data.forEach((singleItem) => {
                        let professionals = await search(singleItem, result.token);
                        if(professionals.length) {
                            let prof = await updateProfessional(singleItem, professionals, result.token);
                            if(prof.length) {
                                updatedResult.push(prof);
                            }
                        }
                    });
                    resolve({message:"Processing hydrating phone numbers."});
                })
                .catch((err) => {
                    reject(err)
                });
        });
    };


    return {
        hydrateMissingPhone: _hydrateMissingPhone
    }

})();

module.exports = professionalWrapper;