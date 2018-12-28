/**
 * Real Time chatting app
 * @author Shashank Tiwari
 */
'user strict';

app.controller('homeController', 
function($scope, Upload, $routeParams, $location, appService) {


    const UserId = $routeParams.userId;
    $scope.data = {
        username: '',
        chatlist: [],
        selectedFriendId: null,
        selectedFriendName: null,
        selectedGroupId: null,
        selectedGroupName: null,
        messages: [],
        grouplist: [],
        groupmessages: [],
        contactlist: [],
        selectedContactId: null,
        selectedContactName: null,
        //SelectedUsers: [],
        group_name: '',
        selectedGroupUsers: null,
    };

    appService.connectSocketServer(UserId);

    appService.httpCall({
            url: '/userSessionCheck',
            params: {
                'userId': UserId
            }
        })
        .then((response) => {
            $scope.data.username = response.username;
            appService.socketEmit('chat-list', UserId);
            appService.socketOn('chat-list-response', (response) => {
                $scope.$apply(() => {
                    if (!response.error) {
                        if (response.singleUser) {
                            /* 
                             * Removing duplicate user from chat list array
                             */
                            if ($scope.data.chatlist.length > 0) {
                                $scope.data.chatlist = $scope.data.chatlist.filter(function(obj) {
                                    return obj.id !== response.chatList.id;
                                });
                            }
                            /* 
                             * Adding new online user into chat list array
                             */
                            $scope.data.chatlist.push(response.chatList);
                        } else if (response.userDisconnected) {
                            /* 
                             * Removing a user from chat list, if user goes offline
                             */
                            $scope.data.chatlist = $scope.data.chatlist.filter(function(obj) {
                                return obj.socketid !== response.socketId;
                            });
                        } else {
                            /* 
                             * Updating entire chatlist if user logs in
                             */
                            $scope.data.chatlist = response.chatList;
                        }
                    } else {
                        alert(`Faild to load Chat list`);
                    }
                });
            });
            /*
             * This eventt will display all the groups
             */
            appService.socketEmit('group-list', UserId);
            appService.socketOn('group-list-response', (response) => {
                $scope.$apply(() => {
                    if (!response.error) {
                        $scope.data.grouplist = response.groupList;

                    } else {
                        alert(`Faild to load Groups `);
                    }
                });
            });
            /*
             * This eventt will display newly added  group
             */

            appService.socketOn('add-new-group-response', (response) => {
                console.log(response);
                $scope.$apply(() => {
                    if (!response.error) {
                        $scope.data.grouplist.push(response.groupList);

                        alert('Group Created');
                        document.querySelector('#groupname').value = '';
                        document.querySelector('#addUsersGroup').value = '';

                    } else {
                        alert('Faild to create Group');
                    }
                });
            });




            /*
             * This eventt will display all the contacts
             */
            appService.socketEmit('contact-list', UserId);
            appService.socketOn('contact-list-response', (response) => {
                $scope.$apply(() => {
                    if (!response.error) {
                        $scope.data.contactlist = response.contactList;

                    } else {
                        alert('Faild to load Contacts');
                    }
                });
            });


            /*
             * This eventt will display the new incoming message
             */
            appService.socketOn('add-message-response', (response) => {
                $scope.$apply(() => {
                    if (response && (response.fromUserId == $scope.data.selectedFriendId|| $scope.data.selectedContactId)&& response.fromUserId!==UserId) {
                        $scope.data.messages.push(response);
                        appService.scrollToBottom();

                    }
                });
            });
			
			
			

            /*
             * This event will display the new incoming message in group
             */
            appService.socketOn('add-message-group-response', (response) => {
                $scope.$apply(() => {
                    if (response && response.groupId == $scope.data.selectedGroupId && response.fromUserId != UserId &&response.fromUserId!=0) {
                        $scope.data.groupmessages.push(response);
                        appService.scrollToBottom();
                    }
                });
            });



        })
        .catch((error) => {
            console.log(error.message);
            $scope.$apply(() => {
                $location.path(`/`);
            });
        });

    /** Highlighting the selected user from the chat list*/
    $scope.selectFriendToChat = (friendId) => {
        const friendData = $scope.data.chatlist.filter((obj) => {
            return obj.id === friendId;
        });
        $scope.data.selectedFriendName = friendData[0]['username'];
        $scope.data.selectedFriendId = friendId;


        $scope.data.selectedGroupName = null;
        $scope.data.selectedGroupId = null;
        $scope.data.selectedContactName = null;
        $scope.data.selectedContactId = null;

        /**
         * This HTTP call will fetch chat between two users
         */
        appService.getMessages(UserId, friendId).then((response) => {
            $scope.$apply(() => {
                $scope.data.messages = response.messages;
                appService.scrollToBottom();
            });
        }).catch((error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
    }

    /** Highlighting the selected group from the group list*/
    $scope.selectGroupToChat = (groupId) => {

        const groupData = $scope.data.grouplist.filter((obj) => {
            return obj.id === groupId;
        });
        $scope.data.selectedGroupName = groupData[0]['group_name'];
        $scope.data.selectedGroupId = groupId;

        $scope.data.selectedFriendName = null;
        $scope.data.selectedFriendId = null;
        $scope.data.selectedContactName = null;
        $scope.data.selectedContactId = null;
        /**
         * This HTTP call will fetch chat for a group
         */
        appService.getGroupMessages(UserId, groupId).then((response) => {
            $scope.$apply(() => {
                $scope.data.groupmessages = response.groupmessages;
                appService.scrollToBottom();
            });
        }).catch((error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
		/**
         * This HTTP call will fetch chat for a group
         */
        appService.getGroupUsers(groupId).then((response) => {
			console.log(response);
            $scope.$apply(() => {
              $scope.data.selectedGroupUsers = response.group_users[0].user_id;
			  console.log( $scope.data.selectedGroupUsers);
			  const str=response.group_users[0].user_id;
				const array = str.split(",");
			  console.log(array);
				//const arr=$scope.data.selectedGroupUsers.map(a => a.user_id);
              //console.log(arr); 
			 // $scope.data.selectedGroupUsers=2;
			  
			  
				//const array = str.split(",");			  
            });
        }).catch((error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
		
    }


    /** Highlighting the selected user from the Contact list*/
    $scope.selectContactToChat = (contactId) => {
        const contactData = $scope.data.contactlist.filter((obj) => {
            return obj.id === contactId;
        });
        $scope.data.selectedContactName = contactData[0]['username'];
        $scope.data.selectedContactId = contactId;
        $scope.data.selectedGroupName = null;
        $scope.data.selectedGroupId = null;
        $scope.data.selectedFriendName = null;
        $scope.data.selectedFriendId = null;

        /**
         * This HTTP call will fetch chat between two users
         */
        appService.getMessages(UserId, contactId).then((response) => {
            $scope.$apply(() => {
                $scope.data.messages = response.messages;
                appService.scrollToBottom();
            });
        }).catch((error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
    }

    /****************send messages to online users**************/

    $scope.sendMessage = (event) => {

        if (event.keyCode === 13) {

            let toUserId = null;
            let toSocketId = null;
            let type = null;

            /* Fetching the selected User from the chat list starts */
            let selectedFriendId = $scope.data.selectedFriendId;
            if (selectedFriendId === null) {
                return null;
            }
            friendData = $scope.data.chatlist.filter((obj) => {
                return obj.id === selectedFriendId;
            });
            /* Fetching the selected User from the chat list ends */

            /* Emmiting socket event to server with Message, starts */
            if (friendData.length > 0) {

                toUserId = friendData[0]['id'];
                toSocketId = friendData[0]['socketid'];

                let messagePacket = {
                    message: document.querySelector('#message').value,
                    fromUserId: UserId,
                    toUserId: toUserId,
                    toSocketId: toSocketId,
                    type: "text",
                };
                $scope.data.messages.push(messagePacket);
                appService.socketEmit(`add-message`, messagePacket);

                document.querySelector('#message').value = '';
                appService.scrollToBottom();
            } else {
                alert('Unexpected Error Occured,Please contact Admin');
            }
            /* Emmiting socket event to server with Message, ends */
        }
    }
    /****************send messages to any user online/offline users **************/

    $scope.sendContactMessage = (event) => {
        if (event.keyCode === 13) {
            let toUserId = null;
            let toSocketId = null;
            let type = null;

            /* Fetching the selected User from the chat list starts */
            let selectedContactId = $scope.data.selectedContactId;
            if (selectedContactId === null) {
                return null;
            }
            contactData = $scope.data.contactlist.filter((obj) => {
                return obj.id === selectedContactId;
            });
            /* Fetching the selected User from the chat list ends */

            /* Emmiting socket event to server with Message, starts */
            if (contactData.length > 0) {

                toUserId = contactData[0]['id'];
                //toSocketId = contactData[0]['socketid'];            

                let messagePacket = {
                    message: document.querySelector('#contactmessage').value,
                    fromUserId: UserId,
                    toUserId: toUserId,
                    type: 'text',
                    //toSocketId: toSocketId
                };
                $scope.data.messages.push(messagePacket);
                appService.socketEmit('add-message', messagePacket);

                document.querySelector('#contactmessage').value = '';
                appService.scrollToBottom();
            } else {
                alert('Unexpected Error Occured,Please contact Admin');
            }
            /* Emmiting socket event to server with Message, ends */
        }
    }

    /****************send messages in group **************/

    $scope.sendGroupMessage = (event) => {
        if (event.keyCode === 13) {
            let toGroupId = null;
            let toSocketId = null;
            let type = null;
            let username = $scope.data.username;
            /* Fetching the selected group from the chat list starts */
            let selectedGroupId = $scope.data.selectedGroupId;
            if (selectedGroupId === null) {
                return null;
            }
            groupData = $scope.data.grouplist.filter((obj) => {
                return obj.id === selectedGroupId;
            });

            /* Fetching the selected User from the chat list ends */

            /* Emmiting socket event to server with Message, starts */
            if (groupData.length > 0) {
                toGroupId = groupData[0]['id'];
                toSocketId = groupData[0]['socketid'];

                let messageGroupPacket = {
                    message: document.querySelector('#groupmessage').value,
                    fromUserId: UserId,
                    groupId: toGroupId,
                    toSocketId: toSocketId,
                    username: username,
                    type: "text",
                };
                $scope.data.groupmessages.push(messageGroupPacket);
                appService.socketEmit('add-message-group', messageGroupPacket);

                document.querySelector('#groupmessage').value = '';
                appService.scrollToBottom();
            } else {
                alert('Unexpected Error Occured,Please contact Admin');
            }
            /* Emmiting socket event to server with Message, ends */
        }
    }

    /******** create new group*******************/

    $scope.CreateGroup = () => {
		$scope.data.selectedGroupName = null;
        $scope.data.selectedGroupId = null;
        $scope.data.selectedFriendName = null;
        $scope.data.selectedFriendId = null;
        $scope.data.selectedContactId = null;
        $scope.data.selectedContactName = null;
        let selected_users = $scope.data.SelectedUsers;
        selected_userss = selected_users.push(UserId);
        let group_name = $scope.data.group_name;
        let prase = JSON.stringify(selected_users).slice(1, -1);
        selected_users = prase.replace(/['"]+/g, '');
        console.log(selected_users);
        let createGroupPacket = {
            selected_users: selected_users,
            group_name: group_name

        };
        appService.socketEmit('add-new-group', createGroupPacket);
        $scope.data.SelectedUsers == null;
        $scope.data.group_name == null;
    }
/*
* send attachment to users
*/
    $scope.upload = function(file) {
        let toUserId = null;
        let toSocketId = null;

        /* Fetching the selected User from the chat list starts */
        let selectedContactId = $scope.data.selectedContactId;
        if (selectedContactId === null) {
		   let selectedFriendId = $scope.data.selectedFriendId;
			contactData = $scope.data.chatlist.filter((obj) => {
                return obj.id === selectedFriendId;
            });
        }else{
        contactData = $scope.data.contactlist.filter((obj) => {
            return obj.id === selectedContactId;
        });
		}
        /* Fetching the selected User from the chat list ends */

        /* Emmiting socket event to server with Message, starts */
        if (contactData.length > 0) {
            toUserId = contactData[0]['id'];
            Upload.upload({
                url: '/uploads',
                file: file,
                data: {
                    username: $scope.data.username,
                    fromUserId: UserId,
                    toUserId: toUserId
                },

            }).progress(function(evt) {
                let progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            }).success(function(data, status, headers, config) {
				let j=JSON.stringify(data);
				let obj = JSON.parse(j);
				$scope.data.messages.push(obj.uploadmessage);
				appService.scrollToBottom();
				appService.socketEmit('add-attchment-contact', obj.uploadmessage);
				
            }).error(function(data, status, headers, config) {
                console.log('error status: ' + status);
            })
        }
    }
/*
* send attachment in groups
*/
    $scope.uploadGroup = function(file) {
		let toGroupId = null;
		let toSocketId = null;
		let type = null;
		let username = $scope.data.username;
		let selectedGroupId = $scope.data.selectedGroupId;
		if (selectedGroupId === null) {
			return null;
		}
		groupData = $scope.data.grouplist.filter((obj) => {
			return obj.id === selectedGroupId;
		});
		if (groupData.length > 0) {
			toGroupId = groupData[0]['id'];
			toSocketId = groupData[0]['socketid'];
            Upload.upload({
                url: '/groupAttchement',
                file: file,
                data: {
                    username: $scope.data.username,
					fromUserId: UserId,
					groupId: toGroupId,
					toSocketId: toSocketId,
					type: "file",
                },

            }).progress(function(evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            }).success(function(data, status, headers, config) {
                console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
				let j=JSON.stringify(data);
				let obj = JSON.parse(j);
				$scope.data.groupmessages.push(obj.uploadmessage);
				appService.scrollToBottom();
				appService.socketEmit('add-attchment-group', obj.uploadmessage);
				
            }).error(function(data, status, headers, config) {
                console.log('error status: ' + status);
            })
        }
    }
	/*
* Leave group
*/	$scope.leaveFromGroup = (groupId) => {
        const groupData = $scope.data.grouplist.filter((obj) => {
            return obj.id === groupId;
        });
        group_name = groupData[0]['group_name'];
        $scope.data.selectedGroupId = groupId;
        appService.leaveFromGroup(UserId, groupId).then((response) => {
			console.log(response);
		 let messageGroupPacket = {
				message:$scope.data.username + ' has left the group.' ,
				fromUserId: 0,
				groupId: groupId,
				username: 'admin',
				type: "text",
			};
			$scope.data.groupmessages.push(messageGroupPacket);
			appService.socketEmit('add-message-group', messageGroupPacket);
			 $scope.data.selectedGroupName = null;
			$scope.data.selectedGroupId = null; 
			$scope.data.grouplist = $scope.data.grouplist.filter((obj) => {
					return obj.id !== groupId;
				});
			alert('You have left from this group');
        }).catch((error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
    }
/*
* open modal
*/	 
	 /* $scope.selectGroupToEdit = (groupId) => {
	alert('hello');
	 } */
/*
* add users in a group
*/	 $scope.addUsersInGroup = (groupId) => {
        const groupData = $scope.data.grouplist.filter((obj) => {
            return obj.id === groupId;
        });
         let selected_users = $scope.data.addSelectedUsers;
        selected_userss = selected_users.push(UserId);
        let group_name = $scope.data.selectedGroupName;
        let prase = JSON.stringify(selected_users).slice(1, -1);
        selected_users = prase.replace(/['"]+/g, '');
        console.log(selected_users);
      
		appService.addNewUsersGroup(selected_users, groupId).then((response) => {
			console.log(response);
		 let messageGroupPacket = {
				message:$scope.data.username + ' has added new users.' ,
				fromUserId: 0,
				groupId: groupId,
				username: 'admin',
				type: "text",
			};
			$scope.data.groupmessages.push(messageGroupPacket);
			appService.socketEmit('add-message-group', messageGroupPacket);
			alert('You have added new users in this group');
        }).catch((error) => {
            console.log(error);
            alert('Unexpected Error, Contact your Site Admin.');
        });
		
		
		
		
    } 

	
	
	
	
	
	
	

	console.log($scope.data.selectedGroupUsers);
	$scope.roles = [{id:1, name:"Administrator"}, {id:2, name: "Student"}];
$scope.user = {};
$scope.user.roles = [ $scope.roles[0],$scope.roles[1] ];
	
	
    $scope.alignMessage = (fromUserId) => {

        return fromUserId == UserId ? true : false;
    }

    $scope.logout = () => {
        appService.socketEmit('logout', UserId);
        $location.path('/');
    }




});