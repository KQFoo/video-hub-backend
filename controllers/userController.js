const db = require('../config/db');
const { playlist, user, video } = db.models;
const bcrypt = require('bcrypt');

// When a user sends us their password to log in we will use this
// function to decrypt it. It takes in the password they will send
// us as they try to log in (unhashedPassword), then the salt and the
// password we stored in the database (hashedPassword).
function bcrypt_decrypt(unhashedPassword, salt, hashedPassword) {
	return hashedPassword === bcrypt.hashSync(unhashedPassword, salt);
}

// This is the encryption function we use when a user wants to create
// an account. It takes in their username and password, generates a 
// salt, then hashes the password together with the salt. Normally
// we would store the hashed password and salt, but in this case we
// will pass to the previously defined decrypt function to show how
// it works
const bcrypt_encrypt = (username, email, password) => {
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(password, salt, (err, key) => {
			console.log("bcrypt Store the salt: " + salt + " and hash: " + key)
			
            user.create({
                user_name: username,
                email: email,
                password: password,
                hashed_password: key,
                salt: salt
            });
        });
	});
}

const update_bcrypt_encrypt = (email, password) => {
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(password, salt, (err, key) => {
			console.log("bcrypt Store the updated salt: " + salt + " and updated hash: " + key)
			
            user.update({
                password: password,
                hashed_password: key,
                salt: salt
            }, {
                where: {
                    email: email
                }
            });
        });
	});
}

module.exports = {
    findAllPlaylists: async (req, res) => {
        try {
            const user_id = req.params.id;

            const _user = await user.findByPk(user_id);

            // Check if user exists or not
            if (!_user) {
                return res.status(400).json({ message: "User not found" });
            }

            const playlists = await video.findAll({ where: { user_id: user_id } });

            if (playlists.length === 0) {
                return res.status(404).json({ message: "No playlists were found" });
            }

            res.status(200).json(playlists);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    signup: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            if(!username || !email || !password) {
                return res.status(400).json({ success: false, data: null, message: "All fields are required" });
            }

            bcrypt_encrypt(username, email, password);

            const _user = await user.findOne({ where: { user_name: username, email: email } });
            if (!_user) {
                return res.status(400).json({ success: false, data: null, message: "User not created" });
            }

            res.status(200).json({ success: true, data: _user, message: "User created successfully" });
        } catch (error) {
            res.status(500).json({ success: false, data: null, error: error.message });
        }
    },

    login : async (req, res) => {
        try {
            const { email, password } = req.body;
            if(!email || !password) {
                return res.status(400).json({ success: false, data: null, message: "All fields are required" });
            }

            const _user = await user.findOne({ where: { email: email } });
            if (!_user) {
                return res.status(400).json({ success: false, data: null, message: "User not found" });
            }

            const isValid = bcrypt_decrypt(password, _user.salt, _user.hashed_password);

            if (!isValid) {
                return res.status(400).json({ success: false, data: null, message: "Invalid credentials" });
            }

            res.status(200).json({ success: true, data: _user, message: "User logged in successfully" });
        } catch (error) {
            res.status(500).json({ success: false, data: null, error: error.message });
        }
    },

    findUser: async (req, res) => {
        try {
            const { username, email } = req.body;
            
            const _user = await user.findOne({ where: { user_name: username, email: email } });
            if (!_user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(200).json({ success: true, data: _user });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    forgetPassword: async (req, res) => {
        try {
            const { email, password } = req.body;
            const _user = await user.findOne({ where: { email: email } });
            if (!_user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            
            update_bcrypt_encrypt(email, password);
            
            res.status(200).json({ success: true, message: "Password reset successfully" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }   
}