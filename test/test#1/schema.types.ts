export type authority =
	"OWNER" |
	"ADMINISTRATOR" |
	"MEMBER" |
	"CUSTOM" 

export interface user_info {
	birthday: Date;
	favorite_color: string;
	first_pet_name: string;
	pet_authority: authority;
};

export interface user {
	id: string;
	username: string;
	password_hash: string;
	description?: string;
	picture?: string;
	additional_info: user_info;
};

