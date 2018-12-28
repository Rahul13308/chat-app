/**
* Real Time chatting app
* @author Shashank Tiwari
*/

'user strict';
const DB = require('./db');

class Helper{
	
	constructor(app){
		this.db = DB;
	}

	async userNameCheck (username){
		return await this.db.query(`SELECT count(username) as count FROM user WHERE LOWER(username) = ?`, `${username}`);
	}

	async registerUser(params){
		try {
			return await this.db.query("INSERT INTO user (`username`,`password`,`online`) VALUES (?,?,?)", [params['username'],params['password'],'Y']);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	async loginUser(params){
		try {
			return await this.db.query('SELECT id FROM user WHERE LOWER(username) = ? AND password = ?', [params.username,params.password]);
		} catch (error) {
			return null;
		}
	}

	async userSessionCheck(userId){
		try {
			const result = await this.db.query('SELECT online,username FROM user WHERE id = ? AND online = ?', [userId,'Y']);
			if(result !== null){
				return result[0]['username'];
			}else{
				return null;
			}
		} catch (error) {
			return null;
		}
	}

	async addSocketId(userId, userSocketId){
		try {
			return await this.db.query('UPDATE user SET socketid = ?, online= ? WHERE id = ?', [userSocketId,'Y',userId]);
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	async isUserLoggedOut(userSocketId){
		try {
			return await this.db.query('SELECT online FROM user WHERE socketid = ?', [userSocketId]);
		} catch (error) {
			return null;
		}
	}

	async logoutUser(userSocketId){
		return await this.db.query('UPDATE user SET socketid = ?, online= ? WHERE socketid = ?', ['','N',userSocketId]);
	}

	async getChatList(userId, userSocketId){
		console.log(userId, userSocketId);
		try {
			return Promise.all([
				this.db.query('SELECT id,username,online,socketid FROM user WHERE id = ?', [userId]),
				this.db.query('SELECT id,username,online,socketid FROM user WHERE online = ? and socketid != ?', ['Y',userSocketId])
			]).then( (response) => {
				return {
					userinfo : response[0].length > 0 ? response[0][0] : response[0],
					chatlist : response[1]
				};
			}).catch( (error) => {
				console.warn(error);
				return (null);
			});
		} catch (error) {
			console.warn(error);
			return null;
		}
	}

	async insertMessages(params){
		try {
			return await this.db.query(
				"INSERT INTO message (`from_user_id`,`to_user_id`,`message`,`type`) values (?,?,?,?)",
				[params.fromUserId, params.toUserId, params.message,params.type]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}

	async getMessages(userId, toUserId){
		try {
			return await this.db.query(
				`SELECT id,from_user_id as fromUserId,to_user_id as toUserId,message,type FROM message WHERE 
					(from_user_id = ? AND to_user_id = ? )
					OR
					(from_user_id = ? AND to_user_id = ? )	ORDER BY id ASC				
				`,
				[userId, toUserId, toUserId, userId]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	
	async getUserGroups(userId){
		try {
			const result = await this.db.query('SELECT t1.id,t1.group_name FROM groups t1 INNER JOIN group_users t2 ON t1.id=t2.group_id WHERE t2.user_id LIKE ?', '%' + userId + '%');
				if(result !== null){
					return result;
				}else{
					return null;
				}
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	async getGroupMessages(userId,groupId){
		try {
			return await this.db.query(
				`SELECT t1.id,t1.from_user_id as fromUserId,t1.message ,t2.username, t1.type FROM group_messages t1 INNER JOIN user t2 on t1.from_user_id=t2.id  OR t1.from_user_id=0 WHERE 
					group_id = ? GROUP BY(id)	ORDER BY id ASC				
				`,
				[groupId]
			);
			
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	 async getUserContacts(userId){
		try {
			const result = await this.db.query(`SELECT id,username FROM user WHERE NOT id = ?`,
				[userId]);
				if(result !== null){
					return result;
				}else{
					return null;
				}
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	async insertGroupMessages(params){
		try {
			return await this.db.query(
				"INSERT INTO group_messages (`from_user_id`,`group_id`,`message`,`type`) values (?,?,?,?)",
				[params.fromUserId, params.groupId,params.message, params.type]
			);
		} catch (error) {
			console.warn(error);
			return null;
		}		
	}
	async insertNewGroup(params){
		try {
			const result=await this.db.query("INSERT INTO groups (`group_name`) VALUES (?)", [params['group_name']]);
			if(result){
				const result1=await this.db.query("INSERT INTO group_users (`group_id`,`user_id`) VALUES (?,?)", [result.insertId,params.selected_users]);
				if(result1!==null){
					return {"id":result.insertId,"group_name":params['group_name']};
				}else{
					return null;
				}
			}else{
					return null;
			}
			
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async leaveFromGroup(userId,groupId){
		try {
			const result=await this.db.query('SELECT user_id FROM group_users WHERE group_id = ?',
				[groupId]);
			if(result){
				const str=result[0]['user_id'];
				const array = str.split(",");
				const index = array.indexOf(userId);
				if (index !== -1) array.splice(index, 1);
				const selected_users=array.toString();
				const result1=await this.db.query('UPDATE group_users SET user_id=? WHERE group_id=?',[selected_users,groupId]);
				if(result1!==null){
					return {"msg":"Deleted From Group"};
				}else{
					return null;
				}
			}else{
					return null;
			}
			
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	async getGroupUsers(groupId){
		try {
			const result = await this.db.query(`SELECT group_id,user_id FROM group_users WHERE group_id = ?`,
				[groupId]);
				if(result !== null){
					return result;
				}else{
					return null;
				}
		} catch (error) {
			console.warn(error);
			return null;
		}
	}
	async addNewUsersGroup(selected_users,groupId){
		try {
			const result1=await this.db.query('UPDATE group_users SET user_id=? WHERE group_id=?',[selected_users,groupId]);
				if(result1!==null){
					return result1;
				}else{
					return null;
				}
		} catch (error) {
			console.error(error);
			return null;
		}
	}
	
	
}
module.exports = new Helper();