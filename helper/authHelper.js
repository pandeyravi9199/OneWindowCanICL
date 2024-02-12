const bcrypt = require('bcrypt')

// bcrypt password

exports.hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                reject(err)
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    reject(err)
                }
                resolve(hash)
            })
        })
    })
}

// bcrypt cpassword
exports.hashCpassword = (cpassword) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                reject(err)
            }
            bcrypt.hash(cpassword, salt, (err, hash) => {
                if (err) {
                    reject(err)
                }
                resolve(hash)
            })
        })
    })
}

// Compare || Dcrypt

exports.comparePassword = (password, hashed) => {
    return bcrypt.compare(password, hashed)
}