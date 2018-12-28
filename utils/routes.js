/**
* Real Time chatting app
* @author Shashank Tiwari
*/

'use strict';

const helper = require('./helper');
const path = require('path');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const fs  = require('fs');
//const app.io = socketio;
class Routes{

	constructor(app){

		this.app = app;
	}
	
	appRoutes(){
		this.app.post('/usernameCheck',async (request,response) =>{
			const username = request.body.username;
			if (username === "" || username === undefined || username === null) {
				response.status(412).json({
					error : true,
					message : `username cant be empty.`
				});
			} else {
				const data = await helper.userNameCheck(username.toLowerCase());
				if (data[0]['count'] > 0) {
					response.status(401).json({
						error:true,
						message: 'This username is alreday taken.'
					});
				} else {
					response.status(200).json({
						error:false,
						message: 'This username is available.'
					});
				}
			}
		});		

		this.app.post('/registerUser', async (request,response) => {
			const registrationResponse = {}
			const data = {
				username : (request.body.username).toLowerCase(),
				password : request.body.password
			};			
			if(data.username === '') {
	            registrationResponse.error = true;
	            registrationResponse.message = `username cant be empty.`;
	            response.status(412).json(registrationResponse);
	        }else if(data.password === ''){				            
	            registrationResponse.error = true;
	            registrationResponse.message = `password cant be empty.`;
	            response.status(412).json(registrationResponse);
	        }else{	        	
				const result = await helper.registerUser( data );
				if (result === null) {
					registrationResponse.error = true;
					registrationResponse.message = `User registration unsuccessful,try after some time.`;
					response.status(417).json(registrationResponse);
				} else {
					registrationResponse.error = false;
					registrationResponse.userId = result.insertId;
					registrationResponse.message = `User registration successful.`;
					response.status(200).json(registrationResponse);
				}
	        }
		});

		this.app.post('/login',async (request,response) =>{
			const loginResponse = {}
			const data = {
				username : (request.body.username).toLowerCase(),
				password : request.body.password
			};
			if(data.username === '' || data.username === null) {
	            loginResponse.error = true;
	            loginResponse.message = `username cant be empty.`;
	            response.status(412).json(loginResponse);
	        }else if(data.password === '' || data.password === null){				            
	            loginResponse.error = true;
	            loginResponse.message = `password cant be empty.`;
	            response.status(412).json(loginResponse);
	        }else{
				const result = await helper.loginUser(data);
				if (result === null || result.length === 0) {
					loginResponse.error = true;
					loginResponse.message = `Invalid username and password combination.`;
					response.status(401).json(loginResponse);
				} else {
					loginResponse.error = false;
					loginResponse.userId = result[0].id;
					loginResponse.message = `User logged in.`;
					response.status(200).json(loginResponse);
				}
	        }
		});
		
		this.app.post('/userSessionCheck', async (request,response) =>{
			const userId = request.body.userId;
			const sessionCheckResponse = {}			
			if (userId == '') {
				sessionCheckResponse.error = true;
	            sessionCheckResponse.message = `User Id cant be empty.`;
	            response.status(412).json(sessionCheckResponse);
			}else{
				const username = await helper.userSessionCheck(userId);
				if (username === null || username === '') {
					sessionCheckResponse.error = true;
					sessionCheckResponse.message = `User is not logged in.`;
					response.status(401).json(sessionCheckResponse);
				}else{
					sessionCheckResponse.error = false;
					sessionCheckResponse.username = username;
					sessionCheckResponse.message = `User logged in.`;
					response.status(200).json(sessionCheckResponse);
				}
	        }
		});
		
		this.app.post('/getMessages',async (request,response) => {
			const userId = request.body.userId;
			const toUserId = request.body.toUserId;
			const messages = {}			
			if (userId === '') {
				messages.error = true;
	            messages.message = `userId cant be empty.`;
	            response.status(200).json(messages);
			}else{
				const result = await helper.getMessages( userId, toUserId);
				if (result ===  null) {
					messages.error = true;
					messages.message = `Internal Server error.`;
					response.status(500).json(messages);
				}else{
					messages.error = false;
					messages.messages = result;
					response.status(200).json(messages);
				}
	        }
		});
		
		this.app.post('/getGroupMessages',async (request,response) => {
			const userId = request.body.userId;
			const groupId = request.body.groupId;
			const groupmessages = {}			
			if (userId === '') {
				groupmessages.error = true;
	            groupmessages.groupmessages = `userId cant be empty.`;
	            response.status(200).json(groupmessages);
			}else{
				const result = await helper.getGroupMessages( userId, groupId);
				if (result ===  null) {
					groupmessages.error = true;
					groupmessages.groupmessages = `Internal Server error.`;
					response.status(500).json(groupmessages);
				}else{
					groupmessages.error = false;
					groupmessages.groupmessages = result;
					response.status(200).json(groupmessages);
				}
	        }
		});
		
	 this.app.post('/uploads', multipartMiddleware, async function(req, resp) {
			const uploadmessage = {}
			var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
			var string_length = 2;
			var randomstring = '';
			for (var i=0; i<string_length; i++) {
				var rnum = Math.floor(Math.random() * chars.length);
				randomstring += chars.substring(rnum,rnum+1);
			}

			  fs.readFile(req.files.file.path, async function (err, data) {
				  
				  const fileNm=randomstring + req.files.file.name;
				req.files.file.path = path.join(__dirname + "../../client/uploads/"+fileNm);
				fs.writeFile(req.files.file.path, data, async function (err) {
				  if (err) {
					return console.warn(err);
				  }else{
					  console.log("The file: " + fileNm + " was saved to " + req.files.file.path );
						const result=await helper.insertMessages({
								fromUserId: req.body.fromUserId,
								toUserId: req.body.toUserId,
								message: fileNm, 	
								type: 'file'	
					
					  });
					 // app.io.emit('call progress event', result);
					  //req.this.app.io.emit('call progress event', {key:"value"});
					  if (result ===  null) {
						uploadmessage.error = true;
						uploadmessage.uploadmessage = '500 Internal server error.';
						resp.status(500).json(uploadmessage);
					}else{
						 let messagep ={id:result.insertId,
						 fromUserId:req.body.fromUserId,
						 toUserId:req.body.toUserId,
						 message: fileNm,
						 type:"file"};
						uploadmessage.error = false;
						uploadmessage.uploadmessage = messagep;
						resp.status(200).json(uploadmessage);
					}
				}
			});
					
			});
		}); 
		/*
		* send Attachment in group
		*/
		this.app.post('/groupAttchement', multipartMiddleware,  function(req, resp) {
			  const uploadmessage = {}
			  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
			var string_length = 2;
			var randomstring = '';
			for (var i=0; i<string_length; i++) {
				var rnum = Math.floor(Math.random() * chars.length);
				randomstring += chars.substring(rnum,rnum+1);
			}
			  fs.readFile(req.files.file.path, function (err, data) {
				const fileNm=randomstring + req.files.file.name;
				req.files.file.path = path.join(__dirname + "../../client/uploads/" + fileNm);
				fs.writeFile(req.files.file.path, data, function (err) {
				  if (err) {
					return console.warn(err);
				  }else{
					  console.log("The file: " + fileNm + " was saved to " + req.files.file.path );
						const result= helper.insertGroupMessages({
								fromUserId: req.body.fromUserId,
								groupId:req.body.groupId,
								toUserId: req.body.toUserId,
								message: fileNm, 
								username: req.body.username,
								type: req.body.type	
					
					  });
					  
					  if (result ===  null) {
						uploadmessage.error = true;
						uploadmessage.uploadmessage = 'Internal Server error.';
						resp.status(500).json(uploadmessage);
					}else{
						let messagep ={id:result.insertId,
						 fromUserId:req.body.fromUserId,
						 groupId:req.body.groupId,
						 message: fileNm,
						 username: req.body.username,
						 type:"file"};
						
						uploadmessage.error = false;
						uploadmessage.uploadmessage = messagep;
						resp.status(200).json(uploadmessage);
					}
				}
			});
					
			});
		});
		
		/*
		*leave from group
		*/		
		this.app.post('/leaveFromGroupss', async(request,response) => {
			const userId = request.body.userId;
			const groupId = request.body.groupId;
			const leavemessages = {}			
			if (userId === '') {
				leavemessages.error = true;
	            leavemessages.leavemessages = 'Something went wrong, please login again.';
	            response.status(200).json(leavemessages);
			}else{
				const result = await helper.leaveFromGroup(userId, groupId);
				if (result ===  null) {
					leavemessages.error = true;
					leavemessages.leavemessages = 'Internal Server error.';
					response.status(500).json(leavemessages);
				}else{
					leavemessages.error = false;
					leavemessages.leavemessages = result;
					response.status(200).json(leavemessages);
				}
	        }
		});
		
		
		
		
		
		/*
		**get single groups users
		*/
		 this.app.post('/getGroupUsers',async (request,response) => {
			const groupId = request.body.groupId;
			const group_users = {}			
			if (groupId === '') {
				group_users.error = true;
	            group_users.group_users = `groupId cant be empty.`;
	            response.status(200).json(group_users);
			}else{
				const result = await helper.getGroupUsers(groupId);
				if (result ===  null) {
					group_users.error = true;
					group_users.group_users = `Internal Server error.`;
					response.status(500).json(group_users);
				}else{
					group_users.error = false;
					group_users.group_users = result;
					response.status(200).json(group_users);
				}
	        }
		});
		
		 
		 /*
		**add users in group
		*/
		 this.app.post('/addNewUsersGroup',async (request,response) => {
			const groupId = request.body.groupId;
			const selected_users = request.body.selected_users;
			const groupEditMsg = {}			
			if (groupId === '') {
				groupEditMsg.error = true;
	            groupEditMsg.groupEditMsg = `groupId cant be empty.`;
	            response.status(200).json(group_users);
			}else{
				const result = await helper.addNewUsersGroup(selected_users,groupId);
				if (result ===  null) {
					groupEditMsg.error = true;
					groupEditMsg.groupEditMsg = `Internal Server error.`;
					response.status(500).json(groupEditMsg);
				}else{
					groupEditMsg.error = false;
					groupEditMsg.groupEditMsg = result;
					response.status(200).json(groupEditMsg);
				}
	        }
		});
		
		 
		 
		
		
		this.app.get('*',(request,response) =>{
			response.sendFile(path.join(__dirname + '../../client/views/index.html'));
			/*
			* OR one can define the template engine and use response.render();
			*/
		});	

		
		
	}

	routesConfig(){
		this.appRoutes();
	}
}
module.exports = Routes;