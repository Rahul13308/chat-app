/**
* Real Time chatting app
* @author Shashank Tiwari
*/
'use strict';

const path = require('path');
const helper = require('./helper');

class Socket{

    constructor(socket){
        this.io = socket;
    }
    
    socketEvents(){

        this.io.on('connection', (socket) => {
			
			/**
            * get the user's groups list
            */
            socket.on('group-list', async (userId) => {
				
               let groupListResponse = {};

                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

                    groupListResponse.error = true;
                    groupListResponse.message = 'User does not exits.';
                    
                    this.io.emit('group-list-response',groupListResponse);
                }else{

                    const result = await helper.getUserGroups(userId);
					console.log(result);
                    this.io.to(socket.id).emit('group-list-response', {
                        error: result !== null ? false : true,
                        singleUser: false,
                        groupList: result
                    });
				}
            });
			/**
            * get the user's contact list
            */
             socket.on('contact-list', async (userId) => {
				
               let contactListResponse = {};

                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

                    contactListResponse.error = true;
                    contactListResponse.message = 'User does not exits.';
                    
                    this.io.emit('contact-list-response',contactListResponse);
                }else{

                    const result = await helper.getUserContacts(userId);
					console.log(result);
                    this.io.to(socket.id).emit('contact-list-response', {
                        error: result !== null ? false : true,
                        singleUser: false,
                        contactList: result
                    });
				}
            }); 
			
			
			

            /**
            * get the user's Chat list
            */
            socket.on('chat-list', async (userId) => {

               let chatListResponse = {};

                if (userId === '' && (typeof userId !== 'string' || typeof userId !== 'number')) {

                    chatListResponse.error = true;
                    chatListResponse.message = 'User does not exits.';
                    
                    this.io.emit('chat-list-response',chatListResponse);
                }else{
                    const result = await helper.getChatList(userId, socket.id);
                    this.io.to(socket.id).emit('chat-list-response', {
                        error: result !== null ? false : true,
                        singleUser: false,
                        chatList: result.chatlist
                    });

                    socket.broadcast.emit('chat-list-response', {
                        error: result !== null ? false : true,
                        singleUser: true,
                        chatList: result.userinfo
                    });
                }
            });
            /**
            * send the messages to the user
            */
            socket.on('add-message', async (data) => {
                
                if (data.message === '') {
                    
                    this.io.to(socket.id).emit('add-message-response',`Message cant be empty`); 

                }else if(data.fromUserId === ''){
                    
                    this.io.to(socket.id).emit('add-message-response',`Unexpected error, Login again.`); 

                }else if(data.toUserId === ''){
                    
                    this.io.to(socket.id).emit('add-message-response',`Select a user to chat.`); 

                }else{                    
                    let toSocketId = data.toSocketId;
                    const sqlResult = await helper.insertMessages({
                        fromUserId: data.fromUserId,
                        toUserId: data.toUserId,
                        message: data.message,
						type: data.type
                    });
                    this.io.emit('add-message-response', data); 
                }               
            });
			
			
			
			
			

			/**
            * send the messages to the group
            */
            socket.on('add-message-group', async (data) => {
                
                if (data.message === '') {
                    
                    this.io.to(socket.id).emit('add-message-group-response','Message cant be empty'); 

                }else if(data.fromUserId === ''){
                    
                    this.io.to(socket.id).emit('add-message-group-response','Unexpected error, Login again.'); 

                }else if(data.groupId === ''){
                    
                    this.io.to(socket.id).emit('add-message-group-response','Select a group to chat.'); 

                }else{                    
                    let toSocketId = data.toSocketId;
					//cosole.log(toSocketId);
                    const sqlResult = await helper.insertGroupMessages({
                        fromUserId: data.fromUserId,
                        groupId: data.groupId,
                        message: data.message,
                        username: data.username,
						type: data.type
                    });
                  
					 this.io.emit('add-message-group-response', data); 
                }               
            });
			
			

            /**
            * Logout the user
            */
            socket.on('logout', async () => {
                const isLoggedOut = await helper.logoutUser(socket.id);
                this.io.to(socket.id).emit('logout-response',{
                    error : false
                });
                socket.disconnect();
            });


            /**
            * sending the disconnected user to all socket users. 
            */
            socket.on('disconnect',async ()=>{
                const isLoggedOut = await helper.logoutUser(socket.id);
                setTimeout(async ()=>{
                    const isLoggedOut = await helper.isUserLoggedOut(socket.id);
                    if (isLoggedOut && isLoggedOut !== null) {
                        socket.broadcast.emit('chat-list-response', {
                            error: false,
                            userDisconnected: true,
                            socketId: socket.id
                        });
                    }
                },1000);
            });
			
			
			/**
            * Add new group
            */
            socket.on('add-new-group', async (data) => {
                
                if (data.group_name === '') {
                    
                    this.io.to(socket.id).emit('add-new-group-response','Type group name '); 

                }/* else if(data.fromUserId === ''){
                    
                    this.io.to(socket.id).emit('add-new-group-response','Unexpected error, Login again.'); 

                } */else if(data.selected_users === ''){
                    
                    this.io.to(socket.id).emit('add-new-group-response','Select a users.'); 

                }else{                    
                    //let toSocketId = data.toSocketId;
					//cosole.log(toSocketId);
                    const sqlResult = await helper.insertNewGroup({
                        selected_users: data.selected_users,
                        group_name: data.group_name
                       //console.log(sqlResult);
                    });
                  console.log(sqlResult);
				 this.io.to(socket.id).emit('add-new-group-response', {
                        error: sqlResult !== null ? false : true,
                        singleUser: false,
                        groupList: sqlResult
                    });
					 this.io.emit('add-message-group-response', data); 
                }               
            });
			
			socket.on('add-attchment-contact', async (data) => {
				this.io.emit('add-message-response', data); 
                             
            });
			
			socket.on('add-attchment-group', async (data) => {
				this.io.emit('add-message-group-response', data); 
                             
            });
			
			
			
			

        });

    }
    
    socketConfig(){

        this.io.use( async (socket, next) => {
            let userId = socket.request._query['userId'];
            let userSocketId = socket.id;          
            const response = await helper.addSocketId( userId, userSocketId);
            if(response &&  response !== null){
                next();
            }else{
                console.error(`Socket connection failed, for  user Id ${userId}.`);
            }
        });

        this.socketEvents();
    }
}
module.exports = Socket;